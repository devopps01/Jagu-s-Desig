import { NextResponse } from 'next/server'

import { getWebSession } from '@/libs/web-auth'
import { createRazorpayOrder, quoteCheckout, razorpayKeys, saveRazorpayIntent } from '@/libs/razorpay'

export async function POST(req: Request) {
  try {
    if (!razorpayKeys().enabled) {
      return NextResponse.json({ message: 'Online payment is not configured yet' }, { status: 503 })
    }

    const session = await getWebSession()
    const body = await req.json()
    const quote = await quoteCheckout({
      customer: body.customer || {},
      items: Array.isArray(body.items) ? body.items : [],
      discountCode: body.discountCode || '',
      userEmail: session?.email || '',
      userId: session?.id || ''
    })
    const name = String(body.customer?.name || '').trim()
    const phone = String(body.customer?.phone || '').trim()

    if (!name || !phone) return NextResponse.json({ message: 'Name and phone are required' }, { status: 400 })
    if (!String(body.customer?.address || '').trim() || !String(body.customer?.city || '').trim() || !String(body.customer?.pincode || '').trim()) {
      return NextResponse.json({ message: 'Delivery address is required' }, { status: 400 })
    }

    const razorpayOrderId = await createRazorpayOrder(quote.amountPaise, `jd${Date.now()}`)

    await saveRazorpayIntent(razorpayOrderId, quote.amountPaise, quote, {
      customer: body.customer,
      items: body.items,
      discountCode: quote.discountCode,
      userEmail: session?.email || '',
      userId: session?.id || ''
    })

    return NextResponse.json({
      keyId: razorpayKeys().keyId,
      orderId: razorpayOrderId,
      amount: quote.amountPaise,
      currency: 'INR',
      total: quote.total
    })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not start payment' }, { status: 400 })
  }
}
