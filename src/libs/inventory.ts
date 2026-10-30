import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { cleanRentPayments } from '@/libs/rent-payment'
import { PRODUCT_SIZES, isSizeOutOfStock, productSizes, sizeQuantity, stockCount, stockSizeKey } from '@/libs/rent-sizes'

export type InventoryChannel = 'sale' | 'rent'

export type InventorySize = {
  size: string
  quantity: number | null
  used: number
  reserved: number
  left: number | null
  /** Pieces whose return date passed and the booking is still open. */
  overdue: number
  /** Admin switched this size off. Empty quantity alone does not set this. */
  closed: boolean
  low: boolean
}

export type InventoryProduct = {
  id: string
  name: string
  slug: string
  imageUrl: string
  listingType: string
  status: string
  price: number
  mrp: number
  sizes: InventorySize[]
}

export type InventorySummary = {
  products: number
  pieces: number
  used: number
  reserved: number
  left: number
  low: number
  unlimited: number
}

export type InventoryHold = {
  id: string
  productName: string
  productSlug: string
  imageUrl: string
  size: string
  startDate: string
  endDate: string
  status: string
  customerName: string
  kind: 'today' | 'overdue'
  finalPrice?: number
  discountAmount?: number
  gstAmount?: number
  paidAmount?: number
  paymentMethod?: string
  payments?: { method: string; amount: number }[]
}

export type InventorySaleRow = {
  id: string
  source: 'shop' | 'website'
  productName: string
  productSlug: string
  imageUrl: string
  size: string
  quantity: number
  amount: number
  customerName: string
  createdAt: string
}

export type InventoryList = {
  channel: InventoryChannel
  summary: InventorySummary
  products: InventoryProduct[]
  holds: InventoryHold[]
  sales: InventorySaleRow[]
}

export type InventoryAlert = {
  productId: string
  name: string
  slug: string
  size: string
  quantity: number | null
  used: number
  left: number | null
  closed: boolean
}

export type InventoryDashboard = {
  sale: InventorySummary
  rent: InventorySummary
  saleAlerts: InventoryAlert[]
  rentAlerts: InventoryAlert[]
}

type ProductRow = {
  _id: ObjectId
  name: string
  slug: string
  imageUrl?: string
  listingType?: string
  status?: string
  sizes?: string[]
  rentSizeStock?: Record<string, number>
  saleSizeStock?: Record<string, number>
  saleOutOfStock?: string[]
  rentOutOfStock?: string[]
  sizeStock?: Record<string, number>
  sellingPrice?: number
  sellingMrp?: number
  rentPrice?: number
  rentMrp?: number
}

const SALE_STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']
const RENT_STATUSES = ['booked', 'ongoing']

const todayIso = () => {
  const today = new Date()

  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const sizeList = (sizes?: string[]) => productSizes(sizes).filter(size => (PRODUCT_SIZES as readonly string[]).includes(size))

const summaryOf = (products: InventoryProduct[]): InventorySummary => {
  const summary: InventorySummary = { products: products.length, pieces: 0, used: 0, reserved: 0, left: 0, low: 0, unlimited: 0 }

  for (const product of products) {
    for (const size of product.sizes) {
      summary.reserved += size.reserved

      if (size.quantity === null) {
        summary.unlimited += 1
        summary.used += size.used
        if (size.closed) summary.low += 1
        continue
      }

      summary.used += size.used + size.overdue

      summary.pieces += size.quantity
      summary.left += size.left || 0
      if (size.low) summary.low += 1
    }
  }

  return summary
}

const alertsOf = (products: InventoryProduct[]): InventoryAlert[] =>
  products
    .flatMap(product =>
      product.sizes
        .filter(size => size.low)
        .map(size => ({
          productId: product.id,
          name: product.name,
          slug: product.slug,
          size: size.size,
          quantity: size.quantity,
          used: size.used,
          left: size.left,
          closed: size.closed
        }))
    )
    .sort((a, b) => (a.left ?? 0) - (b.left ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 8)

export const listInventory = async (channel: InventoryChannel): Promise<InventoryList> => {
  const db = await getDb()
  const listing = channel === 'sale' ? ['sale', 'both'] : ['rent', 'both']
  const products = await db
    .collection<ProductRow>('Product')
    .find({ listingType: { $in: listing } })
    .sort({ name: 1 })
    .toArray()
  const today = todayIso()
  const used = new Map<string, number>()
  const overdue = new Map<string, number>()
  const reserved = new Map<string, number>()
  const holds: InventoryHold[] = []

  const sales: InventorySaleRow[] = []
  const webUsed = new Map<string, number>()

  if (channel === 'sale') {
    const rows = await db
      .collection('WebOrder')
      .aggregate<{ _id: { slug: string; size: string }; qty: number }>([
        { $match: { status: { $in: SALE_STATUSES } } },
        { $unwind: '$items' },
        { $group: { _id: { slug: '$items.slug', size: '$items.size' }, qty: { $sum: '$items.qty' } } }
      ])
      .toArray()

    for (const row of rows) {
      const key = `${row._id.slug}|${stockSizeKey(String(row._id.size || ''))}`

      webUsed.set(key, (webUsed.get(key) || 0) + (Number(row.qty) || 0))
    }

    const shopRows = await db
      .collection<{
        _id: ObjectId
        productSlug: string
        productName?: string
        productImage?: string
        size: string
        quantity?: number
        finalPrice?: number
        discountAmount?: number
        gstAmount?: number
        customerName?: string
        createdAt?: Date
      }>('ShopSale')
      .find({ status: { $ne: 'cancelled' } })
      .project({ productSlug: 1, productName: 1, productImage: 1, size: 1, quantity: 1, finalPrice: 1, discountAmount: 1, gstAmount: 1, customerName: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .toArray()

    for (const row of shopRows) {
      const size = stockSizeKey(String(row.size || ''))
      const qty = Math.max(1, Math.round(Number(row.quantity) || 1))
      const key = `${row.productSlug}|${size}`
      const finalPrice = Math.max(0, Math.round(Number(row.finalPrice) || 0))
      const discount = Math.min(finalPrice, Math.max(0, Math.round(Number(row.discountAmount) || 0)))
      const gst = Math.max(0, Math.round(Number(row.gstAmount) || 0))

      used.set(key, (used.get(key) || 0) + qty)
      sales.push({
        id: `shop-${row._id.toHexString()}`,
        source: 'shop',
        productName: row.productName || row.productSlug,
        productSlug: row.productSlug,
        imageUrl: row.productImage || '',
        size,
        quantity: qty,
        amount: Math.max(0, finalPrice - discount + gst),
        customerName: row.customerName || '',
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : ''
      })
    }

    const webRows = await db
      .collection('WebOrder')
      .aggregate<{
        _id: ObjectId
        line: number
        createdAt?: Date
        customerName?: string
        slug?: string
        title?: string
        image?: string
        size?: string
        qty?: number
        lineTotal?: number
      }>([
        { $match: { status: { $in: SALE_STATUSES } } },
        { $unwind: { path: '$items', includeArrayIndex: 'line' } },
        {
          $project: {
            createdAt: 1,
            line: 1,
            customerName: '$customer.name',
            slug: '$items.slug',
            title: '$items.title',
            image: '$items.image',
            size: '$items.size',
            qty: '$items.qty',
            lineTotal: '$items.lineTotal'
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 200 }
      ])
      .toArray()

    for (const row of webRows) {
      const slug = String(row.slug || '')
      const size = stockSizeKey(String(row.size || ''))

      if (!slug) continue

      sales.push({
        id: `web-${row._id.toHexString()}-${row.line}`,
        source: 'website',
        productName: String(row.title || slug),
        productSlug: slug,
        imageUrl: String(row.image || ''),
        size,
        quantity: Math.max(1, Math.round(Number(row.qty) || 1)),
        amount: Math.max(0, Math.round(Number(row.lineTotal) || 0)),
        customerName: String(row.customerName || ''),
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : ''
      })
    }

    sales.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  } else {
    const rows = await db
      .collection<{
        _id: ObjectId
        productSlug: string
        productName?: string
        productImage?: string
        size: string
        startDate: string
        endDate: string
        status?: string
        customerName?: string
        finalPrice?: number
        discountAmount?: number
        gstAmount?: number
        paidAmount?: number
        paymentMethod?: string
        payments?: { method?: string; amount?: number }[]
      }>('RentBooking')
      .find({ status: { $in: RENT_STATUSES } })
      .project({
        productSlug: 1,
        productName: 1,
        productImage: 1,
        size: 1,
        startDate: 1,
        endDate: 1,
        status: 1,
        customerName: 1,
        finalPrice: 1,
        discountAmount: 1,
        gstAmount: 1,
        paidAmount: 1,
        paymentMethod: 1,
        payments: 1
      })
      .toArray()

    for (const row of rows) {
      const size = stockSizeKey(row.size)
      const key = `${row.productSlug}|${size}`

      if (row.startDate > today) {
        reserved.set(key, (reserved.get(key) || 0) + 1)
        continue
      }

      const kind = today <= row.endDate ? 'today' : 'overdue'

      if (kind === 'today') used.set(key, (used.get(key) || 0) + 1)
      else overdue.set(key, (overdue.get(key) || 0) + 1)

      holds.push({
        id: row._id.toHexString(),
        productName: row.productName || row.productSlug,
        productSlug: row.productSlug,
        imageUrl: row.productImage || '',
        size,
        startDate: row.startDate,
        endDate: row.endDate,
        status: row.status || 'booked',
        customerName: row.customerName || '',
        finalPrice: Math.max(0, Math.round(Number(row.finalPrice) || 0)),
        discountAmount: Math.max(0, Math.round(Number(row.discountAmount) || 0)),
        gstAmount: Math.max(0, Math.round(Number(row.gstAmount) || 0)),
        paidAmount: Math.max(0, Math.round(Number(row.paidAmount) || 0)),
        paymentMethod: row.paymentMethod || '',
        payments: cleanRentPayments(row.payments),
        kind
      })
    }
  }

  const mapped = products.map(product => {
    const sizes = sizeList(product.sizes).map(size => {
      const key = `${product.slug}|${size}`
      const out = used.get(key) || 0
      const late = overdue.get(key) || 0
      const ahead = reserved.get(key) || 0

      if (channel === 'sale') {
        const shopSold = out
        const webSold = webUsed.get(key) || 0
        const quantity = stockCount(product.saleSizeStock, size)
        const left = quantity === null ? null : Math.max(0, quantity - webSold)
        const closed = isSizeOutOfStock(product.saleOutOfStock, size)

        return {
          size,
          quantity,
          used: shopSold + webSold,
          reserved: 0,
          left,
          overdue: 0,
          closed,
          low: closed || (quantity !== null && left === 0)
        }
      }

      const quantity = sizeQuantity(product.rentSizeStock || product.sizeStock, size)
      const left = Math.max(0, quantity - out - late)
      const closed = isSizeOutOfStock(product.rentOutOfStock, size)

      return {
        size,
        quantity,
        used: out,
        reserved: ahead,
        left,
        overdue: late,
        closed,
        low: closed || left === 0
      }
    })

    return {
      id: product._id.toHexString(),
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl || '',
      listingType: product.listingType || 'both',
      status: product.status || 'active',
      price: Math.max(0, Math.round(Number(channel === 'sale' ? product.sellingPrice : product.rentPrice) || 0)),
      mrp: Math.max(0, Math.round(Number(channel === 'sale' ? product.sellingMrp : product.rentMrp) || 0)),
      sizes
    }
  })

  holds.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.productName.localeCompare(b.productName))
  mapped.sort((a, b) => {
    const outOf = (product: InventoryProduct) => product.sizes.reduce((sum, size) => sum + size.used + size.overdue, 0)

    return outOf(b) - outOf(a) || a.name.localeCompare(b.name)
  })

  return { channel, summary: summaryOf(mapped), products: mapped, holds, sales }
}

export const inventoryDashboard = async (): Promise<InventoryDashboard> => {
  const [sale, rent] = await Promise.all([listInventory('sale'), listInventory('rent')])

  return {
    sale: sale.summary,
    rent: rent.summary,
    saleAlerts: alertsOf(sale.products),
    rentAlerts: alertsOf(rent.products)
  }
}

export const updateInventoryQuantity = async (
  channel: InventoryChannel,
  productId: string,
  size: string,
  quantity: number | null
) => {
  if (!ObjectId.isValid(productId)) throw new Error('Invalid product')
  if (!(PRODUCT_SIZES as readonly string[]).includes(size)) throw new Error('Invalid size')

  const db = await getDb()
  const product = await db.collection<ProductRow>('Product').findOne({ _id: new ObjectId(productId) })

  if (!product) throw new Error('Product not found')

  const listing = product.listingType || 'both'

  if (channel === 'sale' && listing === 'rent') throw new Error('This outfit is for rent only')
  if (channel === 'rent' && listing === 'sale') throw new Error('This outfit is for selling only')

  if (channel === 'rent') {
    const next = Math.floor(Number(quantity))

    if (!Number.isFinite(next) || next < 1 || next > 99) throw new Error('Rent quantity must be from 1 to 99')

    const rentSizeStock = { ...(product.rentSizeStock || product.sizeStock || {}), [size]: next }

    await db.collection('Product').updateOne({ _id: product._id }, { $set: { rentSizeStock, updatedAt: new Date() } })
  } else {
    const saleSizeStock = { ...(product.saleSizeStock || {}) }

    if (quantity === null) {
      delete saleSizeStock[size]
    } else {
      const next = Math.floor(Number(quantity))

      if (!Number.isFinite(next) || next < 0 || next > 99) throw new Error('Selling quantity must be from 0 to 99')

      saleSizeStock[size] = next
    }

    await db.collection('Product').updateOne({ _id: product._id }, { $set: { saleSizeStock, updatedAt: new Date() } })
  }

  const list = await listInventory(channel)

  return list.products.find(item => item.id === productId) || null
}

const closedSizes = (flags: unknown) =>
  [...new Set((Array.isArray(flags) ? flags : []).map(item => String(item || '').trim()).filter(item => (PRODUCT_SIZES as readonly string[]).includes(item)))]

const inventoryPrice = (input: { price: unknown; mrp: unknown } | undefined, kind: 'Selling' | 'Rent') => {
  if (!input) return null

  const price = Math.round(Number(input.price))
  const mrp = input.mrp === '' || input.mrp === null || input.mrp === undefined ? 0 : Math.round(Number(input.mrp))

  if (!Number.isFinite(price) || price <= 0 || price > 999999) throw new Error(`${kind} price must be greater than 0`)
  if (!Number.isFinite(mrp) || mrp < 0 || mrp > 999999) throw new Error(`${kind} MRP is not valid`)
  if (mrp && mrp < price) throw new Error(`${kind} MRP must be greater than or equal to the ${kind.toLowerCase()} price`)

  return { price, mrp }
}

export const updateRentInventorySizes = async (
  productId: string,
  quantities: Record<string, number>,
  outOfStock?: string[],
  priceInput?: { price: unknown; mrp: unknown }
) => {
  if (!ObjectId.isValid(productId)) throw new Error('Invalid product')

  const entries = Object.entries(quantities || {})

  if (!entries.length) throw new Error('Add a size quantity')

  const rentPatch: Record<string, number> = {}

  for (const [size, quantity] of entries) {
    if (!(PRODUCT_SIZES as readonly string[]).includes(size)) throw new Error('Invalid size')

    const next = Math.floor(Number(quantity))

    if (!Number.isFinite(next) || next < 1 || next > 99) throw new Error(`Rent quantity for ${size} must be from 1 to 99`)

    rentPatch[size] = next
  }

  const db = await getDb()
  const product = await db.collection<ProductRow>('Product').findOne({ _id: new ObjectId(productId) })

  if (!product) throw new Error('Product not found')
  if ((product.listingType || 'both') === 'sale') throw new Error('This outfit is for selling only')

  const rentSizeStock = { ...(product.rentSizeStock || product.sizeStock || {}), ...rentPatch }
  const priced = inventoryPrice(priceInput, 'Rent')
  const $set: Record<string, unknown> = { rentSizeStock, updatedAt: new Date() }

  if (outOfStock) $set.rentOutOfStock = closedSizes(outOfStock)
  if (priced) {
    $set.rentPrice = priced.price
    $set.rentMrp = priced.mrp
  }

  await db.collection('Product').updateOne({ _id: product._id }, { $set })

  const list = await listInventory('rent')

  return list.products.find(item => item.id === productId) || null
}

export const updateSaleInventorySizes = async (
  productId: string,
  quantities: Record<string, number | null>,
  outOfStock?: string[],
  priceInput?: { price: unknown; mrp: unknown }
) => {
  if (!ObjectId.isValid(productId)) throw new Error('Invalid product')

  const entries = Object.entries(quantities || {})

  if (!entries.length) throw new Error('Add a size quantity')

  const db = await getDb()
  const product = await db.collection<ProductRow>('Product').findOne({ _id: new ObjectId(productId) })

  if (!product) throw new Error('Product not found')
  if ((product.listingType || 'both') === 'rent') throw new Error('This outfit is for rent only')

  const saleSizeStock = { ...(product.saleSizeStock || {}) }

  for (const [size, quantity] of entries) {
    if (!(PRODUCT_SIZES as readonly string[]).includes(size)) throw new Error('Invalid size')

    if (quantity === null) {
      delete saleSizeStock[size]
      continue
    }

    const next = Math.floor(Number(quantity))

    if (!Number.isFinite(next) || next < 0 || next > 99) throw new Error(`Selling quantity for ${size} must be from 0 to 99`)

    saleSizeStock[size] = next
  }

  const priced = inventoryPrice(priceInput, 'Selling')
  const $set: Record<string, unknown> = { saleSizeStock, updatedAt: new Date() }

  if (outOfStock) $set.saleOutOfStock = closedSizes(outOfStock)
  if (priced) {
    $set.sellingPrice = priced.price
    $set.sellingMrp = priced.mrp
  }

  await db.collection('Product').updateOne({ _id: product._id }, { $set })

  const list = await listInventory('sale')

  return list.products.find(item => item.id === productId) || null
}
