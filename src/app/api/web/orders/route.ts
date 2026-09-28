import { NextResponse } from 'next/server'

import { applyDiscountCode } from '@/libs/discounts'
import { gstForTaxable } from '@/libs/gst'
import { createWebOrder } from '@/libs/orders'
import { getActivePaymentMethod } from '@/libs/payment-methods'
import { applyReferralSister } from '@/libs/referral-sisters'
import { getWebSession } from '@/libs/web-auth'

export async function POST(req: Request) {
  try {
    const session = await getWebSession()
    const body = await req.json()
    const items = Array.isArray(body.items) ? body.items : []
    const subtotal = Number(body.subtotal) || 0
    let discountAmount = 0
    let discountCode = ''
    let sisterId = ''
    let sisterName = ''
    let sisterCode = ''
    let sisterDiscountAmount = 0

    if (body.discountCode) {
      const discount = await applyDiscountCode(String(body.discountCode), subtotal)

      if (!discount.ok) return NextResponse.json({ message: discount.message }, { status: 400 })

      discountAmount = discount.amount
      discountCode = discount.code
    }

    if (body.sisterId || body.sisterCode) {
      const sister = await applyReferralSister(String(body.sisterId || body.sisterCode), Math.max(0, subtotal - discountAmount))

      if (!sister.ok) return NextResponse.json({ message: sister.message }, { status: 400 })

      sisterId = sister.id
      sisterName = sister.name
      sisterCode = sister.code
      sisterDiscountAmount = sister.amount
    }

    const shipping = 0
    const taxable = Math.max(0, subtotal - discountAmount - sisterDiscountAmount)
    const gst = await gstForTaxable(taxable)
    const total = Math.max(0, taxable + shipping + gst.amount)
    const method = body.paymentMethodId ? await getActivePaymentMethod(String(body.paymentMethodId)) : null

    if (!method) {
      return NextResponse.json({ message: 'Choose a payment method' }, { status: 400 })
    }

    const created = await createWebOrder({
      customer: body.customer || {},
      items,
      subtotal,
      productSavings: Number(body.productSavings) || 0,
      discountCode,
      discountAmount,
      sisterId,
      sisterName,
      sisterCode,
      sisterDiscountAmount,
      gstEnabled: gst.enabled,
      gstRate: gst.rate,
      gstAmount: gst.amount,
      gstLabel: gst.label,
      shipping,
      total,
      userEmail: session?.email || '',
      userId: session?.id || '',
      paymentMethodId: method.id,
      paymentMethodTitle: method.title,
      paymentMethodType: method.type
    })

    return NextResponse.json(created)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to place order' }, { status: 400 })
  }
}
