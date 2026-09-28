import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { codeify, offerAmount, type OfferStatus, type OfferType } from '@/libs/offers'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type DiscountDoc = {
  _id: ObjectId
  code: string
  type: OfferType
  value: number
  minSubtotal: number
  note: string
  status: OfferStatus
  createdAt: Date
  updatedAt: Date
}

export type DiscountInput = {
  code?: string
  type?: OfferType
  value?: number
  minSubtotal?: number
  note?: string
  status?: OfferStatus
}

const mapDiscount = (doc: DiscountDoc) => ({
  id: doc._id.toHexString(),
  code: doc.code,
  type: doc.type,
  value: doc.value,
  minSubtotal: doc.minSubtotal || 0,
  note: doc.note || '',
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const normalize = (input: DiscountInput) => {
  const code = codeify(input.code || '')
  const type: OfferType = input.type === 'fixed' ? 'fixed' : 'percent'
  const value = Math.max(0, Number(input.value) || 0)
  const minSubtotal = Math.max(0, Number(input.minSubtotal) || 0)
  const status: OfferStatus = input.status === 'inactive' ? 'inactive' : 'active'

  if (!code) throw new Error('Discount code is required')
  if (!value) throw new Error('Discount value is required')
  if (type === 'percent' && value > 100) throw new Error('Percent cannot be more than 100')

  return {
    code,
    type,
    value,
    minSubtotal,
    note: (input.note || '').trim(),
    status
  }
}

export const listDiscountsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ code: regex }, { note: regex }]
  if (query.status === 'active' || query.status === 'inactive') filter.status = query.status

  const [rows, total] = await Promise.all([
    db
      .collection<DiscountDoc>('DiscountCode')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('DiscountCode').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapDiscount), total, query.page, query.limit)
}

export const createDiscount = async (input: DiscountInput) => {
  const db = await getDb()
  const data = normalize(input)
  const existing = await db.collection('DiscountCode').findOne({ code: data.code })

  if (existing) throw new Error('This discount code already exists')

  const now = new Date()
  const result = await db.collection('DiscountCode').insertOne({ ...data, createdAt: now, updatedAt: now })

  return { id: result.insertedId.toHexString(), ...data }
}

export const updateDiscount = async (id: string, input: DiscountInput) => {
  const db = await getDb()
  const data = normalize(input)
  const existing = await db.collection('DiscountCode').findOne({ code: data.code, _id: { $ne: new ObjectId(id) } })

  if (existing) throw new Error('This discount code already exists')

  await db.collection('DiscountCode').updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })
}

export const updateDiscountStatus = async (id: string, status: OfferStatus) => {
  const db = await getDb()

  await db
    .collection('DiscountCode')
    .updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export const deleteDiscount = async (id: string) => {
  const db = await getDb()

  await db.collection('DiscountCode').deleteOne({ _id: new ObjectId(id) })
}

export const applyDiscountCode = async (code: string, subtotal: number) => {
  const db = await getDb()
  const normalized = codeify(code)
  const doc = await db.collection<DiscountDoc>('DiscountCode').findOne({ code: normalized, status: 'active' })

  if (!doc) return { ok: false as const, message: 'Invalid or inactive discount code' }
  if (doc.minSubtotal && subtotal < doc.minSubtotal) {
    return { ok: false as const, message: `Minimum order ₹${doc.minSubtotal.toLocaleString('en-IN')} required` }
  }

  const amount = offerAmount(subtotal, doc.type, doc.value)

  if (!amount) return { ok: false as const, message: 'Discount cannot be applied on this bag' }

  return {
    ok: true as const,
    id: doc._id.toHexString(),
    code: doc.code,
    type: doc.type,
    value: doc.value,
    amount,
    label: doc.type === 'percent' ? `${doc.value}% off` : `₹${doc.value} off`
  }
}

export const getFeaturedOffer = async () => {
  const db = await getDb()
  const doc = await db.collection<DiscountDoc>('DiscountCode').findOne({ status: 'active' }, { sort: { createdAt: -1 } })

  if (!doc) {
    return {
      code: '',
      label: 'Member offer',
      note: 'Login with email to unlock checkout offers on your bag.'
    }
  }

  return {
    code: doc.code,
    label: doc.type === 'percent' ? `${doc.value}% off` : `₹${doc.value} off`,
    note: doc.note || `Use ${doc.code} at checkout after you login.`
  }
}
