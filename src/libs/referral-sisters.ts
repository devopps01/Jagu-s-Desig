import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { codeify, offerAmount, type OfferStatus, type OfferType } from '@/libs/offers'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type ReferralSisterDoc = {
  _id: ObjectId
  name: string
  code: string
  phone: string
  type: OfferType
  value: number
  status: OfferStatus
  createdAt: Date
  updatedAt: Date
}

export type ReferralSisterInput = {
  name?: string
  code?: string
  phone?: string
  type?: OfferType
  value?: number
  status?: OfferStatus
}

type SisterOrderStat = {
  orders: number
  sales: number
  discount: number
  lastOrderAt: Date | null
}

const countedOrderMatch = {
  sisterId: { $exists: true, $nin: ['', null] },
  status: { $nin: ['cancelled', 'returned'] }
}

const isObjectId = (value: string) => /^[a-fA-F0-9]{24}$/.test(value)

const emptyStats = (): SisterOrderStat => ({ orders: 0, sales: 0, discount: 0, lastOrderAt: null })

const mapSister = (doc: ReferralSisterDoc, stats: SisterOrderStat = emptyStats()) => ({
  id: doc._id.toHexString(),
  name: doc.name,
  code: doc.code,
  phone: doc.phone || '',
  type: doc.type,
  value: doc.value || 0,
  status: doc.status,
  orderCount: stats.orders,
  orderTotal: stats.sales,
  discountTotal: stats.discount,
  lastOrderAt: stats.lastOrderAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const normalize = (input: ReferralSisterInput) => {
  const name = (input.name || '').trim()
  const code = codeify(input.code || name)
  const type: OfferType = input.type === 'fixed' ? 'fixed' : 'percent'
  const value = Math.max(0, Number(input.value) || 0)
  const status: OfferStatus = input.status === 'inactive' ? 'inactive' : 'active'

  if (!name) throw new Error('Sister name is required')
  if (!code) throw new Error('Sister code is required')
  if (type === 'percent' && value > 100) throw new Error('Percent cannot be more than 100')

  return {
    name,
    code,
    phone: (input.phone || '').trim(),
    type,
    value,
    status
  }
}

const loadOrderStats = async (ids: string[]) => {
  const map = new Map<string, SisterOrderStat>()

  if (!ids.length) return map

  const db = await getDb()
  const rows = await db
    .collection('WebOrder')
    .aggregate<{ _id: string; orders: number; sales: number; discount: number; lastOrderAt: Date | null }>([
      { $match: { sisterId: { $in: ids }, status: { $nin: ['cancelled', 'returned'] } } },
      {
        $group: {
          _id: '$sisterId',
          orders: { $sum: 1 },
          sales: { $sum: '$total' },
          discount: { $sum: { $ifNull: ['$sisterDiscountAmount', 0] } },
          lastOrderAt: { $max: '$createdAt' }
        }
      }
    ])
    .toArray()

  for (const row of rows) {
    map.set(row._id, {
      orders: row.orders || 0,
      sales: row.sales || 0,
      discount: row.discount || 0,
      lastOrderAt: row.lastOrderAt || null
    })
  }

  return map
}

export const listReferralSistersTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ name: regex }, { code: regex }, { phone: regex }]
  if (query.status === 'active' || query.status === 'inactive') filter.status = query.status

  const [rows, total] = await Promise.all([
    db
      .collection<ReferralSisterDoc>('ReferralSister')
      .find(filter)
      .sort({ name: 1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('ReferralSister').countDocuments(filter)
  ])

  const stats = await loadOrderStats(rows.map(row => row._id.toHexString()))

  return tableResponse(
    rows.map(doc => mapSister(doc, stats.get(doc._id.toHexString()) || emptyStats())),
    total,
    query.page,
    query.limit
  )
}

export const getReferralSisterDashboard = async () => {
  const db = await getDb()
  const [sistersTotal, sistersActive, orderAgg, top] = await Promise.all([
    db.collection('ReferralSister').countDocuments(),
    db.collection('ReferralSister').countDocuments({ status: 'active' }),
    db
      .collection('WebOrder')
      .aggregate<{ orders: number; sales: number; discount: number }>([
        { $match: countedOrderMatch },
        {
          $group: {
            _id: null,
            orders: { $sum: 1 },
            sales: { $sum: '$total' },
            discount: { $sum: { $ifNull: ['$sisterDiscountAmount', 0] } }
          }
        }
      ])
      .toArray(),
    db
      .collection('WebOrder')
      .aggregate<{ _id: string; orders: number; sales: number; name: string; code: string }>([
        { $match: countedOrderMatch },
        {
          $group: {
            _id: '$sisterId',
            orders: { $sum: 1 },
            sales: { $sum: '$total' },
            name: { $first: '$sisterName' },
            code: { $first: '$sisterCode' }
          }
        },
        { $sort: { orders: -1, sales: -1 } },
        { $limit: 5 }
      ])
      .toArray()
  ])

  const totals = orderAgg[0] || { orders: 0, sales: 0, discount: 0 }

  return {
    sistersTotal,
    sistersActive,
    referredOrders: totals.orders || 0,
    referredSales: totals.sales || 0,
    sisterDiscount: totals.discount || 0,
    topSisters: top.map(row => ({
      id: row._id,
      name: row.name || 'Sister',
      code: row.code || '',
      orders: row.orders || 0,
      sales: row.sales || 0
    }))
  }
}

export const getReferralSisterWithOrders = async (id: string) => {
  if (!isObjectId(id)) throw new Error('Sister not found')

  const db = await getDb()
  const doc = await db.collection<ReferralSisterDoc>('ReferralSister').findOne({ _id: new ObjectId(id) })

  if (!doc) throw new Error('Sister not found')

  const [stats, orders] = await Promise.all([
    loadOrderStats([id]),
    db
      .collection('WebOrder')
      .find({ sisterId: id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray()
  ])

  return {
    sister: mapSister(doc, stats.get(id) || emptyStats()),
    orders: orders.map(row => {
      const customer = (row.customer || {}) as { name?: string; phone?: string }

      return {
        id: (row._id as ObjectId).toHexString(),
        orderNo: String(row.orderNo || ''),
        customerName: String(customer.name || ''),
        phone: String(customer.phone || ''),
        total: Number(row.total) || 0,
        sisterDiscountAmount: Number(row.sisterDiscountAmount) || 0,
        status: String(row.status || 'pending'),
        createdAt: row.createdAt
      }
    })
  }
}

export const createReferralSister = async (input: ReferralSisterInput) => {
  const db = await getDb()
  const data = normalize(input)
  const existing = await db.collection('ReferralSister').findOne({ code: data.code })

  if (existing) throw new Error('This sister code already exists')

  const now = new Date()
  const result = await db.collection('ReferralSister').insertOne({ ...data, createdAt: now, updatedAt: now })

  return { id: result.insertedId.toHexString(), ...data }
}

export const updateReferralSister = async (id: string, input: ReferralSisterInput) => {
  const db = await getDb()
  const data = normalize(input)
  const existing = await db.collection('ReferralSister').findOne({ code: data.code, _id: { $ne: new ObjectId(id) } })

  if (existing) throw new Error('This sister code already exists')

  await db.collection('ReferralSister').updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })
}

export const updateReferralSisterStatus = async (id: string, status: OfferStatus) => {
  const db = await getDb()

  await db
    .collection('ReferralSister')
    .updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export const deleteReferralSister = async (id: string) => {
  const db = await getDb()

  await db.collection('ReferralSister').deleteOne({ _id: new ObjectId(id) })
}

export const applyReferralSister = async (ref: string, subtotal: number) => {
  const db = await getDb()
  const raw = (ref || '').trim()

  if (!raw) return { ok: false as const, message: 'Enter a sister code' }

  const code = codeify(raw)
  const filter = isObjectId(raw)
    ? { $or: [{ _id: new ObjectId(raw) }, { code }], status: 'active' as const }
    : { code, status: 'active' as const }

  const doc = await db.collection<ReferralSisterDoc>('ReferralSister').findOne(filter)

  if (!doc) return { ok: false as const, message: 'Sister code not found' }

  const amount = offerAmount(subtotal, doc.type, doc.value)

  return {
    ok: true as const,
    id: doc._id.toHexString(),
    name: doc.name,
    code: doc.code,
    type: doc.type,
    value: doc.value || 0,
    amount,
    label: doc.value
      ? doc.type === 'percent'
        ? `${doc.value}% sister offer`
        : `₹${doc.value} sister offer`
      : 'Referral credited'
  }
}
