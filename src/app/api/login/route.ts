import { NextResponse } from 'next/server'

import { loginAdminUser } from '@/libs/admin-auth'

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}))
  const admin = await loginAdminUser(String(email || ''), String(password || ''))

  if (!admin) {
    return NextResponse.json({ message: ['Email or Password is invalid'] }, { status: 401, statusText: 'Unauthorized Access' })
  }

  return NextResponse.json(admin)
}
