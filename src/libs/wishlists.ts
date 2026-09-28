import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'
import type { StoreProduct } from '@web/data/catalog'

export type WishlistDoc = {
  _id: ObjectId
  userId: string
  email: string
  slug: string
  title: string
  image: string
  price: number
  sellingPrice?: number
  sellingMrp?: number
  createdAt: Date
}

const snapshot = (product: StoreProduct) => ({
  slug: product.slug,
  title: product.title,
  image: product.image,
  price: product.price || product.sellingPrice || 0,
  sellingPrice: product.sellingPrice,
  sellingMrp: product.sellingMrp
})

export const listUserWishlist = async (userId: string) => {
  const db = await getDb()
  const rows = await db.collection<WishlistDoc>('Wishlist').find({ userId }).sort({ createdAt: -1 }).toArray()

  return rows.map(row => ({
    slug: row.slug,
    title: row.title,
    image: row.image,
    price: row.price,
    sellingPrice: row.sellingPrice,
    sellingMrp: row.sellingMrp,
    category: 'lehenga' as const,
    collections: [],
    rating: 5,
    reviews: 0
  }))
}

export const toggleWishlist = async (userId: string, email: string, product: StoreProduct) => {
  const db = await getDb()
  const existing = await db.collection<WishlistDoc>('Wishlist').findOne({ userId, slug: product.slug })

  if (existing) {
    await db.collection('Wishlist').deleteOne({ _id: existing._id })

    return { wished: false }
  }

  await db.collection('Wishlist').insertOne({
    userId,
    email,
    ...snapshot(product),
    createdAt: new Date()
  })

  return { wished: true }
}

export const setWishlistState = async (userId: string, email: string, product: StoreProduct, wished: boolean) => {
  const db = await getDb()
  const existing = await db.collection<WishlistDoc>('Wishlist').findOne({ userId, slug: product.slug })

  if (wished && !existing) {
    await db.collection('Wishlist').insertOne({
      userId,
      email,
      ...snapshot(product),
      createdAt: new Date()
    })
  }

  if (!wished && existing) {
    await db.collection('Wishlist').deleteOne({ _id: existing._id })
  }
}

export const mergeWishlist = async (userId: string, email: string, products: StoreProduct[]) => {
  await Promise.all(products.filter(item => item?.slug).map(item => setWishlistState(userId, email, item, true)))

  return listUserWishlist(userId)
}

export const listWishlistsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const match = regex ? { $or: [{ title: regex }, { slug: regex }, { email: regex }] } : {}

  const [grouped, totalDocs] = await Promise.all([
    db
      .collection<WishlistDoc>('Wishlist')
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$slug',
            count: { $sum: 1 },
            title: { $first: '$title' },
            image: { $first: '$image' },
            emails: { $addToSet: '$email' },
            lastAt: { $max: '$createdAt' }
          }
        },
        { $sort: { count: -1, lastAt: -1 } },
        { $skip: query.skip },
        { $limit: query.limit }
      ])
      .toArray(),
    db
      .collection('Wishlist')
      .aggregate([{ $match: match }, { $group: { _id: '$slug' } }, { $count: 'total' }])
      .toArray()
  ])

  return tableResponse(
    grouped.map(row => ({
      id: String(row._id),
      slug: String(row._id),
      title: row.title,
      image: row.image,
      count: row.count,
      emails: row.emails,
      lastAt: row.lastAt
    })),
    Number(totalDocs[0]?.total || 0),
    query.page,
    query.limit
  )
}

export const countWishlists = async () => {
  const db = await getDb()

  return db.collection('Wishlist').countDocuments()
}
