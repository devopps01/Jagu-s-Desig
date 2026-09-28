import { NextResponse } from 'next/server'

import { clearWebSession } from '@/libs/web-auth'

export async function POST() {
  await clearWebSession()

  return NextResponse.json({ ok: true })
}
