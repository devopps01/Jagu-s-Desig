import { dressCareBlock } from '@/libs/rent-span'
import { getDb } from '@/libs/mongo'
import { ensureProductNumbers, type ProductDoc } from '@/libs/products'
import { PRODUCT_SIZES, isSizeOutOfStock, productSizes, sizeQuantity, stockSizeKey } from '@/libs/rent-sizes'

export type AvailabilityRow = {
  id: string
  productId: string
  productNo: number
  name: string
  slug: string
  imageUrl: string
  category: string
  size: string
  total: number
  booked: number
  available: number
  status: 'available' | 'booked' | 'out'
}

export type AvailabilityBooking = {
  id: string
  productSlug: string
  size: string
  startDate: string
  endDate: string
  status: string
  customerName: string
  dressCareStatus?: string
  dressCareDoneAt?: Date | string | null
}

const iso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export const defaultAvailabilityDates = () => {
  const start = new Date()
  const end = new Date()

  end.setDate(end.getDate() + 2)

  return { start: iso(start), end: iso(end) }
}

const occupies = (booking: { startDate: string; endDate: string }, start: string, end: string) =>
  (booking.startDate <= end && start <= booking.endDate) || booking.endDate < start

export const listRentAvailability = async (input: {
  start?: string
  end?: string
  category?: string
  size?: string
  search?: string
  availableOnly?: boolean
}) => {
  const fallback = defaultAvailabilityDates()
  const start = /^\d{4}-\d{2}-\d{2}$/.test(input.start || '') ? String(input.start) : fallback.start
  const end = /^\d{4}-\d{2}-\d{2}$/.test(input.end || '') ? String(input.end) : fallback.end
  const rangeStart = start <= end ? start : end
  const rangeEnd = start <= end ? end : start

  await ensureProductNumbers()
  const db = await getDb()
  const products = await db
    .collection<ProductDoc>('Product')
    .find({ listingType: { $in: ['rent', 'both'] }, status: 'active' })
    .sort({ productNo: 1, name: 1 })
    .toArray()
  const bookings = await db
    .collection<{ _id: { toHexString(): string }; productSlug: string; size: string; startDate: string; endDate: string; status: string; customerName?: string; dressCareStatus?: string; dressCareDoneAt?: Date | string | null }>('RentBooking')
    .find({})
    .project({ productSlug: 1, size: 1, startDate: 1, endDate: 1, status: 1, customerName: 1, dressCareStatus: 1, dressCareDoneAt: 1 })
    .sort({ startDate: -1 })
    .toArray()

  const history: AvailabilityBooking[] = bookings.map(row => ({
    id: row._id.toHexString(),
    productSlug: row.productSlug,
    size: stockSizeKey(row.size),
    startDate: row.startDate,
    endDate: row.endDate,
    status: row.status,
    customerName: row.customerName || '',
    dressCareStatus: row.dressCareStatus,
    dressCareDoneAt: row.dressCareDoneAt
  }))

  const categories = [...new Set(products.map(product => String(product.style || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  const search = String(input.search || '').trim().toLowerCase()
  const category = String(input.category || '').trim()
  const sizeFilter = String(input.size || '').trim()

  const rows: AvailabilityRow[] = []

  for (const product of products) {
    const style = String(product.style || '').trim()

    if (category && style !== category) continue

    const number = String(product.productNo || '')
    const haystack = `${product.name} ${product.slug} ${number}`.toLowerCase()

    if (search && !haystack.includes(search)) continue

    const sizes = productSizes(product.sizes).filter(size => (PRODUCT_SIZES as readonly string[]).includes(size))

    for (const size of sizes) {
      if (sizeFilter && size !== sizeFilter) continue

      const total = sizeQuantity(product.rentSizeStock || product.sizeStock, size)
      const booked = history.filter(item => {
        if (item.productSlug !== product.slug || item.size !== size) return false

        if (item.status === 'booked' || item.status === 'ongoing') return occupies(item, rangeStart, rangeEnd)

        const care = dressCareBlock(item)

        return Boolean(care && care.span.startDate <= rangeEnd && rangeStart <= care.span.endDate)
      }).length
      const closed = isSizeOutOfStock(product.rentOutOfStock, size)
      const available = closed ? 0 : Math.max(0, total - booked)

      if (input.availableOnly && available <= 0) continue

      rows.push({
        id: `${product._id.toHexString()}-${size}`,
        productId: product._id.toHexString(),
        productNo: Number(product.productNo) || 0,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl || '',
        category: style || 'Outfit',
        size,
        total,
        booked,
        available,
        status: closed ? 'out' : available > 0 ? 'available' : 'booked'
      })
    }
  }

  return {
    start: rangeStart,
    end: rangeEnd,
    categories,
    sizes: [...PRODUCT_SIZES],
    rows,
    history,
    summary: {
      total: rows.length,
      available: rows.filter(row => row.available > 0).length,
      booked: rows.filter(row => row.available <= 0).length
    }
  }
}
