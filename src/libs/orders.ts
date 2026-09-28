import { ObjectId } from 'mongodb'

import { withoutSareeWord } from '@/libs/public-label'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned'
export type PaymentStatus = 'cod' | 'paid' | 'refunded'

export const orderStatuses: OrderStatus[] = [
  'pending',
  'confirmed',
  'packed',
  'shipped',
  'delivered',
  'cancelled',
  'returned'
]

export type WebOrderItem = {
  slug: string
  title: string
  image: string
  qty: number
  unit: number
  mrp: number
  lineTotal: number
  size?: string
}

export type WebOrderCustomer = {
  name: string
  phone: string
  address: string
  locality?: string
  city: string
  state?: string
  pincode: string
}

export type WebOrderInput = {
  customer: WebOrderCustomer
  items: WebOrderItem[]
  subtotal: number
  productSavings: number
  discountCode?: string
  discountAmount?: number
  sisterId?: string
  sisterName?: string
  sisterCode?: string
  sisterDiscountAmount?: number
  gstEnabled?: boolean
  gstRate?: number
  gstAmount?: number
  gstLabel?: string
  userEmail?: string
  userId?: string
  shipping?: number
  total: number
  paymentMethodId?: string
  paymentMethodTitle?: string
  paymentMethodType?: string
}

const nextNumbers = async () => {
  const db = await getDb()
  const year = new Date().getFullYear()
  const count = await db.collection('WebOrder').countDocuments()
  const seq = String(count + 1).padStart(4, '0')

  return {
    orderNo: `JD${year}${seq}`,
    invoiceNo: `INV${year}${seq}`
  }
}

const mapOrder = (row: Record<string, unknown> & { _id: ObjectId }) => ({
  id: row._id.toHexString(),
  orderNo: String(row.orderNo || row._id.toHexString().slice(-6).toUpperCase()),
  invoiceNo: String(row.invoiceNo || ''),
  status: (row.status as OrderStatus) || 'pending',
  payment: (row.payment as PaymentStatus) || 'cod',
  total: Number(row.total) || 0,
  subtotal: Number(row.subtotal) || 0,
  shipping: Number(row.shipping) || 0,
  productSavings: Number(row.productSavings) || 0,
  discountCode: String(row.discountCode || ''),
  discountAmount: Number(row.discountAmount) || 0,
  sisterId: String(row.sisterId || ''),
  sisterName: String(row.sisterName || ''),
  sisterCode: String(row.sisterCode || ''),
  sisterDiscountAmount: Number(row.sisterDiscountAmount) || 0,
  gstEnabled: Boolean(row.gstEnabled),
  gstRate: Number(row.gstRate) || 0,
  gstAmount: Number(row.gstAmount) || 0,
  gstLabel: String(row.gstLabel || 'GST'),
  items: ((row.items as WebOrderItem[]) || []).map(item => ({
    ...item,
    title: withoutSareeWord(item.title)
  })),
  customer: (row.customer as WebOrderCustomer) || {
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  },
  userEmail: String(row.userEmail || ''),
  paymentMethodId: String(row.paymentMethodId || ''),
  paymentMethodTitle: String(row.paymentMethodTitle || ''),
  paymentMethodType: String(row.paymentMethodType || ''),
  cancelRequestStatus: String(row.cancelRequestStatus || ''),
  returnRequestStatus: String(row.returnRequestStatus || ''),
  deliveredAt: row.deliveredAt || null,
  cancelledAt: row.cancelledAt || null,
  returnedAt: row.returnedAt || null,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
})

export const createWebOrder = async (input: WebOrderInput) => {
  const db = await getDb()
  const name = input.customer.name.trim()
  const phone = input.customer.phone.trim()

  if (!name || !phone) throw new Error('Name and phone are required')
  if (!input.items?.length) throw new Error('Bag is empty')

  const now = new Date()
  const numbers = await nextNumbers()
  const items = input.items.map(item => ({
    slug: String(item.slug || ''),
    title: withoutSareeWord(String(item.title || '')),
    image: String(item.image || ''),
    qty: Math.max(1, Number(item.qty) || 1),
    unit: Number(item.unit) || 0,
    mrp: Number(item.mrp) || Number(item.unit) || 0,
    lineTotal: Number(item.lineTotal) || 0,
    size: String(item.size || '').trim()
  }))
  const result = await db.collection('WebOrder').insertOne({
    ...input,
    items,
    subtotal: Number(input.subtotal) || 0,
    productSavings: Number(input.productSavings) || 0,
    discountCode: String(input.discountCode || ''),
    discountAmount: Number(input.discountAmount) || 0,
    sisterDiscountAmount: Number(input.sisterDiscountAmount) || 0,
    gstEnabled: Boolean(input.gstEnabled),
    gstRate: Number(input.gstRate) || 0,
    gstAmount: Number(input.gstAmount) || 0,
    gstLabel: String(input.gstLabel || 'GST'),
    shipping: Number(input.shipping) || 0,
    total: Number(input.total) || 0,
    ...numbers,
    customer: {
      name,
      phone,
      address: input.customer.address.trim(),
      locality: (input.customer.locality || '').trim(),
      city: input.customer.city.trim(),
      state: (input.customer.state || '').trim(),
      pincode: input.customer.pincode.trim()
    },
    status: 'pending' satisfies OrderStatus,
    payment: (input.paymentMethodType === 'cod' || !input.paymentMethodType ? 'cod' : 'cod') satisfies PaymentStatus,
    paymentMethodId: input.paymentMethodId || '',
    paymentMethodTitle: input.paymentMethodTitle || (input.paymentMethodType === 'cod' ? 'Cash on delivery' : ''),
    paymentMethodType: input.paymentMethodType || 'cod',
    userEmail: (input.userEmail || '').trim().toLowerCase(),
    userId: input.userId || '',
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString(), ...numbers }
}

export const listOrdersForUser = async (email: string) => {
  const db = await getDb()
  const rows = await db
    .collection('WebOrder')
    .find({ userEmail: email.trim().toLowerCase() })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray()

  return rows.map(row => mapOrder(row as typeof row & { _id: ObjectId }))
}

export const listOrdersTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [
      { orderNo: regex },
      { invoiceNo: regex },
      { userEmail: regex },
      { 'customer.name': regex },
      { 'customer.phone': regex },
      { sisterName: regex }
    ]
  }

  if (query.status) filter.status = query.status
  if (query.payment === 'cod' || query.payment === 'paid' || query.payment === 'refunded') filter.payment = query.payment

  const [rows, total] = await Promise.all([
    db.collection('WebOrder').find(filter).sort({ createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('WebOrder').countDocuments(filter)
  ])

  return tableResponse(
    rows.map(row => mapOrder(row as typeof row & { _id: ObjectId })),
    total,
    query.page,
    query.limit
  )
}

export const getOrderStatusCounts = async () => {
  const db = await getDb()
  const rows = await db
    .collection('WebOrder')
    .aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    .toArray()
  const counts: Record<string, number> = { all: 0 }

  for (const row of rows) {
    const key = row._id || 'pending'

    counts[key] = row.count
    counts.all += row.count
  }

  return counts
}

export const getOrder = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Order not found')

  const db = await getDb()
  const row = await db.collection('WebOrder').findOne({ _id: new ObjectId(id) })

  if (!row) throw new Error('Order not found')

  return mapOrder(row as typeof row & { _id: ObjectId })
}

export const trackOrder = async (orderNo: string, lookup: string) => {
  const db = await getDb()
  const no = orderNo.trim().toUpperCase()
  const key = lookup.trim().toLowerCase()

  if (!no || !key) throw new Error('Order number and phone or email are required')

  const row = await db.collection('WebOrder').findOne({ orderNo: no })

  if (!row) throw new Error('Order not found')

  const phone = String((row.customer as { phone?: string })?.phone || '').replace(/\D/g, '')
  const email = String(row.userEmail || '').toLowerCase()
  const keyDigits = key.replace(/\D/g, '')
  const ok = (email && email === key) || (phone && keyDigits && (phone.endsWith(keyDigits.slice(-10)) || keyDigits.endsWith(phone.slice(-10))))

  if (!ok) throw new Error('Phone or email does not match this order')

  return mapOrder(row as typeof row & { _id: ObjectId })
}

export const updateOrderStatus = async (id: string, status: OrderStatus, payment?: PaymentStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Order not found')
  if (!orderStatuses.includes(status)) throw new Error('Invalid status')

  const db = await getDb()
  const now = new Date()
  const $set: Record<string, unknown> = { status, updatedAt: now }

  if (payment === 'cod' || payment === 'paid' || payment === 'refunded') $set.payment = payment
  if (status === 'delivered') {
    $set.payment = 'paid'
    $set.deliveredAt = now
  }
  if (status === 'cancelled') $set.cancelledAt = now
  if (status === 'returned') $set.returnedAt = now

  await db.collection('WebOrder').updateOne({ _id: new ObjectId(id) }, { $set })
}
