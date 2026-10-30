export const RENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] as const
export type RentSize = (typeof RENT_SIZES)[number]

export const PRODUCT_SIZES = [...RENT_SIZES, 'Custom'] as const
export const DEFAULT_PRODUCT_SIZES = [...RENT_SIZES]

export const productSizes = (sizes?: string[] | null) => {
  const picked = (sizes || []).map(item => String(item || '').trim()).filter(item => (PRODUCT_SIZES as readonly string[]).includes(item) && item !== 'Custom')
  const base = picked.length ? picked : [...DEFAULT_PRODUCT_SIZES]

  return [...base, 'Custom']
}

/** Pieces kept for one size. Missing or invalid stock stays at 1, so one booking still fills that size. */
export const sizeQuantity = (stock: Record<string, number> | null | undefined, size: string) => {
  const value = Number(stock?.[size])

  if (!Number.isFinite(value) || value < 1) return 1

  return Math.min(99, Math.floor(value))
}

/** A saved selling quantity, including 0. Missing means the size is not capped. */
export const stockCount = (stock: Record<string, unknown> | null | undefined, size: string) => {
  if (!stock || !Object.prototype.hasOwnProperty.call(stock, size)) return null

  const value = Number(stock[size])

  if (!Number.isFinite(value)) return null

  return Math.max(0, Math.min(99, Math.floor(value)))
}

export const stockSizeKey = (size: string) => {
  const value = String(size || '').trim()

  if (/^custom\b/i.test(value)) return 'Custom'

  return value
}

export const normalizeSizeStock = (sizes: string[], stock?: Record<string, unknown> | null) => {
  const next: Record<string, number> = {}

  for (const size of sizes) {
    next[size] = sizeQuantity(stock as Record<string, number> | undefined, size)
  }

  return next
}

export const normalizeSaleStock = (sizes: string[], stock?: Record<string, unknown> | null) => {
  const next: Record<string, number> = {}

  for (const size of sizes) {
    const count = stockCount(stock, size)

    if (count !== null) next[size] = count
  }

  return next
}

export const isSizeOutOfStock = (flags: string[] | null | undefined, size: string) =>
  (flags || []).map(item => stockSizeKey(item)).includes(stockSizeKey(size))

export const salePiecesLeft = (
  product: { saleSizeStock?: Record<string, number>; saleSold?: Record<string, number> },
  size: string
) => {
  const key = stockSizeKey(size)
  const cap = stockCount(product.saleSizeStock, key)

  if (cap === null) return null

  return Math.max(0, cap - (Number(product.saleSold?.[key]) || 0))
}
