import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { saleSizeSold } from '@/libs/orders'
import { cleanRentPayments, rentPaymentMethodLabel, scaleRentPayments, type RentPaymentLine, type RentPaymentOption } from '@/libs/rent-payment'
import { settleCancel } from '@/libs/return-fee'
import { isSizeOutOfStock, stockCount, stockSizeKey } from '@/libs/rent-sizes'

export type ShopSale = {
  id: string
  productId: string
  productSlug: string
  productName: string
  productImage: string
  size: string
  quantity: number
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  productPrice: number
  finalPrice: number
  discountAmount: number
  gstEnabled: boolean
  gstRate: number
  gstAmount: number
  paymentOption: RentPaymentOption
  paymentMethod: string
  paymentNote: string
  payments: RentPaymentLine[]
  paidAmount: number
  balanceAmount: number
  orderKey: string
  status: 'sold' | 'cancelled'
  returnFee: number
  refundAmount: number
  cancelledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type SaleDoc = Omit<ShopSale, 'id'> & { _id: ObjectId }

const money = (value: unknown) => {
  const next = Math.round(Number(value))

  if (!Number.isFinite(next) || next < 0) return 0

  return Math.min(999999, next)
}

const paymentOptionOf = (value: unknown): RentPaymentOption =>
  value === 'half' || value === 'full' || value === 'custom' || value === 'unpaid' ? value : 'unpaid'

const mapSale = (doc: SaleDoc): ShopSale => ({
  id: doc._id.toHexString(),
  productId: doc.productId,
  productSlug: doc.productSlug,
  productName: doc.productName,
  productImage: doc.productImage || '',
  size: doc.size,
  quantity: Math.max(1, money(doc.quantity) || 1),
  customerName: doc.customerName,
  customerPhone: doc.customerPhone,
  customerEmail: doc.customerEmail || '',
  notes: doc.notes || '',
  productPrice: money(doc.productPrice),
  finalPrice: money(doc.finalPrice),
  discountAmount: money(doc.discountAmount),
  gstEnabled: Boolean(doc.gstEnabled),
  gstRate: Math.min(100, money(doc.gstRate)),
  gstAmount: money(doc.gstAmount),
  paymentOption: paymentOptionOf(doc.paymentOption),
  paymentMethod: doc.paymentMethod || '',
  paymentNote: doc.paymentNote || '',
  payments: cleanRentPayments(doc.payments),
  paidAmount: money(doc.paidAmount),
  balanceAmount: money(doc.balanceAmount),
  orderKey: doc.orderKey || '',
  status: doc.status === 'cancelled' ? 'cancelled' : 'sold',
  returnFee: money(doc.returnFee),
  refundAmount: money(doc.refundAmount),
  cancelledAt: doc.cancelledAt || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

export type ShopSaleInput = {
  productSlug?: string
  size?: string
  quantity?: number | string
  customerName?: string
  customerPhone?: string
  customerEmail?: string
  notes?: string
  productPrice?: number | string
  finalPrice?: number | string
  discountAmount?: number | string
  gstEnabled?: boolean
  gstRate?: number | string
  gstAmount?: number | string
  paymentOption?: string
  paymentMethod?: string
  paymentNote?: string
  payments?: RentPaymentLine[]
  paidAmount?: number | string
  balanceAmount?: number | string
  orderKey?: string
}

export const listShopSales = async () => {
  const db = await getDb()
  const rows = await db.collection<SaleDoc>('ShopSale').find({}).sort({ createdAt: -1 }).toArray()

  return rows.map(mapSale)
}

export const createShopSale = async (input: ShopSaleInput) => {
  const productSlug = String(input.productSlug || '').trim()
  const size = stockSizeKey(String(input.size || '').trim())
  const quantity = Math.max(1, Math.min(20, money(input.quantity) || 1))
  const customerName = String(input.customerName || '').trim()
  const customerPhone = String(input.customerPhone || '').trim()

  if (!productSlug) throw new Error('Select an outfit')
  if (!size) throw new Error('Select a size')
  if (!customerName) throw new Error('Customer name is required')
  if (customerPhone.replace(/\D/g, '').length < 6) throw new Error('Customer phone is required')

  const db = await getDb()
  const product = await db.collection<{
    _id: ObjectId
    slug: string
    name?: string
    imageUrl?: string
    listingType?: string
    sellingPrice?: number
    saleSizeStock?: Record<string, number>
    saleOutOfStock?: string[]
  }>('Product').findOne({ slug: productSlug })

  if (!product) throw new Error('Product not found')
  if (product.listingType === 'rent') throw new Error('This outfit is for rent only')
  if (isSizeOutOfStock(product.saleOutOfStock, size)) throw new Error(`${size} is out of stock`)

  const cap = stockCount(product.saleSizeStock, size)

  if (cap !== null) {
    const sold = (await saleSizeSold(product.slug))[size] || 0
    const left = Math.max(0, cap - sold)

    if (quantity > left) throw new Error(left ? `Only ${left} left in size ${size}` : `${size} is sold out`)
  }

  const productPrice = input.productPrice === undefined || input.productPrice === '' ? money(product.sellingPrice) : money(input.productPrice)
  const finalPrice = input.finalPrice === undefined || input.finalPrice === '' ? productPrice : money(input.finalPrice)
  const discountAmount = Math.min(finalPrice, money(input.discountAmount))
  const taxable = Math.max(0, finalPrice - discountAmount)
  const gstRate = Math.min(100, money(input.gstRate))
  const gstEnabled = Boolean(input.gstEnabled) && gstRate > 0
  const gstAmount = gstEnabled ? money(input.gstAmount ?? Math.round((taxable * gstRate) / 100)) : 0
  const payable = taxable + gstAmount
  let payments = scaleRentPayments(cleanRentPayments(input.payments), payable)
  let paidAmount = payments.reduce((sum, row) => sum + row.amount, 0)

  if (!payments.length) paidAmount = Math.min(payable, money(input.paidAmount))
  if (paidAmount > payable) {
    paidAmount = payable
    payments = scaleRentPayments(payments, payable)
  }

  const balanceAmount = Math.max(0, payable - paidAmount)
  const now = new Date()
  const doc = {
    productId: product._id.toHexString(),
    productSlug,
    productName: product.name || productSlug,
    productImage: product.imageUrl || '',
    size,
    quantity,
    customerName,
    customerPhone,
    customerEmail: String(input.customerEmail || '').trim(),
    notes: String(input.notes || '').trim().slice(0, 500),
    productPrice,
    finalPrice,
    discountAmount,
    gstEnabled,
    gstRate,
    gstAmount,
    paymentOption: paymentOptionOf(input.paymentOption),
    paymentMethod: rentPaymentMethodLabel(payments, String(input.paymentMethod || 'Cash')),
    paymentNote: String(input.paymentNote || '').trim().slice(0, 240),
    payments,
    paidAmount,
    balanceAmount,
    orderKey: String(input.orderKey || '').trim().slice(0, 40),
    status: 'sold' as const,
    returnFee: 0,
    refundAmount: 0,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now
  }

  if (cap !== null) {
    const saleSizeStock = { ...(product.saleSizeStock || {}), [size]: Math.max(0, cap - quantity) }

    await db.collection('Product').updateOne({ _id: product._id }, { $set: { saleSizeStock, updatedAt: now } })
  }

  const result = await db.collection('ShopSale').insertOne(doc)

  return { id: result.insertedId.toHexString(), ...doc }
}

export const createShopSales = async (inputs: ShopSaleInput[]) => {
  if (!inputs.length) throw new Error('Select an outfit')

  const db = await getDb()
  const slugs = [...new Set(inputs.map(item => String(item.productSlug || '').trim()).filter(Boolean))]
  const products = await db
    .collection<{ slug: string; name?: string; listingType?: string; saleSizeStock?: Record<string, number>; saleOutOfStock?: string[] }>('Product')
    .find({ slug: { $in: slugs } })
    .project({ slug: 1, name: 1, listingType: 1, saleSizeStock: 1, saleOutOfStock: 1 })
    .toArray()
  const bySlug = new Map(products.map(product => [product.slug, product]))
  const demand = new Map<string, { slug: string; size: string; qty: number; name: string }>()

  for (const [index, input] of inputs.entries()) {
    const slug = String(input.productSlug || '').trim()
    const size = stockSizeKey(String(input.size || '').trim())
    const qty = Math.max(1, Math.min(20, money(input.quantity) || 1))
    const label = inputs.length > 1 ? `Outfit ${index + 1}` : 'This outfit'
    const product = bySlug.get(slug)

    if (!product) throw new Error(`${label}: select an outfit`)
    if (product.listingType === 'rent') throw new Error(`${label} is for rent only`)
    if (!size) throw new Error(`${label}: select a size`)
    if (isSizeOutOfStock(product.saleOutOfStock, size)) throw new Error(`${label}: ${size} is out of stock`)

    const key = `${slug}|${size}`
    const current = demand.get(key)

    demand.set(key, { slug, size, qty: (current?.qty || 0) + qty, name: product.name || label })
  }

  for (const row of demand.values()) {
    const product = bySlug.get(row.slug)
    const cap = stockCount(product?.saleSizeStock, row.size)

    if (cap === null) continue

    const sold = (await saleSizeSold(row.slug))[row.size] || 0
    const left = Math.max(0, cap - sold)

    if (row.qty > left) throw new Error(left ? `Only ${left} left in size ${row.size} for ${row.name}` : `${row.name} is sold out in size ${row.size}`)
  }

  const orderKey = String(inputs[0]?.orderKey || '').trim() || (inputs.length > 1 ? `ord-${Date.now().toString(36)}` : '')
  const saved: Awaited<ReturnType<typeof createShopSale>>[] = []

  try {
    for (const input of inputs) saved.push(await createShopSale({ ...input, orderKey }))
  } catch (error) {
    for (const row of saved) await deleteShopSale(row.id).catch(() => undefined)

    throw error
  }

  return saved
}

const loadSaleProduct = async (slug: string) => {
  const db = await getDb()
  const product = await db.collection<{
    _id: ObjectId
    slug: string
    name?: string
    imageUrl?: string
    listingType?: string
    sellingPrice?: number
    saleSizeStock?: Record<string, number>
    saleOutOfStock?: string[]
  }>('Product').findOne({ slug })

  if (!product) throw new Error('Product not found')
  if (product.listingType === 'rent') throw new Error('This outfit is for rent only')

  return product
}

const salePiecesLeft = async (product: { slug: string; saleSizeStock?: Record<string, number>; saleOutOfStock?: string[] }, size: string) => {
  if (isSizeOutOfStock(product.saleOutOfStock, size)) throw new Error(`${size} is out of stock`)

  const cap = stockCount(product.saleSizeStock, size)

  if (cap === null) return null

  const webSold = (await saleSizeSold(product.slug))[size] || 0

  return Math.max(0, cap - webSold)
}

const writeSaleStock = async (product: { _id: ObjectId; saleSizeStock?: Record<string, number> }, size: string, delta: number) => {
  if (!delta || stockCount(product.saleSizeStock, size) === null) return

  const current = stockCount(product.saleSizeStock, size) || 0
  const saleSizeStock = { ...(product.saleSizeStock || {}), [size]: Math.min(99, Math.max(0, current + delta)) }

  product.saleSizeStock = saleSizeStock
  await (await getDb()).collection('Product').updateOne({ _id: product._id }, { $set: { saleSizeStock, updatedAt: new Date() } })
}

export const updateShopSale = async (id: string, input: ShopSaleInput) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid sale')

  const db = await getDb()
  const sale = await db.collection<SaleDoc>('ShopSale').findOne({ _id: new ObjectId(id) })

  if (!sale) throw new Error('Sale not found')
  if (sale.status === 'cancelled') throw new Error('This outfit is already cancelled')

  const productSlug = String(input.productSlug || sale.productSlug).trim()
  const size = stockSizeKey(String(input.size || sale.size).trim())
  const quantity = Math.max(1, Math.min(20, money(input.quantity) || sale.quantity || 1))

  if (!productSlug) throw new Error('Select an outfit')
  if (!size) throw new Error('Select a size')

  const samePiece = productSlug === sale.productSlug && size === sale.size
  const oldQty = Math.max(1, money(sale.quantity) || 1)
  const nextProduct = await loadSaleProduct(productSlug)
  const previous = productSlug === sale.productSlug ? nextProduct : await loadSaleProduct(sale.productSlug)

  if (samePiece) {
    const extra = quantity - oldQty

    if (extra > 0) {
      const left = await salePiecesLeft(nextProduct, size)

      if (left !== null && extra > left) throw new Error(left ? `Only ${left} left in size ${size}` : `${size} is sold out`)
    }
  } else {
    const left = await salePiecesLeft(nextProduct, size)

    if (left !== null && quantity > left) throw new Error(left ? `Only ${left} left in size ${size}` : `${size} is sold out`)
  }

  if (samePiece) await writeSaleStock(nextProduct, size, oldQty - quantity)
  else {
    await writeSaleStock(previous, sale.size, oldQty)
    await writeSaleStock(nextProduct, size, -quantity)
  }

  const productPrice = input.productPrice === undefined || input.productPrice === '' ? money(sale.productPrice) : money(input.productPrice)
  const finalPrice = input.finalPrice === undefined || input.finalPrice === '' ? money(sale.finalPrice) : money(input.finalPrice)
  const discountAmount = Math.min(finalPrice, input.discountAmount === undefined ? money(sale.discountAmount) : money(input.discountAmount))
  const taxable = Math.max(0, finalPrice - discountAmount)
  const gstRate = Math.min(100, input.gstRate === undefined ? money(sale.gstRate) : money(input.gstRate))
  const gstEnabled = input.gstEnabled === undefined ? Boolean(sale.gstEnabled) && gstRate > 0 : Boolean(input.gstEnabled) && gstRate > 0
  const gstAmount = gstEnabled ? money(input.gstAmount ?? sale.gstAmount ?? Math.round((taxable * gstRate) / 100)) : 0
  const payable = taxable + gstAmount
  const paidAmount = input.paidAmount === undefined ? money(sale.paidAmount) : money(input.paidAmount)
  const sentPayments = Array.isArray(input.payments)
  const payments = paidAmount > 0 ? scaleRentPayments(sentPayments ? cleanRentPayments(input.payments) : [{ method: sale.paymentMethod || 'Cash', amount: paidAmount }], paidAmount) : []
  const now = new Date()

  await db.collection('ShopSale').updateOne(
    { _id: sale._id },
    {
      $set: {
        productId: nextProduct._id.toHexString(),
        productSlug,
        productName: nextProduct.name || productSlug,
        productImage: nextProduct.imageUrl || '',
        size,
        quantity,
        productPrice,
        finalPrice,
        discountAmount,
        gstEnabled,
        gstRate,
        gstAmount,
        paymentOption: input.paymentOption ? paymentOptionOf(input.paymentOption) : paidAmount <= 0 ? 'unpaid' : paidAmount >= payable ? 'full' : 'custom',
        paymentMethod: rentPaymentMethodLabel(payments, String(input.paymentMethod || sale.paymentMethod || 'Cash')),
        paymentNote: input.paymentNote === undefined ? sale.paymentNote || '' : String(input.paymentNote || '').trim().slice(0, 240),
        payments,
        paidAmount,
        balanceAmount: Math.max(0, payable - paidAmount),
        ...(String(input.orderKey || '').trim() ? { orderKey: String(input.orderKey).trim().slice(0, 40) } : {}),
        updatedAt: now
      }
    }
  )

  const saved = await db.collection<SaleDoc>('ShopSale').findOne({ _id: sale._id })

  return saved ? mapSale(saved) : null
}

const restoreSaleStock = async (sale: SaleDoc) => {
  if (sale.status === 'cancelled') return

  const db = await getDb()
  const product = await db.collection<{ _id: ObjectId; saleSizeStock?: Record<string, number> }>('Product').findOne({ slug: sale.productSlug })

  if (!product || stockCount(product.saleSizeStock, sale.size) === null) return

  const current = stockCount(product.saleSizeStock, sale.size) || 0
  const saleSizeStock = { ...(product.saleSizeStock || {}), [sale.size]: Math.min(99, current + Math.max(1, money(sale.quantity) || 1)) }

  await db.collection('Product').updateOne({ _id: product._id }, { $set: { saleSizeStock, updatedAt: new Date() } })
}

export const cancelShopSale = async (id: string, returnFee?: unknown, refundAmount?: unknown) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid sale')

  const db = await getDb()
  const sale = await db.collection<SaleDoc>('ShopSale').findOne({ _id: new ObjectId(id) })

  if (!sale) throw new Error('Sale not found')
  if (sale.status === 'cancelled') throw new Error('This outfit is already cancelled')

  const quote = settleCancel(sale.paidAmount, returnFee, refundAmount)
  const now = new Date()

  await restoreSaleStock(sale)
  await db.collection('ShopSale').updateOne(
    { _id: sale._id },
    { $set: { status: 'cancelled', returnFee: quote.returnFee, refundAmount: quote.refundAmount, cancelledAt: now, updatedAt: now } }
  )

  return mapSale({ ...sale, status: 'cancelled', returnFee: quote.returnFee, refundAmount: quote.refundAmount, cancelledAt: now, updatedAt: now })
}

export const deleteShopSale = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid sale')

  const db = await getDb()
  const sale = await db.collection<SaleDoc>('ShopSale').findOne({ _id: new ObjectId(id) })

  if (!sale) throw new Error('Sale not found')

  await restoreSaleStock(sale)
  await db.collection('ShopSale').deleteOne({ _id: sale._id })
}
