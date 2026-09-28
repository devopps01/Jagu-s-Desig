import { NextResponse } from 'next/server'

import { upsertDeviceToken } from '@/libs/device-tokens'
import { getWebSession } from '@/libs/web-auth'

export async function POST(req: Request) {
  try {
    const session = await getWebSession()
    const body = await req.json()
    const saved = await upsertDeviceToken({
      deviceId: String(body.deviceId || ''),
      token: String(body.token || ''),
      userId: session?.id || '',
      email: session?.email || String(body.email || ''),
      userAgent: String(body.userAgent || req.headers.get('user-agent') || ''),
      permission: body.permission === 'granted' || body.permission === 'denied' ? body.permission : 'default'
    })

    return NextResponse.json({ ok: true, id: saved.id, platform: saved.platform })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not save device' }, { status: 400 })
  }
}
