export const RENT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'] as const
export type RentSize = (typeof RENT_SIZES)[number]
