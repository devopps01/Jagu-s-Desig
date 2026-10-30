import { NextResponse } from 'next/server'

import { getWebUserProfile, updateWebUserContact } from '@/libs/otp'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  const session = await getWebSession()

  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const profile = await getWebUserProfile(session.id)

  return NextResponse.json({ user: profile || session })
}

export async function PATCH(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Login to update your profile' }, { status: 401 })

  try {
    const body = await req.json()
    const user = await updateWebUserContact(session.id, {
      name: String(body.name || ''),
      phone: String(body.phone || '')
    })

    return NextResponse.json({ ok: true, user, message: 'Profile saved' })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not save your profile' },
      { status: 400 }
    )
  }
}
