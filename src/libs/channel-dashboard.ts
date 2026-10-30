import { getDb } from '@/libs/mongo'
import { RENT_SIZES, stockSizeKey } from '@/libs/rent-sizes'

export type DashboardPoint = { label: string; amount: number; count: number }
export type DashboardSlice = { label: string; value: number }
export type DashboardOutfit = { name: string; amount: number; count: number }

export type ChannelDashboard = {
  kind: 'sale' | 'rent'
  bills: number
  pieces: number
  customers: number
  collected: number
  due: number
  total: number
  outNow: number
  daily: DashboardPoint[]
  sizes: DashboardSlice[]
  payments: DashboardSlice[]
  top: DashboardOutfit[]
}

type MoneyRow = {
  productName?: string
  size?: string
  quantity?: number
  finalPrice?: number
  discountAmount?: number
  gstAmount?: number
  paidAmount?: number
  balanceAmount?: number
  paymentMethod?: string
  payments?: { method?: string; amount?: number }[]
  customerPhone?: string
  orderKey?: string
  status?: string
  createdAt?: Date | string
}

const money = (value: unknown) => {
  const next = Math.round(Number(value))

  if (!Number.isFinite(next) || next < 0) return 0

  return next
}

const payableOf = (row: MoneyRow) => {
  const finalPrice = money(row.finalPrice)
  const discount = Math.min(finalPrice, money(row.discountAmount))

  return Math.max(0, finalPrice - discount + money(row.gstAmount))
}

const dayKey = (value: Date | string | undefined) => {
  const date = value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

const lastDays = () => {
  const today = dayKey(new Date())
  const [year, month, day] = today.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day))

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start)

    date.setUTCDate(start.getUTCDate() - (13 - index))

    const key = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

    return { key, label }
  })
}

const phoneKey = (value: string | undefined) => (value || '').replace(/\D/g, '')

const build = (kind: 'sale' | 'rent', rows: MoneyRow[], outNow: number): ChannelDashboard => {
  const days = lastDays()
  const dayIndex = new Map(days.map((day, index) => [day.key, index]))
  const daily = days.map(day => ({ label: day.label, amount: 0, count: 0 }))
  const sizeMap = new Map<string, number>(RENT_SIZES.map(size => [size, 0]))
  const payMap = new Map<string, number>()
  const topMap = new Map<string, DashboardOutfit>()
  const bills = new Set<string>()
  const customers = new Set<string>()
  let pieces = 0
  let collected = 0
  let due = 0
  let total = 0

  rows.forEach((row, index) => {
    const amount = payableOf(row)
    const paid = Math.min(amount, money(row.paidAmount))
    const balance = Math.min(amount, money(row.balanceAmount ?? amount - paid))
    const qty = Math.max(1, money(row.quantity) || 1)
    const size = stockSizeKey(row.size || '') || 'Custom'
    const name = (row.productName || 'Outfit').trim() || 'Outfit'
    const phone = phoneKey(row.customerPhone)
    const bill = (row.orderKey || '').trim() || `row-${index}`
    const spot = dayIndex.get(dayKey(row.createdAt))

    bills.add(bill)
    if (phone.length >= 6) customers.add(phone)
    pieces += qty
    collected += paid
    due += balance
    total += amount
    sizeMap.set(size, (sizeMap.get(size) || 0) + qty)

    const current = topMap.get(name) || { name, amount: 0, count: 0 }

    current.amount += amount
    current.count += qty
    topMap.set(name, current)

    if (spot !== undefined) {
      daily[spot].amount += amount
      daily[spot].count += 1
    }

    const lines = Array.isArray(row.payments) ? row.payments.filter(line => money(line.amount) > 0) : []

    if (lines.length) {
      lines.forEach(line => {
        const method = (line.method || 'Cash').trim() || 'Cash'

        payMap.set(method, (payMap.get(method) || 0) + money(line.amount))
      })
    } else if (paid > 0) {
      const method = (row.paymentMethod || 'Cash').trim() || 'Cash'

      payMap.set(method, (payMap.get(method) || 0) + paid)
    }
  })

  const payments = [...payMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return {
    kind,
    bills: bills.size,
    pieces,
    customers: customers.size,
    collected,
    due,
    total,
    outNow,
    daily,
    sizes: [...sizeMap.entries()].map(([label, value]) => ({ label, value })),
    payments,
    top: [...topMap.values()].sort((a, b) => b.amount - a.amount || b.count - a.count).slice(0, 6)
  }
}

const saleProjection = {
  productName: 1,
  size: 1,
  quantity: 1,
  finalPrice: 1,
  discountAmount: 1,
  gstAmount: 1,
  paidAmount: 1,
  balanceAmount: 1,
  paymentMethod: 1,
  payments: 1,
  customerPhone: 1,
  orderKey: 1,
  createdAt: 1
}

export const saleDashboard = async (): Promise<ChannelDashboard> => {
  const db = await getDb()
  const rows = await db.collection<MoneyRow>('ShopSale').find({ status: { $ne: 'cancelled' } }).project(saleProjection).toArray()

  return build('sale', rows, 0)
}

export const rentDashboard = async (): Promise<ChannelDashboard> => {
  const db = await getDb()
  const rows = await db
    .collection<MoneyRow>('RentBooking')
    .find({ status: { $ne: 'cancelled' } })
    .project({ ...saleProjection, status: 1 })
    .toArray()
  const outNow = await db.collection('RentBooking').countDocuments({ status: { $in: ['booked', 'ongoing'] } })

  return build('rent', rows, outNow)
}
