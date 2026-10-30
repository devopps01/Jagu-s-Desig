import { getDb } from '@/libs/mongo'

export type ChannelPoint = { label: string; rent: number; store: number; online: number }

export type MainChannel = {
  bills: number
  pieces: number
  total: number
  collected: number
  due: number
}

export type MainDashboard = {
  profit: number
  returnFees: number
  collected: number
  due: number
  rent: MainChannel & { currentPieces: number; currentAmount: number; outToday: number; overdue: number; ahead: number }
  store: MainChannel
  online: MainChannel
  daily: ChannelPoint[]
  monthly: ChannelPoint[]
}

type MoneyRow = {
  quantity?: number
  finalPrice?: number
  discountAmount?: number
  gstAmount?: number
  paidAmount?: number
  balanceAmount?: number
  status?: string
  startDate?: string
  endDate?: string
  createdAt?: Date | string
  returnFee?: number
  orderKey?: string
}

type WebItem = { qty?: number }
type WebOrderRow = {
  status?: string
  payment?: string
  total?: number
  items?: WebItem[]
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

const istDay = (value?: Date | string) => {
  const date = value ? new Date(value) : new Date()

  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
}

const lastDays = () => {
  const today = istDay()
  const [year, month, day] = today.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day))

  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start)

    date.setUTCDate(start.getUTCDate() - (13 - index))

    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    }
  })
}

const lastMonths = () => {
  const today = istDay()
  const [year, month] = today.split('-').map(Number)

  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (5 - index), 1))

    return {
      key: date.toISOString().slice(0, 7),
      label: date.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' })
    }
  })
}

const emptyChannel = (): MainChannel => ({ bills: 0, pieces: 0, total: 0, collected: 0, due: 0 })

const blankPoint = (label: string): ChannelPoint => ({ label, rent: 0, store: 0, online: 0 })

export const mainDashboard = async (): Promise<MainDashboard> => {
  const db = await getDb()
  const [rentRows, saleRows, webRows] = await Promise.all([
    db
      .collection<MoneyRow>('RentBooking')
      .find({})
      .project({
        quantity: 1,
        finalPrice: 1,
        discountAmount: 1,
        gstAmount: 1,
        paidAmount: 1,
        balanceAmount: 1,
        status: 1,
        startDate: 1,
        endDate: 1,
        createdAt: 1,
        returnFee: 1,
        orderKey: 1
      })
      .toArray(),
    db
      .collection<MoneyRow>('ShopSale')
      .find({})
      .project({
        quantity: 1,
        finalPrice: 1,
        discountAmount: 1,
        gstAmount: 1,
        paidAmount: 1,
        balanceAmount: 1,
        status: 1,
        createdAt: 1,
        returnFee: 1,
        orderKey: 1
      })
      .toArray(),
    db
      .collection<WebOrderRow>('WebOrder')
      .find({})
      .project({ status: 1, payment: 1, total: 1, 'items.qty': 1, createdAt: 1 })
      .toArray()
  ])

  const days = lastDays()
  const months = lastMonths()
  const dayIndex = new Map(days.map((day, index) => [day.key, index]))
  const monthIndex = new Map(months.map((month, index) => [month.key, index]))
  const daily = days.map(day => blankPoint(day.label))
  const monthly = months.map(month => blankPoint(month.label))
  const today = istDay()
  const rent = { ...emptyChannel(), currentPieces: 0, currentAmount: 0, outToday: 0, overdue: 0, ahead: 0 }
  const store = emptyChannel()
  const online = emptyChannel()
  const rentBills = new Set<string>()
  const saleBills = new Set<string>()
  let returnFees = 0

  const addPoint = (createdAt: Date | string | undefined, channel: 'rent' | 'store' | 'online', amount: number) => {
    const day = istDay(createdAt)
    const daySpot = dayIndex.get(day)
    const monthSpot = monthIndex.get(day.slice(0, 7))

    if (daySpot !== undefined) daily[daySpot][channel] += amount
    if (monthSpot !== undefined) monthly[monthSpot][channel] += amount
  }

  rentRows.forEach((row, index) => {
    if (row.status === 'cancelled') {
      returnFees += money(row.returnFee)

      return
    }

    const amount = payableOf(row)
    const paid = Math.min(amount, money(row.paidAmount))
    const balance = Math.min(amount, money(row.balanceAmount ?? amount - paid))
    const qty = Math.max(1, money(row.quantity) || 1)
    const open = row.status !== 'returned'
    const start = (row.startDate || '').trim()
    const end = (row.endDate || '').trim()

    rentBills.add((row.orderKey || '').trim() || `rent-${index}`)
    rent.pieces += qty
    rent.total += amount
    rent.collected += paid
    rent.due += balance
    addPoint(row.createdAt, 'rent', amount)

    if (!open || !start || !end) return

    if (start > today) {
      rent.ahead += qty
    } else if (end < today) {
      rent.overdue += qty
      rent.currentPieces += qty
      rent.currentAmount += amount
    } else {
      rent.outToday += qty
      rent.currentPieces += qty
      rent.currentAmount += amount
    }
  })

  rent.bills = rentBills.size

  saleRows.forEach((row, index) => {
    if (row.status === 'cancelled') {
      returnFees += money(row.returnFee)

      return
    }

    const amount = payableOf(row)
    const paid = Math.min(amount, money(row.paidAmount))
    const balance = Math.min(amount, money(row.balanceAmount ?? amount - paid))
    const qty = Math.max(1, money(row.quantity) || 1)

    saleBills.add((row.orderKey || '').trim() || `sale-${index}`)
    store.pieces += qty
    store.total += amount
    store.collected += paid
    store.due += balance
    addPoint(row.createdAt, 'store', amount)
  })

  store.bills = saleBills.size

  const activeWeb = new Set(['pending', 'confirmed', 'packed', 'shipped', 'delivered'])

  webRows.forEach(row => {
    if (!activeWeb.has(row.status || '')) return

    const amount = money(row.total)
    const pieces = (row.items || []).reduce((sum: number, item: WebItem) => sum + Math.max(1, money(item.qty) || 1), 0) || 1
    const paid = row.payment === 'paid'

    online.bills += 1
    online.pieces += pieces
    online.total += amount
    online.collected += paid ? amount : 0
    online.due += paid ? 0 : amount
    addPoint(row.createdAt, 'online', amount)
  })

  const collected = rent.collected + store.collected + online.collected

  return {
    profit: collected + returnFees,
    returnFees,
    collected,
    due: rent.due + store.due + online.due,
    rent,
    store,
    online,
    daily,
    monthly
  }
}
