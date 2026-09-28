import { ObjectId } from 'mongodb'

import {
  RETURN_DAYS,
  canCancelOrder,
  canReturnOrder,
  cancelReasons,
  returnReasons,
  type OrderRequestReason,
  type OrderRequestStatus,
  type OrderRequestType
} from '@/libs/order-request-types'
import { getDb } from '@/libs/mongo'
import { getOrder, updateOrderStatus, type OrderStatus, type WebOrderItem } from '@/libs/orders'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type { OrderRequestReason, OrderRequestStatus, OrderRequestType } from '@/libs/order-request-types'
export { RETURN_DAYS, canCancelOrder, canReturnOrder, cancelReasons, returnReasons } from '@/libs/order-request-types'

const digits = (value: string) => value.replace(/\D/g, '')

const mapRequest = (doc: Record<string, unknown> & { _id: ObjectId }) => ({
  id: doc._id.toHexString(),
  type: (doc.type as OrderRequestType) || 'cancel',
  status: (doc.status as OrderRequestStatus) || 'requested',
  orderId: String(doc.orderId || ''),
  orderNo: String(doc.orderNo || ''),
  userEmail: String(doc.userEmail || ''),
  customerName: String(doc.customerName || ''),
  customerPhone: String(doc.customerPhone || ''),
  items: (doc.items as WebOrderItem[]) || [],
  reason: (doc.reason as OrderRequestReason) || 'other',
  note: String(doc.note || ''),
  refundAmount: Number(doc.refundAmount) || 0,
  adminNote: String(doc.adminNote || ''),
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

export const listRequestsForOrders = async (orderIds: string[]) => {
  if (!orderIds.length) return []

  const db = await getDb()
  const rows = await db
    .collection('OrderRequest')
    .find({ orderId: { $in: orderIds } })
    .sort({ createdAt: -1 })
    .toArray()

  return rows.map(row => mapRequest(row as typeof row & { _id: ObjectId }))
}

export const latestRequestByType = (rows: ReturnType<typeof mapRequest>[], orderId: string, type: OrderRequestType) =>
  rows.find(row => row.orderId === orderId && row.type === type)

export const createOrderRequest = async (input: {
  type: OrderRequestType
  orderId?: string
  orderNo?: string
  phone?: string
  reason?: string
  note?: string
  userEmail?: string
  userId?: string
}) => {
  const type: OrderRequestType = input.type === 'return' ? 'return' : 'cancel'
  const db = await getDb()
  const query: Record<string, unknown> = {}

  if (input.orderId && ObjectId.isValid(input.orderId)) query._id = new ObjectId(input.orderId)
  if (input.orderNo) query.orderNo = String(input.orderNo).trim().toUpperCase()
  if (!query._id && !query.orderNo) throw new Error('Order number is required')

  const order = await db.collection('WebOrder').findOne(query)

  if (!order) throw new Error('Order not found')

  const phone = digits(input.phone || '')
  const orderPhone = digits(String((order.customer as { phone?: string })?.phone || ''))
  const email = (input.userEmail || '').trim().toLowerCase()
  const orderEmail = String(order.userEmail || '').toLowerCase()
  const ownsByEmail = Boolean(email && orderEmail && email === orderEmail)
  const ownsByPhone = Boolean(phone && orderPhone && (orderPhone.endsWith(phone.slice(-10)) || phone.endsWith(orderPhone.slice(-10))))

  if (!ownsByEmail && !ownsByPhone) throw new Error('Use the phone or email used on this order')

  const orderId = order._id.toHexString()
  const status = (order.status as OrderStatus) || 'pending'
  const open = await db.collection('OrderRequest').findOne({
    orderId,
    type,
    status: { $in: ['requested', 'approved'] }
  })

  if (open) throw new Error(type === 'cancel' ? 'A cancel request is already open' : 'A return request is already open')

  if (type === 'cancel' && !canCancelOrder(status)) {
    throw new Error('This order can no longer be cancelled. Wait for delivery and request a return.')
  }

  if (type === 'return' && !canReturnOrder(status, (order.deliveredAt as Date) || (order.updatedAt as Date))) {
    throw new Error(`Returns are allowed within ${RETURN_DAYS} days of delivery`)
  }

  const reasons = type === 'cancel' ? cancelReasons : returnReasons
  const reason = reasons.some(item => item.id === input.reason) ? (input.reason as OrderRequestReason) : 'other'
  const note = String(input.note || '').trim().slice(0, 600)
  const now = new Date()
  const result = await db.collection('OrderRequest').insertOne({
    type,
    status: 'requested' satisfies OrderRequestStatus,
    orderId,
    orderNo: String(order.orderNo || ''),
    userEmail: orderEmail || email,
    userId: input.userId || String(order.userId || ''),
    customerName: String((order.customer as { name?: string })?.name || ''),
    customerPhone: String((order.customer as { phone?: string })?.phone || ''),
    items: order.items || [],
    reason,
    note,
    refundAmount: status === 'delivered' || order.payment === 'paid' ? Number(order.total) || 0 : 0,
    adminNote: '',
    createdAt: now,
    updatedAt: now
  })

  await db.collection('WebOrder').updateOne(
    { _id: order._id },
    {
      $set: {
        updatedAt: now,
        ...(type === 'cancel' ? { cancelRequestStatus: 'requested' } : { returnRequestStatus: 'requested' })
      }
    }
  )

  return { id: result.insertedId.toHexString(), type, status: 'requested' as const, orderNo: String(order.orderNo || '') }
}

export const listOrderRequestsTable = async (query: TableQuery, type = '') => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [
      { orderNo: regex },
      { userEmail: regex },
      { customerName: regex },
      { customerPhone: regex },
      { reason: regex },
      { note: regex }
    ]
  }

  if (['requested', 'approved', 'rejected', 'completed'].includes(query.status)) filter.status = query.status
  if (type === 'cancel' || type === 'return') filter.type = type

  const [rows, total] = await Promise.all([
    db.collection('OrderRequest').find(filter).sort({ createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('OrderRequest').countDocuments(filter)
  ])

  return tableResponse(
    rows.map(row => mapRequest(row as typeof row & { _id: ObjectId })),
    total,
    query.page,
    query.limit
  )
}

export const getOrderRequestCounts = async () => {
  const db = await getDb()
  const rows = await db
    .collection('OrderRequest')
    .aggregate<{ _id: { type: string; status: string }; count: number }>([
      { $group: { _id: { type: '$type', status: '$status' }, count: { $sum: 1 } } }
    ])
    .toArray()
  const counts = { all: 0, requested: 0, cancel: 0, return: 0 }

  for (const row of rows) {
    counts.all += row.count
    if (row._id.status === 'requested') counts.requested += row.count
    if (row._id.type === 'cancel') counts.cancel += row.count
    if (row._id.type === 'return') counts.return += row.count
  }

  return counts
}

export const updateOrderRequestStatus = async (
  id: string,
  status: OrderRequestStatus,
  extra?: { adminNote?: string; refundAmount?: number }
) => {
  if (!ObjectId.isValid(id)) throw new Error('Request not found')
  if (!['requested', 'approved', 'rejected', 'completed'].includes(status)) throw new Error('Invalid status')

  const db = await getDb()
  const doc = await db.collection('OrderRequest').findOne({ _id: new ObjectId(id) })

  if (!doc) throw new Error('Request not found')

  const now = new Date()
  const type = doc.type === 'return' ? 'return' : 'cancel'
  const $set: Record<string, unknown> = {
    status,
    updatedAt: now,
    adminNote: String(extra?.adminNote || doc.adminNote || '').trim().slice(0, 400)
  }

  if (typeof extra?.refundAmount === 'number') $set.refundAmount = Math.max(0, extra.refundAmount)

  await db.collection('OrderRequest').updateOne({ _id: doc._id }, { $set })

  const orderFlag = type === 'cancel' ? 'cancelRequestStatus' : 'returnRequestStatus'
  const orderSet: Record<string, unknown> = { updatedAt: now, [orderFlag]: status }

  if (type === 'cancel' && (status === 'approved' || status === 'completed')) {
    const order = await getOrder(String(doc.orderId))

    await updateOrderStatus(String(doc.orderId), 'cancelled', order.payment === 'paid' ? 'refunded' : order.payment)
    if (status === 'approved') {
      await db.collection('OrderRequest').updateOne({ _id: doc._id }, { $set: { status: 'completed', updatedAt: now } })
      orderSet[orderFlag] = 'completed'
    }
  }

  if (type === 'return' && status === 'completed') {
    const order = await getOrder(String(doc.orderId))

    await updateOrderStatus(String(doc.orderId), 'returned', order.payment === 'paid' || order.payment === 'refunded' ? 'refunded' : order.payment)
  }

  if (ObjectId.isValid(String(doc.orderId))) {
    await db.collection('WebOrder').updateOne({ _id: new ObjectId(String(doc.orderId)) }, { $set: orderSet })
  }
}
