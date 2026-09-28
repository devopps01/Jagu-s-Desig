import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'
import { RENT_SIZES, type RentSize } from '@/libs/rent-sizes'

export { RENT_SIZES }
export type { RentSize }
export type RentStatus = 'booked' | 'ongoing' | 'returned' | 'cancelled'

export type RentBookingDoc = {
  _id: ObjectId
  productId: string
  productSlug: string
  productName: string
  productImage: string
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  status: RentStatus
  createdAt: Date
  updatedAt: Date
}

const ACTIVE_STATUSES: RentStatus[] = ['booked', 'ongoing']

const mapBooking = (doc: RentBookingDoc) => ({
  id: doc._id.toHexString(),
  productId: doc.productId,
  productSlug: doc.productSlug,
  productName: doc.productName,
  productImage: doc.productImage,
  size: doc.size,
  startDate: doc.startDate,
  endDate: doc.endDate,
  startTime: doc.startTime,
  endTime: doc.endTime,
  customerName: doc.customerName,
  customerPhone: doc.customerPhone,
  customerEmail: doc.customerEmail,
  notes: doc.notes,
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

const datesOverlap = (startA: string, endA: string, startB: string, endB: string) => startA <= endB && startB <= endA

export type RentBookingInput = {
  productId?: string
  productSlug: string
  size: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  notes?: string
  status?: RentStatus
}

const normalizeInput = (input: RentBookingInput) => {
  const productSlug = (input.productSlug || '').trim()
  const size = (input.size || '').trim()
  const startDate = (input.startDate || '').trim()
  const endDate = (input.endDate || '').trim()
  const customerName = (input.customerName || '').trim()
  const customerPhone = (input.customerPhone || '').trim()

  if (!productSlug) throw new Error('Select a product')
  if (!size) throw new Error('Select a size')
  if (!RENT_SIZES.includes(size as RentSize)) throw new Error('Invalid size')
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) throw new Error('Select a valid start and end date')
  if (endDate < startDate) throw new Error('End date must be on or after start date')
  if (!customerName) throw new Error('Customer name is required')
  if (!customerPhone) throw new Error('Customer phone is required')

  const status = input.status || 'booked'

  if (!['booked', 'ongoing', 'returned', 'cancelled'].includes(status)) {
    throw new Error('Invalid rental status')
  }

  return {
    productSlug,
    size,
    startDate,
    endDate,
    startTime: (input.startTime || '').trim(),
    endTime: (input.endTime || '').trim(),
    customerName,
    customerPhone,
    customerEmail: (input.customerEmail || '').trim(),
    notes: (input.notes || '').trim(),
    status: status as RentStatus
  }
}

export const checkRentAvailability = async (input: {
  productSlug: string
  size: string
  startDate: string
  endDate: string
  excludeId?: string
}) => {
  const productSlug = (input.productSlug || '').trim()
  const size = (input.size || '').trim()
  const startDate = (input.startDate || '').trim()
  const endDate = (input.endDate || '').trim()

  if (!productSlug || !size || !isIsoDate(startDate) || !isIsoDate(endDate)) {
    return { available: false, message: 'Select size and dates', conflicts: [] as ReturnType<typeof mapBooking>[] }
  }

  if (endDate < startDate) {
    return { available: false, message: 'End date must be on or after start date', conflicts: [] as ReturnType<typeof mapBooking>[] }
  }

  const db = await getDb()
  const filter: Record<string, unknown> = {
    productSlug,
    size,
    status: { $in: ACTIVE_STATUSES }
  }

  if (input.excludeId && ObjectId.isValid(input.excludeId)) {
    filter._id = { $ne: new ObjectId(input.excludeId) }
  }

  const rows = await db.collection<RentBookingDoc>('RentBooking').find(filter).toArray()
  const conflicts = rows.filter(row => datesOverlap(startDate, endDate, row.startDate, row.endDate)).map(mapBooking)

  if (conflicts.length) {
    return {
      available: false,
      message: `Not available for ${size} from ${startDate} to ${endDate}`,
      conflicts
    }
  }

  return { available: true, message: `Available for ${size} from ${startDate} to ${endDate}`, conflicts: [] }
}

export const listRentBookingsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [
      { productName: regex },
      { productSlug: regex },
      { customerName: regex },
      { customerPhone: regex },
      { customerEmail: regex },
      { size: regex }
    ]
  }

  if (['booked', 'ongoing', 'returned', 'cancelled'].includes(query.status)) {
    filter.status = query.status
  }

  const [rows, total] = await Promise.all([
    db.collection<RentBookingDoc>('RentBooking').find(filter).sort({ startDate: -1, createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('RentBooking').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapBooking), total, query.page, query.limit)
}

export type RentBooking = ReturnType<typeof mapBooking>

export const listAllRentBookings = async () => {
  const db = await getDb()
  const rows = await db.collection<RentBookingDoc>('RentBooking').find({}).sort({ startDate: -1, createdAt: -1 }).toArray()

  return rows.map(mapBooking)
}

export const createRentBooking = async (input: RentBookingInput) => {
  const data = normalizeInput(input)
  const db = await getDb()
  const product = await db.collection('Product').findOne({ slug: data.productSlug })

  if (!product) throw new Error('Product not found')
  if (product.listingType === 'sale') throw new Error('This product is selling only')

  const availability = await checkRentAvailability({
    productSlug: data.productSlug,
    size: data.size,
    startDate: data.startDate,
    endDate: data.endDate
  })

  if (!availability.available && data.status !== 'cancelled' && data.status !== 'returned') {
    throw new Error(availability.message)
  }

  const now = new Date()
  const doc = {
    productId: product._id.toHexString(),
    productSlug: data.productSlug,
    productName: product.name,
    productImage: product.imageUrl || '',
    size: data.size,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail,
    notes: data.notes,
    status: data.status,
    createdAt: now,
    updatedAt: now
  }

  const result = await db.collection('RentBooking').insertOne(doc)

  return { id: result.insertedId.toHexString(), ...doc }
}

export const updateRentBooking = async (id: string, input: RentBookingInput) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  const data = normalizeInput(input)
  const db = await getDb()
  const product = await db.collection('Product').findOne({ slug: data.productSlug })

  if (!product) throw new Error('Product not found')

  const availability = await checkRentAvailability({
    productSlug: data.productSlug,
    size: data.size,
    startDate: data.startDate,
    endDate: data.endDate,
    excludeId: id
  })

  if (!availability.available && data.status !== 'cancelled' && data.status !== 'returned') {
    throw new Error(availability.message)
  }

  await db.collection('RentBooking').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        productId: product._id.toHexString(),
        productSlug: data.productSlug,
        productName: product.name,
        productImage: product.imageUrl || '',
        size: data.size,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        notes: data.notes,
        status: data.status,
        updatedAt: new Date()
      }
    }
  )
}

export const deleteRentBooking = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  await (await getDb()).collection('RentBooking').deleteOne({ _id: new ObjectId(id) })
}
