import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'
import { RENT_SIZES, isSizeOutOfStock, sizeQuantity, type RentSize } from '@/libs/rent-sizes'
import { cleanRentPayments, rentPaymentMethodLabel, scaleRentPayments, type RentPaymentLine, type RentPaymentOption } from '@/libs/rent-payment'
import { calendarDay, dressCareBlock, holdStillOut, rentSpansOverlap } from '@/libs/rent-span'
import { settleCancel } from '@/libs/return-fee'

export { RENT_SIZES }
export type { RentSize }
export type { RentPaymentOption }
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
  productPrice?: number
  finalPrice?: number
  paymentOption?: RentPaymentOption
  paymentMethod?: string
  paymentNote?: string
  paidAmount?: number
  balanceAmount?: number
  gstEnabled?: boolean
  gstRate?: number
  gstAmount?: number
  discountAmount?: number
  payments?: RentPaymentLine[]
  orderKey?: string
  returnFee?: number
  refundAmount?: number
  cancelledAt?: Date | null
  returnedAt?: Date | null
  securityDeposit?: number
  securityRefunded?: number
  securityHeld?: number
  securityHoldReason?: string
  dryCleanNeeded?: boolean
  stitchingNeeded?: boolean
  dressNotes?: string
  dressNotesDone?: boolean
  dressCareStatus?: 'pending' | 'done'
  dressCareDoneAt?: Date | null
  extraExpense?: number
  extraExpenseNote?: string
  createdAt: Date
  updatedAt: Date
}

const ACTIVE_STATUSES: RentStatus[] = ['booked', 'ongoing']

const bookingMoney = (value: unknown) => {
  const next = Math.round(Number(value))

  if (!Number.isFinite(next) || next < 0) return 0

  return Math.min(999999, next)
}

const paymentOptionOf = (value: unknown): RentPaymentOption =>
  value === 'half' || value === 'full' || value === 'custom' || value === 'unpaid' ? value : 'unpaid'

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
  productPrice: bookingMoney(doc.productPrice),
  finalPrice: bookingMoney(doc.finalPrice),
  paymentOption: paymentOptionOf(doc.paymentOption),
  paymentMethod: doc.paymentMethod || '',
  paymentNote: doc.paymentNote || '',
  paidAmount: bookingMoney(doc.paidAmount),
  balanceAmount: bookingMoney(doc.balanceAmount),
  gstEnabled: Boolean(doc.gstEnabled),
  gstRate: Math.min(100, bookingMoney(doc.gstRate)),
  gstAmount: bookingMoney(doc.gstAmount),
  discountAmount: bookingMoney(doc.discountAmount),
  payments: cleanRentPayments(doc.payments),
  orderKey: doc.orderKey || '',
  returnFee: bookingMoney(doc.returnFee),
  refundAmount: bookingMoney(doc.refundAmount),
  cancelledAt: doc.cancelledAt || null,
  returnedAt: doc.returnedAt || null,
  securityDeposit: bookingMoney(doc.securityDeposit),
  securityRefunded: bookingMoney(doc.securityRefunded),
  securityHeld: bookingMoney(doc.securityHeld),
  securityHoldReason: doc.securityHoldReason || '',
  dryCleanNeeded: Boolean(doc.dryCleanNeeded),
  stitchingNeeded: Boolean(doc.stitchingNeeded),
  dressNotes: doc.dressNotes || '',
  dressNotesDone: Boolean(doc.dressNotesDone),
  dressCareStatus: doc.dressCareStatus === 'done' ? 'done' : 'pending',
  dressCareDoneAt: doc.dressCareDoneAt || null,
  extraExpense: bookingMoney(doc.extraExpense),
  extraExpenseNote: doc.extraExpenseNote || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const isIsoDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const isTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

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
  productPrice?: number | string | null
  finalPrice?: number | string | null
  paymentOption?: RentPaymentOption | string
  paymentMethod?: string
  paymentNote?: string
  paidAmount?: number | string | null
  balanceAmount?: number | string | null
  gstEnabled?: boolean
  gstRate?: number | string | null
  gstAmount?: number | string | null
  discountAmount?: number | string | null
  payments?: RentPaymentLine[] | null
  updateCatalogPrice?: boolean
  orderKey?: string
  allowExtraPaid?: boolean
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

  const startTime = (input.startTime || '').trim()
  const endTime = (input.endTime || '').trim()

  if (startTime && !isTime(startTime)) throw new Error('Select a valid pickup time')
  if (endTime && !isTime(endTime)) throw new Error('Select a valid return time')
  if (startDate === endDate && startTime && endTime && endTime <= startTime) {
    throw new Error('Return time must be after pickup time')
  }
  if (!customerName) throw new Error('Customer name is required')
  if (!customerPhone) throw new Error('Customer phone is required')

  const status = input.status || 'booked'

  if (!['booked', 'ongoing', 'returned', 'cancelled'].includes(status)) {
    throw new Error('Invalid rental status')
  }

  const sentPrice = input.productPrice !== undefined && input.productPrice !== null && input.productPrice !== ''
  const sentFinal = input.finalPrice !== undefined && input.finalPrice !== null && input.finalPrice !== ''
  const productPrice = sentPrice ? bookingMoney(input.productPrice) : null
  const finalPrice = sentFinal ? bookingMoney(input.finalPrice) : productPrice
  const discountAmount = Math.min(finalPrice || 0, bookingMoney(input.discountAmount))
  const taxable = Math.max(0, (finalPrice || 0) - discountAmount)
  const gstRate = Math.min(100, bookingMoney(input.gstRate))
  const gstEnabled = Boolean(input.gstEnabled) && gstRate > 0
  const gstWasSent = input.gstAmount !== undefined && input.gstAmount !== null && input.gstAmount !== ''
  const gstAmount = gstEnabled ? (gstWasSent ? bookingMoney(input.gstAmount) : bookingMoney(Math.round((taxable * gstRate) / 100))) : 0
  const payable = taxable + gstAmount
  const sentPayments = Array.isArray(input.payments)
  let payments = sentPayments ? cleanRentPayments(input.payments) : []
  let paidAmount = sentPayments ? payments.reduce((sum, row) => sum + row.amount, 0) : bookingMoney(input.paidAmount)

  if (paidAmount > payable && !input.allowExtraPaid) {
    paidAmount = payable
    if (sentPayments) payments = scaleRentPayments(payments, payable)
  }

  const balanceWasSent = input.balanceAmount !== undefined && input.balanceAmount !== null && input.balanceAmount !== ''
  const balanceAmount = balanceWasSent ? bookingMoney(input.balanceAmount) : Math.max(0, payable - paidAmount)
  const paymentMethod = sentPayments ? rentPaymentMethodLabel(payments, String(input.paymentMethod || 'Cash')) : String(input.paymentMethod || '').trim().slice(0, 80)

  return {
    productSlug,
    size,
    startDate,
    endDate,
    startTime,
    endTime,
    customerName,
    customerPhone,
    customerEmail: (input.customerEmail || '').trim(),
    notes: (input.notes || '').trim(),
    status: status as RentStatus,
    productPrice,
    finalPrice,
    paymentOption: paymentOptionOf(input.paymentOption),
    paymentMethod,
    paymentNote: String(input.paymentNote || '').trim().slice(0, 240),
    paidAmount,
    balanceAmount,
    gstEnabled,
    gstRate,
    gstAmount,
    discountAmount,
    payments,
    balanceWasSent,
    updateCatalogPrice: Boolean(input.updateCatalogPrice),
    orderKey: String(input.orderKey || '').trim().slice(0, 40)
  }
}

export const checkRentAvailability = async (input: {
  productSlug: string
  size: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
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
  const product = await db.collection<{ sizes?: string[]; sizeStock?: Record<string, number>; rentSizeStock?: Record<string, number>; rentOutOfStock?: string[] }>('Product').findOne(
    { slug: productSlug },
    { projection: { sizes: 1, sizeStock: 1, rentSizeStock: 1, rentOutOfStock: 1 } }
  )
  const offered = Array.isArray(product?.sizes) ? product.sizes.filter(item => item && item !== 'Custom') : []

  if (offered.length && !offered.includes(size)) {
    return { available: false, message: `${size} is not offered on this outfit`, conflicts: [] as ReturnType<typeof mapBooking>[] }
  }

  if (isSizeOutOfStock(product?.rentOutOfStock, size)) {
    return { available: false, message: `${size} is out of stock`, conflicts: [] as ReturnType<typeof mapBooking>[] }
  }

  const stock = sizeQuantity(product?.rentSizeStock || product?.sizeStock, size)
  const filter: Record<string, unknown> = {
    productSlug,
    size,
    status: { $in: [...ACTIVE_STATUSES, 'returned'] }
  }

  if (input.excludeId && ObjectId.isValid(input.excludeId)) {
    filter._id = { $ne: new ObjectId(input.excludeId) }
  }

  const rows = await db.collection<RentBookingDoc>('RentBooking').find(filter).toArray()
  const nextSpan = { startDate, endDate, startTime: input.startTime, endTime: input.endTime }
  const conflicts = rows.filter(row => {
    if (row.status === 'returned') {
      const care = dressCareBlock(row)

      return Boolean(care && rentSpansOverlap(nextSpan, care.span))
    }

    return holdStillOut(row) && rentSpansOverlap(nextSpan, row)
  })
  const pieces = stock === 1 ? 'piece' : 'pieces'

  if (conflicts.length >= stock) {
    const carePending = conflicts.some(row => row.status === 'returned' && row.dressCareStatus !== 'done')
    const ready = conflicts
      .map(row => (row.status === 'returned' && row.dressCareStatus === 'done' && row.dressCareDoneAt ? calendarDay(row.dressCareDoneAt) : ''))
      .filter(Boolean)
      .sort()[0]
    const readyLabel = ready
      ? new Date(`${ready}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : ''
    const back = conflicts
      .filter(row => row.status !== 'returned')
      .map(row => `${row.endDate}${row.endTime ? ` ${row.endTime}` : ''}`)
      .sort()[0]

    return {
      available: false,
      message: back
        ? `Size ${size} is still out and comes back ${back}. Pick a pickup at or after that return.`
        : carePending
          ? `Size ${size} is in dress care. It can be rented on the day care is marked done, and on every day after that.`
          : ready
            ? `Size ${size} can be rented from ${readyLabel} onward.`
            : `All ${stock} ${stock === 1 ? 'piece is' : 'pieces are'} already booked in size ${size} from ${startDate} to ${endDate}`,
      conflicts: conflicts.map(mapBooking)
    }
  }

  const left = stock - conflicts.length

  return {
    available: true,
    message:
      left === stock
        ? `Available for ${size} from ${startDate} to ${endDate}. ${stock} ${pieces} in stock.`
        : `${left} of ${stock} ${pieces} still free for size ${size} from ${startDate} to ${endDate}.`,
    conflicts: []
  }
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
  } else {
    filter.status = { $ne: 'cancelled' }
  }

  const [rows, total] = await Promise.all([
    db.collection<RentBookingDoc>('RentBooking').find(filter).sort({ startDate: -1, createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('RentBooking').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapBooking), total, query.page, query.limit)
}

export type RentBooking = ReturnType<typeof mapBooking>

export type PublicRentHold = {
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  status: RentStatus
  care?: 'pending' | 'done'
  ready?: string
}

/** Active bookings only. No customer details. */
export const listPublicRentHolds = async (productSlug: string): Promise<PublicRentHold[]> => {
  const slug = productSlug.trim()

  if (!slug) return []

  const db = await getDb()
  const rows = await db
    .collection<RentBookingDoc>('RentBooking')
    .find({ productSlug: slug, status: { $in: [...ACTIVE_STATUSES, 'returned'] } })
    .sort({ startDate: 1 })
    .toArray()
  const holds: PublicRentHold[] = []

  for (const row of rows) {
    if (row.status === 'returned') {
      const care = dressCareBlock(row)

      if (!care || !holdStillOut(care.span)) continue

      holds.push({
        size: row.size,
        startDate: care.span.startDate,
        endDate: care.span.endDate,
        startTime: '',
        endTime: '',
        status: 'returned',
        care: care.ready ? 'done' : 'pending',
        ready: care.ready || ''
      })
      continue
    }

    if (!holdStillOut(row)) continue

    holds.push({
      size: row.size,
      startDate: row.startDate,
      endDate: row.endDate,
      startTime: row.startTime || '',
      endTime: row.endTime || '',
      status: row.status
    })
  }

  return holds
}

export const listRentBookingsForEmail = async (email: string) => {
  const normalized = email.trim().toLowerCase()

  if (!normalized) return []

  const db = await getDb()
  const rows = await db
    .collection<RentBookingDoc>('RentBooking')
    .find({ customerEmail: { $regex: `^${normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } })
    .sort({ startDate: -1, createdAt: -1 })
    .toArray()

  return rows.map(mapBooking)
}

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
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime
  })

  if (!availability.available && data.status !== 'cancelled' && data.status !== 'returned') {
    throw new Error(availability.message)
  }

  const catalogPrice = bookingMoney(product.rentPrice)
  const productPrice = data.productPrice === null ? catalogPrice : data.productPrice
  const finalPrice = data.finalPrice === null ? productPrice : data.finalPrice
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
    productPrice,
    finalPrice,
    paymentOption: data.paymentOption,
    paymentMethod: data.paymentMethod,
    paymentNote: data.paymentNote,
    paidAmount: data.paidAmount,
    balanceAmount: data.balanceWasSent ? data.balanceAmount : Math.max(0, finalPrice - data.discountAmount + data.gstAmount - data.paidAmount),
    gstEnabled: data.gstEnabled,
    gstRate: data.gstRate,
    gstAmount: data.gstAmount,
    discountAmount: data.discountAmount,
    payments: data.payments,
    orderKey: data.orderKey,
    createdAt: now,
    updatedAt: now
  }

  if (data.updateCatalogPrice) {
    const rentMrp = bookingMoney(product.rentMrp)

    await db.collection('Product').updateOne(
      { _id: product._id },
      { $set: { rentPrice: productPrice, rentMrp: rentMrp && rentMrp < productPrice ? productPrice : rentMrp, updatedAt: now } }
    )
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
    startTime: data.startTime,
    endTime: data.endTime,
    excludeId: id
  })

  if (!availability.available && data.status !== 'cancelled' && data.status !== 'returned') {
    throw new Error(availability.message)
  }

  const current = await db.collection<RentBookingDoc>('RentBooking').findOne({ _id: new ObjectId(id) })
  const catalogPrice = bookingMoney(product.rentPrice)
  const missingSavedPrice = current?.productPrice === undefined || current?.productPrice === null
  const productPrice = data.productPrice === null || (data.productPrice === 0 && missingSavedPrice) ? catalogPrice : data.productPrice
  const finalPrice = data.finalPrice === null || (data.finalPrice === 0 && (current?.finalPrice === undefined || current?.finalPrice === null)) ? productPrice : data.finalPrice
  const now = new Date()

  if (data.updateCatalogPrice) {
    const rentMrp = bookingMoney(product.rentMrp)

    await db.collection('Product').updateOne(
      { _id: product._id },
      { $set: { rentPrice: productPrice, rentMrp: rentMrp && rentMrp < productPrice ? productPrice : rentMrp, updatedAt: now } }
    )
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
        productPrice,
        finalPrice,
        paymentOption: data.paymentOption,
        paymentMethod: data.paymentMethod,
        paymentNote: data.paymentNote,
        paidAmount: data.paidAmount,
        balanceAmount:
          (current?.balanceAmount === undefined || current?.balanceAmount === null) && data.paymentOption === 'unpaid' && data.paidAmount === 0
            ? Math.max(0, finalPrice - data.discountAmount + data.gstAmount - data.paidAmount)
            : data.balanceWasSent
              ? data.balanceAmount
              : Math.max(0, finalPrice - data.discountAmount + data.gstAmount - data.paidAmount),
        gstEnabled: data.gstEnabled,
        gstRate: data.gstRate,
        gstAmount: data.gstAmount,
        discountAmount: data.discountAmount,
        payments: data.payments,
        ...(data.orderKey ? { orderKey: data.orderKey } : {}),
        updatedAt: now
      }
    }
  )
}

export type RentReturnInput = {
  collectCash?: unknown
  collectUpi?: unknown
  securityDeposit?: unknown
  securityRefunded?: unknown
  securityHoldReason?: unknown
  dryCleanNeeded?: unknown
  stitchingNeeded?: unknown
  dressNotes?: unknown
  extraExpense?: unknown
  extraExpenseNote?: unknown
}

export const markRentReturned = async (id: string, input: RentReturnInput = {}) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  const db = await getDb()
  const current = await db.collection<RentBookingDoc>('RentBooking').findOne({ _id: new ObjectId(id) })

  if (!current) throw new Error('Booking not found')
  if (current.status === 'returned') throw new Error('This outfit is already marked returned')
  if (current.status === 'cancelled') throw new Error('A cancelled rental cannot be marked returned')
  if (!ACTIVE_STATUSES.includes(current.status)) throw new Error('This booking is not out on rent')

  const collectCash = bookingMoney(input.collectCash)
  const collectUpi = bookingMoney(input.collectUpi)
  const extraExpense = bookingMoney(input.extraExpense)
  const deposit = bookingMoney(input.securityDeposit)
  const refunded = bookingMoney(input.securityRefunded)

  if (refunded > deposit) throw new Error('The refund cannot be more than the security deposit')

  const held = deposit - refunded
  const reason = String(input.securityHoldReason || '').trim().slice(0, 400)

  if (held > 0 && reason.length < 3) throw new Error('Write why the security deposit is held')

  const existing = cleanRentPayments(current.payments)
  const alreadyPaid = existing.length ? existing.reduce((sum, row) => sum + row.amount, 0) : bookingMoney(current.paidAmount)
  const seeded = existing.length || alreadyPaid <= 0 ? existing : [{ method: current.paymentMethod || 'Cash', amount: alreadyPaid }]
  const added = [
    collectCash ? { method: 'Cash', amount: collectCash } : null,
    collectUpi ? { method: 'UPI', amount: collectUpi } : null,
    extraExpense ? { method: 'Extra', amount: extraExpense } : null
  ].filter((row): row is { method: string; amount: number } => Boolean(row))
  const payments = [...seeded, ...added]
  const paidAmount = alreadyPaid + collectCash + collectUpi + extraExpense
  const payable = Math.max(0, bookingMoney(current.finalPrice) - Math.min(bookingMoney(current.finalPrice), bookingMoney(current.discountAmount)) + bookingMoney(current.gstAmount)) + extraExpense
  const now = new Date()

  await db.collection('RentBooking').updateOne(
    { _id: current._id },
    {
      $set: {
        status: 'returned',
        payments,
        paidAmount,
        balanceAmount: Math.max(0, payable - paidAmount),
        paymentMethod: rentPaymentMethodLabel(payments, current.paymentMethod || 'Cash'),
        returnedAt: now,
        securityDeposit: deposit,
        securityRefunded: refunded,
        securityHeld: held,
        securityHoldReason: held > 0 ? reason : '',
        dryCleanNeeded: Boolean(input.dryCleanNeeded),
        stitchingNeeded: Boolean(input.stitchingNeeded),
        dressNotes: String(input.dressNotes || '').trim().slice(0, 400),
        dressNotesDone: false,
        dressCareStatus: 'pending',
        dressCareDoneAt: null,
        extraExpense,
        extraExpenseNote: extraExpense ? String(input.extraExpenseNote || '').trim().slice(0, 240) : '',
        updatedAt: now
      }
    }
  )
}

export const listDressCare = async () => {
  const db = await getDb()
  const rows = await db.collection<RentBookingDoc>('RentBooking').find({ status: 'returned' }).sort({ returnedAt: -1, endDate: -1 }).toArray()

  return rows.map(mapBooking)
}

export const updateDressCare = async (
  id: string,
  input: {
    dryCleanNeeded?: unknown
    stitchingNeeded?: unknown
    dressNotes?: unknown
    dressNotesDone?: unknown
    dressCareStatus?: unknown
  }
) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  const db = await getDb()
  const current = await db.collection<RentBookingDoc>('RentBooking').findOne({ _id: new ObjectId(id) })

  if (!current) throw new Error('Booking not found')
  if (current.status !== 'returned') throw new Error('Only a returned outfit can be updated in dress care')

  const status = input.dressCareStatus === 'done' ? 'done' : 'pending'
  const now = new Date()

  await db.collection('RentBooking').updateOne(
    { _id: current._id },
    {
      $set: {
        dryCleanNeeded: Boolean(input.dryCleanNeeded),
        stitchingNeeded: Boolean(input.stitchingNeeded),
        dressNotes: String(input.dressNotes || '').trim().slice(0, 400),
        dressNotesDone: Boolean(input.dressNotesDone),
        dressCareStatus: status,
        dressCareDoneAt: status === 'done' ? current.dressCareDoneAt || now : null,
        updatedAt: now
      }
    }
  )

  const saved = await db.collection<RentBookingDoc>('RentBooking').findOne({ _id: current._id })

  if (!saved) throw new Error('Booking not found')

  return mapBooking(saved)
}

export const cancelRentBooking = async (id: string, returnFee?: unknown, refundAmount?: unknown) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  const db = await getDb()
  const current = await db.collection<RentBookingDoc>('RentBooking').findOne({ _id: new ObjectId(id) })

  if (!current) throw new Error('Booking not found')
  if (current.status === 'cancelled') throw new Error('This booking is already cancelled')
  if (current.status === 'returned') throw new Error('A returned rental cannot be cancelled')

  const quote = settleCancel(current.paidAmount, returnFee, refundAmount)
  const now = new Date()

  await db.collection('RentBooking').updateOne(
    { _id: current._id },
    { $set: { status: 'cancelled', returnFee: quote.returnFee, refundAmount: quote.refundAmount, cancelledAt: now, updatedAt: now } }
  )
}

export const deleteRentBooking = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid rental')

  await (await getDb()).collection('RentBooking').deleteOne({ _id: new ObjectId(id) })
}

const emailsMatch = (left: string, right: string) => left.trim().toLowerCase() === right.trim().toLowerCase()

const CUSTOMER_EDITABLE: RentStatus[] = ['booked', 'ongoing']

export const getRentBookingOwnedBy = async (id: string, email: string) => {
  if (!ObjectId.isValid(id) || !email.trim()) return null

  const doc = await (await getDb()).collection<RentBookingDoc>('RentBooking').findOne({ _id: new ObjectId(id) })

  if (!doc || !emailsMatch(doc.customerEmail, email)) return null

  return mapBooking(doc)
}

export type OwnRentBookingPatch = {
  size: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  customerName: string
  customerPhone: string
  notes?: string
}

export const updateOwnRentBooking = async (id: string, email: string, input: OwnRentBookingPatch) => {
  const current = await getRentBookingOwnedBy(id, email)

  if (!current) throw new Error('Booking not found')
  if (!CUSTOMER_EDITABLE.includes(current.status)) throw new Error('This booking can no longer be changed')

  const data = normalizeInput({
    productSlug: current.productSlug,
    size: input.size,
    startDate: input.startDate,
    endDate: input.endDate,
    startTime: input.startTime,
    endTime: input.endTime,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: current.customerEmail,
    notes: input.notes,
    status: current.status
  })

  const availability = await checkRentAvailability({
    productSlug: current.productSlug,
    size: data.size,
    startDate: data.startDate,
    endDate: data.endDate,
    startTime: data.startTime,
    endTime: data.endTime,
    excludeId: id
  })

  if (!availability.available) throw new Error(availability.message)

  await (await getDb()).collection('RentBooking').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        size: data.size,
        startDate: data.startDate,
        endDate: data.endDate,
        startTime: data.startTime,
        endTime: data.endTime,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        notes: data.notes,
        updatedAt: new Date()
      }
    }
  )

  const updated = await getRentBookingOwnedBy(id, email)

  if (!updated) throw new Error('Booking not found')

  return updated
}

export const cancelOwnRentBooking = async (id: string, email: string) => {
  const current = await getRentBookingOwnedBy(id, email)

  if (!current) throw new Error('Booking not found')
  if (current.status === 'cancelled') throw new Error('This booking is already cancelled')
  if (current.status === 'returned') throw new Error('A returned rental cannot be cancelled')

  await (await getDb()).collection('RentBooking').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: 'cancelled', updatedAt: new Date() } }
  )

  const updated = await getRentBookingOwnedBy(id, email)

  if (!updated) throw new Error('Booking not found')

  return updated
}






