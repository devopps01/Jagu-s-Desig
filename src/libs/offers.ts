export type OfferType = 'percent' | 'fixed'
export type OfferStatus = 'active' | 'inactive'

export const offerAmount = (subtotal: number, type: OfferType, value: number) => {
  const base = Math.max(0, Number(subtotal) || 0)
  const amount = Math.max(0, Number(value) || 0)

  if (!base || !amount) return 0
  if (type === 'percent') return Math.min(base, Math.round((base * amount) / 100))

  return Math.min(base, Math.round(amount))
}

export const codeify = (value: string) =>
  value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '')
    .slice(0, 24)
