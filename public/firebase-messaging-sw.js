importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js')

self.addEventListener('install', event => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

const showPush = payload => {
  const notification = payload?.notification || {}
  const data = payload?.data || {}
  const title = notification.title || data.title || "Jagu's Designing"
  const options = {
    body: notification.body || data.body || '',
    icon: notification.icon || '/images/home/home-craft.png',
    data: { url: data.url || payload?.fcmOptions?.link || '/' }
  }

  return self.registration.showNotification(title, options)
}

self.addEventListener('push', event => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { notification: { body: event.data ? event.data.text() : '' } }
  }

  event.waitUntil(showPush(payload))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(self.clients.openWindow(url))
})

fetch('/api/web/firebase-config')
  .then(res => res.json())
  .then(config => {
if (config?.apiKey && !firebase.apps.length) {
  firebase.initializeApp(config)
}

if (firebase.apps.length) {
  firebase.messaging().onBackgroundMessage(payload => {
    showPush(payload)
  })
}
  })
  .catch(() => null)
