import { NextResponse } from 'next/server'

import { applyReferralSister } from '@/libs/referral-sisters'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const ref = String(body.code || body.id || '')
    const result = await applyReferralSister(ref, Number(body.subtotal) || 0)

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Failed to apply sister code' }, { status: 400 })
  }
}
