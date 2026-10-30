import { STORE_PHONE_DISPLAY, SURAT_ATELIER } from '@/libs/contact-types'
import { cleanRentPayments, mergeRentPayments, RENT_PAYMENT_OPTIONS, type RentPaymentLine, type RentPaymentOption } from '@/libs/rent-payment'

export type RentBillLine = {
  name: string
  productNo: string
  size: string
  quantity?: number
  startDate: string
  endDate: string
  price: number
}

export type RentBill = {
  id: string
  kind?: 'rent' | 'sale'
  quantity?: number
  productName: string
  productNo: string
  lines?: RentBillLine[]
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  status: string
  productPrice: number
  finalPrice: number
  paymentOption: RentPaymentOption
  paymentMethod: string
  paymentNote: string
  paidAmount: number
  balanceAmount: number
  gstEnabled?: boolean
  gstRate?: number
  gstAmount?: number
  discountAmount?: number
  payments?: RentPaymentLine[]
  createdAt: string
}

export const rentPayable = (bill: Pick<RentBill, 'finalPrice' | 'gstAmount' | 'discountAmount'>) => {
  const subtotal = Math.max(0, Math.round(bill.finalPrice || 0))
  const discount = Math.min(subtotal, Math.max(0, Math.round(bill.discountAmount || 0)))

  return Math.max(0, subtotal - discount + Math.round(bill.gstAmount || 0))
}

export const billPayments = (bill: Pick<RentBill, 'payments' | 'paidAmount' | 'paymentMethod'>) => {
  const lines = cleanRentPayments(bill.payments)

  if (lines.length) return lines

  const paid = Math.max(0, Math.round(bill.paidAmount || 0))

  return paid > 0 ? [{ method: bill.paymentMethod || 'Cash', amount: paid }] : []
}

export const mergedBillPayments = (rows: Pick<RentBill, 'payments' | 'paidAmount' | 'paymentMethod'>[]) => mergeRentPayments(rows.map(billPayments))

export const RENT_SHOP = {
  name: "Jagu's Designing",
  line1: SURAT_ATELIER.line1,
  line2: SURAT_ATELIER.line2,
  phone: STORE_PHONE_DISPLAY
}

export const rentBillNo = (id: string) => `RB-${(id || 'NEW').slice(-6).toUpperCase()}`

export const rentMoney = (value: number) => `Rs. ${Math.max(0, Math.round(value || 0)).toLocaleString('en-IN')}`

export const rentDayLabel = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)

  if (!year || !month || !day) return iso || '-'

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const rentSlotLabel = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)

  if (!Number.isFinite(hours)) return value || '-'

  const date = new Date()

  date.setHours(hours, minutes || 0, 0, 0)

  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export const rentDayCount = (start: string, end: string) => {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)

  if (!sy || !ey) return 1

  const from = new Date(sy, sm - 1, sd)
  const to = new Date(ey, em - 1, ed)
  const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1

  return Math.max(1, days)
}

export const rentPaymentLabel = (option: RentPaymentOption) => RENT_PAYMENT_OPTIONS.find(item => item.id === option)?.label || 'Not paid'

export const rentStatusLabel = (status: string) =>
  status === 'sold' ? 'Sold' : status === 'ongoing' ? 'Ongoing' : status === 'returned' ? 'Returned' : status === 'cancelled' ? 'Cancelled' : 'Booked'

export const billHeading = (bill: Pick<RentBill, 'kind' | 'id'>) => (bill.kind === 'sale' ? `SB-${(bill.id || 'NEW').slice(-6).toUpperCase()}` : rentBillNo(bill.id))
