import { NextResponse } from 'next/server'

import { verifyOtp } from '@/libs/otp'
import { createWebSession } from '@/libs/web-auth'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '')
    .trim()
    .toLowerCase()
  const otp = String(body.otp || '').trim()

  if (!email || !otp) {
    return NextResponse.json({ message: 'Email and OTP are required' }, { status: 400 })
  }

  const user = await verifyOtp(email, otp)

  if (!user) {
    return NextResponse.json({ message: 'OTP is invalid or expired' }, { status: 401 })
  }

  await createWebSession({ id: user.id, email: user.email })

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      email: user.email
    }
  })
}
