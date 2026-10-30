import { productNumber } from '@admin/views/RentFormDialog'
import { mergedBillPayments, rentPayable, type RentBill } from '@admin/views/rentBill'
import type { RentBooking } from '@/libs/rentals'

const phoneDigits = (phone: string) => {
  const digits = (phone || '').replace(/\D/g, '')

  return digits.length > 10 ? digits.slice(-10) : digits
}

const stamp = (value: string | Date) => {
  const time = new Date(value).getTime()

  return Number.isFinite(time) ? time : 0
}

export type RentOrder = RentBooking[]

export type RentCustomer = {
  key: string
  name: string
  phone: string
  email: string
  orders: RentOrder[]
  outfitCount: number
  total: number
  latest: string
}

const orderGroups = (rows: RentBooking[]): RentOrder[] => {
  const keyed = new Map<string, RentBooking[]>()
  const loose: RentBooking[] = []

  rows.forEach(row => {
    if (row.orderKey) {
      const list = keyed.get(row.orderKey) || []

      list.push(row)
      keyed.set(row.orderKey, list)

      return
    }

    loose.push(row)
  })

  const orders = [...keyed.values()]

  loose.sort((a, b) => stamp(a.createdAt) - stamp(b.createdAt))

  let cluster: RentBooking[] = []
  const flush = () => {
    if (cluster.length) orders.push(cluster)

    cluster = []
  }

  loose.forEach(row => {
    const at = stamp(row.createdAt)
    const previous = cluster.length ? stamp(cluster[cluster.length - 1].createdAt) : 0

    if (!cluster.length || at - previous <= 3 * 60 * 1000) {
      cluster.push(row)

      return
    }

    flush()
    cluster = [row]
  })
  flush()

  return orders.sort((a, b) => stamp(b[0].createdAt) - stamp(a[0].createdAt))
}

export const rentCustomers = (rows: RentBooking[]): RentCustomer[] => {
  const byPhone = new Map<string, RentBooking[]>()

  rows.forEach(row => {
    const key = phoneDigits(row.customerPhone) || row.customerName.trim().toLowerCase() || row.id
    const list = byPhone.get(key) || []

    list.push(row)
    byPhone.set(key, list)
  })

  return [...byPhone.entries()]
    .map(([key, list]) => {
      const latest = [...list].sort((a, b) => stamp(b.createdAt) - stamp(a.createdAt))[0]
      const orders = orderGroups(list)

      return {
        key,
        name: latest.customerName,
        phone: latest.customerPhone,
        email: latest.customerEmail,
        orders,
        outfitCount: list.length,
        total: list.reduce((sum, row) => sum + rentPayable(row), 0),
        latest: latest.createdAt instanceof Date ? latest.createdAt.toISOString() : String(latest.createdAt || latest.startDate || '')
      }
    })
    .sort((a, b) => stamp(b.latest) - stamp(a.latest))
}

export const rentOrderBill = (rows: RentOrder): RentBill => {
  const first = rows[0]
  const productPrice = rows.reduce((sum, row) => sum + (Number(row.productPrice) || 0), 0)
  const finalPrice = rows.reduce((sum, row) => sum + (Number(row.finalPrice) || 0), 0)
  const paidAmount = rows.reduce((sum, row) => sum + (Number(row.paidAmount) || 0), 0)
  const balanceAmount = rows.reduce((sum, row) => sum + (Number(row.balanceAmount) || 0), 0)
  const gstAmount = rows.reduce((sum, row) => sum + (Number(row.gstAmount) || 0), 0)
  const gstRate = rows.find(row => Number(row.gstAmount) > 0)?.gstRate || 0
  const discountAmount = rows.reduce((sum, row) => sum + (Number(row.discountAmount) || 0), 0)
  const payments = mergedBillPayments(rows)
  const created = first.createdAt instanceof Date ? first.createdAt.toISOString() : String(first.createdAt || '')

  return {
    id: first.id,
    productName: rows.map(row => row.productName).filter(Boolean).join(', '),
    productNo: rows.length > 1 ? String(rows.length) : productNumber({ imageUrl: first.productImage, id: first.productId, slug: first.productSlug }),
    lines:
      rows.length > 1
        ? rows.map(row => ({
            name: row.productName,
            productNo: productNumber({ imageUrl: row.productImage, id: row.productId, slug: row.productSlug }),
            size: row.size,
            startDate: row.startDate,
            endDate: row.endDate,
            price: Number(row.finalPrice) || 0
          }))
        : undefined,
    size: rows.length > 1 ? rows.map(row => row.size).join(', ') : first.size,
    startDate: first.startDate,
    endDate: first.endDate,
    startTime: first.startTime || '10:00',
    endTime: first.endTime || '18:00',
    customerName: first.customerName,
    customerPhone: first.customerPhone,
    customerEmail: first.customerEmail || '',
    notes: first.notes || '',
    status: first.status,
    productPrice,
    finalPrice,
    paymentOption: first.paymentOption || 'unpaid',
    paymentNote: first.paymentNote || '',
    paidAmount,
    balanceAmount,
    gstEnabled: gstAmount > 0,
    gstRate,
    gstAmount,
    discountAmount,
    payments,
    paymentMethod: payments.map(line => line.method).join(' + ') || first.paymentMethod || 'Cash',
    createdAt: created
  }
}

export const matchesRentCustomer = (customer: RentCustomer, query: string) => {
  const text = query.trim().toLowerCase()

  if (!text) return true

  const digits = text.replace(/\D/g, '')

  if (digits && phoneDigits(customer.phone).includes(digits)) return true

  return customer.name.toLowerCase().includes(text) || customer.phone.toLowerCase().includes(text)
}
