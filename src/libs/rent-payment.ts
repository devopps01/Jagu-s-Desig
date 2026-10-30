export type RentPaymentOption = 'unpaid' | 'half' | 'full' | 'custom'

export const RENT_PAYMENT_OPTIONS: { id: RentPaymentOption; label: string }[] = [
  { id: 'unpaid', label: 'Not paid' },
  { id: 'half', label: 'Half payment' },
  { id: 'full', label: 'Full payment' },
  { id: 'custom', label: 'Custom amount' }
]

export const RENT_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank transfer', 'Card', 'Other'] as const

export type RentPaymentLine = { method: string; amount: number }

const paymentMoney = (value: unknown) => {
  const next = Math.round(Number(value))

  if (!Number.isFinite(next) || next < 0) return 0

  return Math.min(999999, next)
}

export const cleanRentPayments = (rows: unknown): RentPaymentLine[] => {
  if (!Array.isArray(rows)) return []

  return rows
    .map(row => {
      const item = row && typeof row === 'object' ? (row as { method?: unknown; amount?: unknown }) : {}

      return {
        method: String(item.method || 'Cash').trim().slice(0, 40) || 'Cash',
        amount: paymentMoney(item.amount)
      }
    })
    .filter(row => row.amount > 0)
    .slice(0, 6)
}

export const scaleRentPayments = (rows: RentPaymentLine[], cap: number): RentPaymentLine[] => {
  const limit = paymentMoney(cap)
  const sum = rows.reduce((total, row) => total + row.amount, 0)

  if (sum <= limit) return rows

  let left = limit

  return rows
    .map((row, index) => {
      if (index === rows.length - 1) return { ...row, amount: left }

      const part = Math.min(left, Math.round((limit * row.amount) / sum))

      left -= part

      return { ...row, amount: part }
    })
    .filter(row => row.amount > 0)
}

export const rentPaymentMethodLabel = (rows: RentPaymentLine[], fallback = 'Cash') => {
  const label = [...new Set(rows.map(row => row.method).filter(Boolean))].join(' + ')

  return (label || fallback).slice(0, 80)
}

export const mergeRentPayments = (groups: RentPaymentLine[][]): RentPaymentLine[] => {
  const totals = new Map<string, number>()

  groups.flat().forEach(row => {
    if (row.amount <= 0) return

    totals.set(row.method, (totals.get(row.method) || 0) + row.amount)
  })

  return [...totals].map(([method, amount]) => ({ method, amount }))
}
