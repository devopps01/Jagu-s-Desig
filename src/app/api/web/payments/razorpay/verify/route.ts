import { NextResponse } from 'next/server'

import { completeRazorpayPayment } from '@/libs/razorpay'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const created = await completeRazorpayPayment(
      String(body.razorpay_order_id || ''),
      String(body.razorpay_payment_id || ''),
      String(body.razorpay_signature || '')
    )

    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Payment verification failed' }, { status: 400 })
  }
}
