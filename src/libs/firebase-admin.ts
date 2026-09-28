import { firebasePublicConfig, isFirebasePublicReady } from '@/libs/firebase-public'

export { firebasePublicConfig, isFirebasePublicReady }

const parseServiceAccount = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT || ''

  if (!raw.trim()) return null

  try {
    return JSON.parse(raw) as { project_id?: string; client_email?: string; private_key?: string }
  } catch {
    return null
  }
}

export const getFirebaseAdmin = async () => {
  const account = parseServiceAccount()

  if (!account?.project_id || !account.client_email || !account.private_key) {
    throw new Error('Add FIREBASE_SERVICE_ACCOUNT JSON in .env to send campaigns')
  }

  const { cert, getApps, initializeApp } = await import('firebase-admin/app')
  const { getMessaging } = await import('firebase-admin/messaging')

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: account.project_id,
        clientEmail: account.client_email,
        privateKey: account.private_key.replace(/\\n/g, '\n')
      })
    })
  }

  return getMessaging()
}
