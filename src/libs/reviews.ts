import { ObjectId } from 'mongodb'

import { isStoredReviewImage } from '@/libs/media'
import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type ReviewStatus = 'pending' | 'approved' | 'hidden'

export type ProductReviewDoc = {
  _id: ObjectId
  productSlug: string
  productTitle: string
  productImage: string
  userId: string
  userEmail: string
  userName: string
  rating: number
  title: string
  body: string
  images?: string[]
  orderId?: string
  orderNo?: string
  verifiedPurchase?: boolean
  status: ReviewStatus
  createdAt: Date
  updatedAt: Date
}

const mapReview = (doc: ProductReviewDoc) => ({
  id: doc._id.toHexString(),
  productSlug: doc.productSlug,
  productTitle: doc.productTitle,
  productImage: doc.productImage,
  userId: doc.userId,
  userEmail: doc.userEmail,
  userName: doc.userName,
  rating: doc.rating,
  title: doc.title,
  body: doc.body,
  images: Array.isArray(doc.images) ? doc.images.filter(Boolean) : [],
  orderId: doc.orderId || '',
  orderNo: doc.orderNo || '',
  verifiedPurchase: Boolean(doc.verifiedPurchase),
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const clampRating = (value: unknown) => Math.min(5, Math.max(1, Math.round(Number(value) || 0)))

const roundAvg = (value: number) => Math.round(value * 10) / 10

export const syncProductRating = async (productSlug: string) => {
  const db = await getDb()
  const approved = await db
    .collection<ProductReviewDoc>('ProductReview')
    .find({ productSlug, status: 'approved' })
    .toArray()
  const count = approved.length
  const average = count ? roundAvg(approved.reduce((sum, item) => sum + item.rating, 0) / count) : 0

  await db.collection('Product').updateOne(
    { slug: productSlug },
    { $set: { rating: average, reviews: count, updatedAt: new Date() } }
  )

  return { average, count }
}

const histogram = (rows: { rating: number }[]) => {
  const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }

  for (const row of rows) {
    const key = clampRating(row.rating) as 1 | 2 | 3 | 4 | 5

    stars[key] += 1
  }

  return stars
}

export const getProductReviewSummary = async (productSlug: string, userId?: string) => {
  const db = await getDb()
  const approved = await db
    .collection<ProductReviewDoc>('ProductReview')
    .find({ productSlug, status: 'approved' })
    .sort({ createdAt: -1 })
    .toArray()
  const mine = userId
    ? await db.collection<ProductReviewDoc>('ProductReview').findOne({ productSlug, userId })
    : null
  const count = approved.length
  const average = count ? roundAvg(approved.reduce((sum, item) => sum + item.rating, 0) / count) : 0

  return {
    summary: { average, count, stars: histogram(approved) },
    reviews: approved.map(mapReview),
    mine: mine ? mapReview(mine) : null
  }
}

export const upsertReview = async (input: {
  productSlug: string
  userId: string
  userEmail: string
  userName?: string
  rating: number
  title?: string
  body?: string
  images?: string[]
  orderId?: string
}) => {
  const slug = (input.productSlug || '').trim()
  const rating = clampRating(input.rating)
  const body = (input.body || '').trim()
  const title = (input.title || '').trim()
  const userName = (input.userName || input.userEmail.split('@')[0] || 'Customer').trim()
  const images = (input.images || []).filter(isStoredReviewImage).slice(0, 4)
  const orderId = (input.orderId || '').trim()

  if (!slug) throw new Error('Product is required')
  if (!body || body.length < 8) throw new Error('Please write a short review')

  const db = await getDb()
  const product = await db.collection('Product').findOne({ slug, status: 'active' })

  if (!product) throw new Error('Product not found')

  let verifiedPurchase = false
  let orderNo = ''

  if (orderId) {
    if (!ObjectId.isValid(orderId)) throw new Error('Order not found')

    const order = await db.collection('WebOrder').findOne({ _id: new ObjectId(orderId) })

    if (!order) throw new Error('Order not found')

    const owns =
      String(order.userId || '') === input.userId ||
      String(order.userEmail || '').toLowerCase() === input.userEmail.trim().toLowerCase()

    if (!owns) throw new Error('This order does not belong to your account')
    if (order.status !== 'delivered') throw new Error('You can review products after the order is delivered')

    const hasItem = Array.isArray(order.items) && order.items.some((item: { slug?: string }) => item.slug === slug)

    if (!hasItem) throw new Error('This product is not in that order')

    verifiedPurchase = true
    orderNo = String(order.orderNo || '')
  }

  const now = new Date()
  const existing = await db.collection<ProductReviewDoc>('ProductReview').findOne({ productSlug: slug, userId: input.userId })
  const payload: Record<string, unknown> = {
    productSlug: slug,
    productTitle: product.name,
    productImage: product.imageUrl,
    userId: input.userId,
    userEmail: input.userEmail,
    userName,
    rating,
    title,
    body,
    images: input.images ? images : existing?.images || [],
    status: 'approved' as ReviewStatus,
    updatedAt: now
  }

  if (verifiedPurchase) {
    payload.verifiedPurchase = true
    payload.orderId = orderId
    payload.orderNo = orderNo
  } else if (existing?.verifiedPurchase) {
    payload.verifiedPurchase = true
    payload.orderId = existing.orderId
    payload.orderNo = existing.orderNo
  }

  if (existing) {
    await db.collection('ProductReview').updateOne({ _id: existing._id }, { $set: payload })
  } else {
    await db.collection('ProductReview').insertOne({ ...payload, createdAt: now } as ProductReviewDoc)
  }

  await syncProductRating(slug)

  return getProductReviewSummary(slug, input.userId)
}

export const getUserReviewedSlugs = async (userId: string, slugs: string[]) => {
  const unique = [...new Set(slugs.map(item => item.trim()).filter(Boolean))]

  if (!userId || !unique.length) return new Set<string>()

  const db = await getDb()
  const rows = await db
    .collection<ProductReviewDoc>('ProductReview')
    .find({ userId, productSlug: { $in: unique } }, { projection: { productSlug: 1 } })
    .toArray()

  return new Set(rows.map(row => row.productSlug))
}

export const listReviewsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [
      { productTitle: regex },
      { productSlug: regex },
      { userEmail: regex },
      { userName: regex },
      { body: regex }
    ]
  }

  if (query.status === 'pending' || query.status === 'approved' || query.status === 'hidden') {
    filter.status = query.status
  }

  const [rows, total] = await Promise.all([
    db
      .collection<ProductReviewDoc>('ProductReview')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('ProductReview').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapReview), total, query.page, query.limit)
}

export const updateReviewStatus = async (id: string, status: ReviewStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid review')

  const db = await getDb()
  const review = await db.collection<ProductReviewDoc>('ProductReview').findOne({ _id: new ObjectId(id) })

  if (!review) throw new Error('Review not found')

  await db.collection('ProductReview').updateOne({ _id: review._id }, { $set: { status, updatedAt: new Date() } })
  await syncProductRating(review.productSlug)
}

export const deleteReview = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid review')

  const db = await getDb()
  const review = await db.collection<ProductReviewDoc>('ProductReview').findOne({ _id: new ObjectId(id) })

  if (!review) return

  await db.collection('ProductReview').deleteOne({ _id: review._id })
  await syncProductRating(review.productSlug)
}

const dayKey = (date: Date) => date.toISOString().slice(0, 10)

export const getReviewDashboard = async () => {
  const db = await getDb()
  const reviews = await db.collection<ProductReviewDoc>('ProductReview').find({}).toArray()
  const approved = reviews.filter(item => item.status === 'approved')
  const pending = reviews.filter(item => item.status === 'pending').length
  const hidden = reviews.filter(item => item.status === 'hidden').length
  const total = reviews.length
  const average = approved.length ? roundAvg(approved.reduce((sum, item) => sum + item.rating, 0) / approved.length) : 0
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const thisWeek = reviews.filter(item => new Date(item.createdAt).getTime() >= weekAgo).length
  const byProduct = new Map<string, { slug: string; title: string; count: number; sum: number }>()

  for (const item of approved) {
    const current = byProduct.get(item.productSlug) || { slug: item.productSlug, title: item.productTitle, count: 0, sum: 0 }

    current.count += 1
    current.sum += item.rating
    byProduct.set(item.productSlug, current)
  }

  const daily: { date: string; count: number }[] = []

  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date()

    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - i)
    const key = dayKey(date)

    daily.push({
      date: key,
      count: reviews.filter(item => dayKey(new Date(item.createdAt)) === key).length
    })
  }

  return {
    total,
    approved: approved.length,
    pending,
    hidden,
    average,
    thisWeek,
    stars: histogram(approved),
    daily,
    topProducts: [...byProduct.values()]
      .map(item => ({ ...item, average: roundAvg(item.sum / item.count) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
  }
}
