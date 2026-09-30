import crypto from 'crypto'

import { applyDiscountCode } from '@/libs/discounts'
import { gstForTaxable } from '@/libs/gst'
import { getDb } from '@/libs/mongo'
import { createWebOrder, type WebOrderCustomer, type WebOrderItem } from '@/libs/orders'
import { getStoreProduct } from '@/libs/products'

export type RazorpayCheckoutItem = {
  slug: string
  qty: number
  size?: string
}

export type RazorpayCheckoutBody = {
  customer: WebOrderCustomer
  items: RazorpayCheckoutItem[]
  discountCode?: string
  userEmail?: string
  userId?: string
}

const money = (value: number) => Math.round((Number(value) || 0) * 100) / 100

export const razorpayKeys = () => {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim()
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim()

  return { keyId, keySecret, enabled: Boolean(keyId && keySecret) }
}

export const quoteCheckout = async (input: RazorpayCheckoutBody) => {
  const requested = Array.isArray(input.items) ? input.items : []

  if (!requested.length) throw new Error('Bag is empty')
  if (requested.length > 30) throw new Error('Too many items in this order')

  const items: WebOrderItem[] = []

  for (const item of requested) {
    const slug = String(item.slug || '').trim()
    const product = slug ? await getStoreProduct(slug) : null

    if (!product) throw new Error('One of the pieces is no longer available')

    const qty = Math.min(20, Math.max(1, Number(item.qty) || 1))
    const unit = money(product.sellingPrice || product.price || 0)

    if (unit <= 0) throw new Error(`${product.title} cannot be paid online right now`)

    const mrp = money(product.sellingMrp && product.sellingMrp > unit ? product.sellingMrp : unit)

    items.push({
      slug: product.slug,
      title: product.title,
      image: product.image,
      qty,
      unit,
      mrp,
      lineTotal: money(unit * qty),
      size: String(item.size || '').trim()
    })
  }

  const subtotal = money(items.reduce((sum, item) => sum + item.lineTotal, 0))
  const productSavings = money(items.reduce((sum, item) => sum + Math.max(0, item.mrp - item.unit) * item.qty, 0))
  let discountAmount = 0
  let discountCode = ''

  if (input.discountCode) {
    const discount = await applyDiscountCode(String(input.discountCode), subtotal)

    if (!discount.ok) throw new Error(discount.message)

    discountAmount = money(discount.amount)
    discountCode = discount.code
  }

  const taxable = money(Math.max(0, subtotal - discountAmount))
  const gst = await gstForTaxable(taxable)
  const total = money(Math.max(0, taxable + gst.amount))

  if (total < 1) throw new Error('This order is below the minimum online payment')

  return {
    items,
    subtotal,
    productSavings,
    discountCode,
    discountAmount,
    gstEnabled: gst.enabled,
    gstRate: gst.rate,
    gstAmount: gst.amount,
    gstLabel: gst.label,
    shipping: 0,
    total,
    amountPaise: Math.round(total * 100)
  }
}

export const createRazorpayOrder = async (amountPaise: number, receipt: string) => {
  const { keyId, keySecret, enabled } = razorpayKeys()

  if (!enabled) throw new Error('Online payment is not configured yet')

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: 'INR',
      receipt: receipt.slice(0, 40),
      payment_capture: 1
    })
  })
  const json = (await res.json()) as { id?: string; error?: { description?: string } }

  if (!res.ok || !json.id) throw new Error(json.error?.description || 'Could not start Razorpay payment')

  return json.id
}

export const verifyRazorpaySignature = (orderId: string, paymentId: string, signature: string) => {
  const { keySecret, enabled } = razorpayKeys()

  if (!enabled) return false

  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')

  const left = Buffer.from(expected)
  const right = Buffer.from(signature || '')

  if (left.length !== right.length) return false

  return crypto.timingSafeEqual(left, right)
}

type IntentDoc = {
  razorpayOrderId: string
  amountPaise: number
  quote: Awaited<ReturnType<typeof quoteCheckout>>
  customer: WebOrderCustomer
  userEmail: string
  userId: string
  status: 'created' | 'paid'
  orderNo?: string
  invoiceNo?: string
  createdAt: Date
}

export const saveRazorpayIntent = async (razorpayOrderId: string, amountPaise: number, quote: IntentDoc['quote'], body: RazorpayCheckoutBody) => {
  const db = await getDb()

  await db.collection<IntentDoc>('RazorpayIntent').insertOne({
    razorpayOrderId,
    amountPaise,
    quote,
    customer: body.customer,
    userEmail: (body.userEmail || '').trim().toLowerCase(),
    userId: body.userId || '',
    status: 'created',
    createdAt: new Date()
  })
}

export const completeRazorpayPayment = async (orderId: string, paymentId: string, signature: string) => {
  if (!verifyRazorpaySignature(orderId, paymentId, signature)) throw new Error('Payment could not be verified')

  const db = await getDb()
  const paidOrder = await db.collection('WebOrder').findOne({ razorpayPaymentId: paymentId })

  if (paidOrder) {
    return { orderNo: String(paidOrder.orderNo || ''), invoiceNo: String(paidOrder.invoiceNo || ''), alreadyPaid: true }
  }

  const intent = await db.collection<IntentDoc>('RazorpayIntent').findOne({ razorpayOrderId: orderId, status: 'created' })

  if (!intent) throw new Error('This payment session was not found')
  if (intent.amountPaise !== intent.quote.amountPaise) throw new Error('Payment amount does not match this order')

  const created = await createWebOrder({
    customer: intent.customer,
    items: intent.quote.items,
    subtotal: intent.quote.subtotal,
    productSavings: intent.quote.productSavings,
    discountCode: intent.quote.discountCode,
    discountAmount: intent.quote.discountAmount,
    gstEnabled: intent.quote.gstEnabled,
    gstRate: intent.quote.gstRate,
    gstAmount: intent.quote.gstAmount,
    gstLabel: intent.quote.gstLabel,
    shipping: 0,
    total: intent.quote.total,
    userEmail: intent.userEmail,
    userId: intent.userId,
    paymentMethodTitle: 'Razorpay',
    paymentMethodType: 'razorpay',
    payment: 'paid',
    orderStatus: 'confirmed',
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId
  })

  await db.collection('RazorpayIntent').updateOne(
    { razorpayOrderId: orderId },
    { $set: { status: 'paid', orderNo: created.orderNo, invoiceNo: created.invoiceNo, paidAt: new Date() } }
  )

  return { ...created, alreadyPaid: false }
}
