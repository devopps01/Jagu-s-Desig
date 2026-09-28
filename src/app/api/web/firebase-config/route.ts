import { NextResponse } from 'next/server'

import { firebasePublicConfig, isFirebasePublicReady } from '@/libs/firebase-public'

export async function GET() {
  return NextResponse.json({
    ...firebasePublicConfig(),
    configured: isFirebasePublicReady()
  })
}
