import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import {
  type PaymentMethod,
  type PaymentMethodStatus,
  type PaymentMethodType,
  PAYMENT_METHOD_TYPES
} from '@/libs/payment-methods-types'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type { PaymentMethod, PaymentMethodStatus, PaymentMethodType } from '@/libs/payment-methods-types'

type PaymentMethodDoc = {
  _id: ObjectId
  title: string
  type: PaymentMethodType
  details: string
  instructions: string
  sortOrder: number
  status: PaymentMethodStatus
  createdAt: Date
  updatedAt: Date
}

const COLLECTION = 'PaymentMethod'

const allowedType = (value: unknown): PaymentMethodType =>
  PAYMENT_METHOD_TYPES.some(item => item.id === value) ? (value as PaymentMethodType) : 'other'

const mapRow = (doc: PaymentMethodDoc): PaymentMethod => ({
  id: doc._id.toHexString(),
  title: doc.title,
  type: doc.type,
  details: doc.details || '',
  instructions: doc.instructions || '',
  sortOrder: Number(doc.sortOrder) || 0,
  status: doc.status
})

const normalize = (input: Partial<PaymentMethod>) => {
  const title = String(input.title || '').trim()
  const type = allowedType(input.type)
  const details = String(input.details || '').trim()
  const instructions = String(input.instructions || '').trim()
  const sortOrder = Math.max(0, Number(input.sortOrder) || 0)
  const status: PaymentMethodStatus = input.status === 'inactive' ? 'inactive' : 'active'

  if (!title) throw new Error('Payment method name is required')

  return { title, type, details, instructions, sortOrder, status }
}

const defaults: Omit<PaymentMethodDoc, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    title: 'Cash on delivery',
    type: 'cod',
    details: '',
    instructions: 'Pay the courier when the parcel arrives. Keep the bill amount ready.',
    sortOrder: 1,
    status: 'active'
  },
  {
    title: 'UPI',
    type: 'upi',
    details: '',
    instructions: 'We will share the UPI ID on WhatsApp after the order is confirmed. Send the payment screenshot to the atelier.',
    sortOrder: 2,
    status: 'inactive'
  },
  {
    title: 'Bank transfer',
    type: 'bank',
    details: '',
    instructions: 'We will share account details on WhatsApp. The piece is packed after the transfer is seen.',
    sortOrder: 3,
    status: 'inactive'
  }
]

const ensureDefaults = async () => {
  const db = await getDb()
  const count = await db.collection(COLLECTION).countDocuments()

  if (count) return

  const now = new Date()

  await db.collection(COLLECTION).insertMany(defaults.map(item => ({ ...item, createdAt: now, updatedAt: now })))
}

export const listPaymentMethodsTable = async (query: TableQuery) => {
  await ensureDefaults()

  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ title: regex }, { type: regex }, { details: regex }]
  if (query.status === 'active' || query.status === 'inactive') filter.status = query.status

  const [rows, total] = await Promise.all([
    db
      .collection<PaymentMethodDoc>(COLLECTION)
      .find(filter)
      .sort({ sortOrder: 1, createdAt: 1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection(COLLECTION).countDocuments(filter)
  ])

  return tableResponse(rows.map(mapRow), total, query.page, query.limit)
}

export const listActivePaymentMethods = async () => {
  await ensureDefaults()

  const db = await getDb()
  const rows = await db
    .collection<PaymentMethodDoc>(COLLECTION)
    .find({ status: 'active' })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray()

  return rows.map(mapRow)
}

export const getActivePaymentMethod = async (id: string) => {
  if (!ObjectId.isValid(id)) return null

  const db = await getDb()
  const doc = await db.collection<PaymentMethodDoc>(COLLECTION).findOne({ _id: new ObjectId(id), status: 'active' })

  return doc ? mapRow(doc) : null
}

export const createPaymentMethod = async (input: Partial<PaymentMethod>) => {
  const db = await getDb()
  const data = normalize(input)
  const now = new Date()
  const result = await db.collection(COLLECTION).insertOne({ ...data, createdAt: now, updatedAt: now })

  return { id: result.insertedId.toHexString(), ...data }
}

export const updatePaymentMethod = async (id: string, input: Partial<PaymentMethod>) => {
  if (!ObjectId.isValid(id)) throw new Error('Payment method not found')

  const db = await getDb()
  const data = normalize(input)
  const result = await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })

  if (!result.matchedCount) throw new Error('Payment method not found')
}

export const updatePaymentMethodStatus = async (id: string, status: PaymentMethodStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Payment method not found')

  const db = await getDb()

  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export const deletePaymentMethod = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Payment method not found')

  const db = await getDb()

  await db.collection(COLLECTION).deleteOne({ _id: new ObjectId(id) })
}
