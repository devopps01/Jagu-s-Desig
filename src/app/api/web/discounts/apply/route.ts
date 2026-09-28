import { NextResponse } from 'next/server'

import { applyDiscountCode } from '@/libs/discounts'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = await applyDiscountCode(String(body.code || ''), Number(body.subtotal) || 0)

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : 'Failed to apply discount' }, { status: 400 })
  }
}
