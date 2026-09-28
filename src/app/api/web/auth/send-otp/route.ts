import { NextResponse } from 'next/server'

import { createOtp } from '@/libs/otp'
import { sendOtpEmail } from '@/libs/mailer'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = String(body.email || '')
    .trim()
    .toLowerCase()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: 'Valid email is required' }, { status: 400 })
  }

  const record = await createOtp(email)

  await sendOtpEmail(email, record.otp)

  return NextResponse.json({
    ok: true,
    message: 'OTP sent to your email. It is valid for 1 minute.',
    expiresAt: record.expiresAt
  })
}
