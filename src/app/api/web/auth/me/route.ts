import { NextResponse } from 'next/server'

import { getWebUserProfile } from '@/libs/otp'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  const session = await getWebSession()

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const profile = await getWebUserProfile(session.id)

  return NextResponse.json({ user: profile || session })
}
