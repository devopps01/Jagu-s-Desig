const DEVICE_KEY = 'jagu-device-id'
const FIREBASE_APP_SRC = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js'
const FIREBASE_MSG_SRC = 'https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js'

type FirebaseCompat = {
  apps: unknown[]
  initializeApp: (config: Record<string, string>) => unknown
  messaging: () => {
    getToken: (options: { vapidKey?: string; serviceWorkerRegistration?: ServiceWorkerRegistration }) => Promise<string>
  }
}

declare global {
  interface Window {
    firebase?: FirebaseCompat
  }
}

const publicConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
})

export const isFirebaseConfigured = () => {
  const config = publicConfig()

  return Boolean(config.apiKey && config.projectId && config.appId)
}

export const getDeviceId = () => {
  const existing = window.localStorage.getItem(DEVICE_KEY)

  if (existing) return existing

  const id = window.crypto.randomUUID()

  window.localStorage.setItem(DEVICE_KEY, id)

  return id
}

const saveDevice = async (permission: NotificationPermission, token = '') => {
  await fetch('/api/web/device-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: getDeviceId(),
      token,
      permission,
      userAgent: navigator.userAgent
    })
  }).catch(() => null)
}

const loadScript = (src: string) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`)

    if (existing) {
      resolve()

      return
    }

    const script = document.createElement('script')

    script.src = src
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Could not load ${src}`))
    document.head.appendChild(script)
  })

const getFcmToken = async () => {
  const config = publicConfig()

  if (!config.apiKey || !config.projectId || !config.appId) return ''

  await loadScript(FIREBASE_APP_SRC)
  await loadScript(FIREBASE_MSG_SRC)

  const firebase = window.firebase

  if (!firebase) return ''
  if (!firebase.apps.length) firebase.initializeApp(config)

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' })

  return (
    (await firebase.messaging().getToken({
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || '',
      serviceWorkerRegistration: registration
    })) || ''
  )
}

export const registerWebPush = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { permission: 'denied' as NotificationPermission, token: '' }
  }

  const permission = Notification.permission
  let token = ''

  if (permission === 'granted') {
    try {
      token = await getFcmToken()
    } catch {
      token = ''
    }
  }

  await saveDevice(permission, token)

  return { permission, token }
}

export const requestWebPush = async () => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { permission: 'denied' as NotificationPermission, token: '' }
  }

  const permission = await Notification.requestPermission()

  if (permission !== 'granted') {
    await saveDevice(permission)

    return { permission, token: '' }
  }

  return registerWebPush()
}
