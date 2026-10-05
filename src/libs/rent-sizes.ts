export const RENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] as const
export type RentSize = (typeof RENT_SIZES)[number]

export const PRODUCT_SIZES = [...RENT_SIZES, 'Custom'] as const
export const DEFAULT_PRODUCT_SIZES = [...RENT_SIZES]

export const productSizes = (sizes?: string[] | null) => {
  const picked = (sizes || []).map(item => String(item || '').trim()).filter(item => (PRODUCT_SIZES as readonly string[]).includes(item) && item !== 'Custom')
  const base = picked.length ? picked : [...DEFAULT_PRODUCT_SIZES]

  return [...base, 'Custom']
}
