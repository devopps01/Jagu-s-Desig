import { ObjectId } from 'mongodb'

import { applyGoogleRatingToProduct, applyGoogleRatingToProducts } from '@/libs/google-reviews'
import { getDb } from '@/libs/mongo'
import { slugify } from '@/libs/slug'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'
import { withoutSareeWord } from '@/libs/public-label'
import type { StoreProduct } from '@web/data/catalog'

export type ListingType = 'sale' | 'rent' | 'both'
export type ProductStatus = 'active' | 'inactive'

export type ProductDoc = {
  _id: ObjectId
  name: string
  slug: string
  description: string
  imageUrl: string
  images?: string[]
  imageName: string
  imageAlt: string
  listingType: ListingType
  sellingPrice: number
  rentPrice: number
  sellingMrp: number
  rentMrp: number
  collections: string[]
  fabric: string
  color: string
  craft: string
  occasion: string
  design: string
  style: string
  styles?: string[]
  details?: { label: string; value: string }[]
  seoTitle: string
  seoDescription: string
  status: ProductStatus
  rating: number
  reviews: number
  createdAt: Date
  updatedAt: Date
}

const displayPrice = (doc: Pick<ProductDoc, 'listingType' | 'sellingPrice' | 'rentPrice'>) => {
  if (doc.listingType === 'rent') return doc.rentPrice
  if (doc.listingType === 'sale') return doc.sellingPrice

  return doc.sellingPrice || doc.rentPrice
}

const uniqueImages = (doc: Pick<ProductDoc, 'imageUrl' | 'images'>) =>
  [...new Set([doc.imageUrl, ...(Array.isArray(doc.images) ? doc.images : [])].filter(Boolean))]

export const toStoreProduct = (doc: ProductDoc): StoreProduct => ({
  slug: doc.slug,
  title: withoutSareeWord(doc.name),
  price: displayPrice(doc),
  sellingPrice: doc.sellingPrice,
  rentPrice: doc.rentPrice,
  sellingMrp: doc.sellingMrp || 0,
  rentMrp: doc.rentMrp || 0,
  listingType: doc.listingType,
  description: withoutSareeWord(doc.description),
  seoTitle: withoutSareeWord(doc.seoTitle),
  seoDescription: withoutSareeWord(doc.seoDescription),
  rating: doc.reviews ? doc.rating || 0 : 0,
  reviews: doc.reviews || 0,
  fabric: doc.fabric,
  occasion: withoutSareeWord(doc.occasion),
  color: doc.color,
  craft: doc.craft,
  design: doc.design,
  style: Array.isArray(doc.styles) && doc.styles.filter(Boolean).length
    ? doc.styles.filter(Boolean).join(', ')
    : /saree/i.test(doc.style || '')
      ? 'Chaniya Choli'
      : doc.style || 'Chaniya Choli',
  styles: Array.isArray(doc.styles) ? doc.styles.map(item => String(item || '').trim()).filter(Boolean) : [],
  details: Array.isArray(doc.details)
    ? doc.details
        .map(row => ({ label: String(row?.label || '').trim(), value: String(row?.value || '').trim() }))
        .filter(row => row.label && row.value)
    : [],
  category: 'lehenga',
  collections: doc.collections || [],
  image: uniqueImages(doc)[0] || doc.imageUrl,
  images: uniqueImages(doc),
  imageAlt: withoutSareeWord(doc.imageAlt),
  status: doc.status
})

const mapProduct = (doc: ProductDoc) => ({
  id: doc._id.toHexString(),
  ...toStoreProduct(doc),
  name: doc.name,
  imageUrl: doc.imageUrl,
  images: uniqueImages(doc),
  imageName: doc.imageName,
  imageAlt: doc.imageAlt,
  listingType: doc.listingType,
  sellingPrice: doc.sellingPrice,
  rentPrice: doc.rentPrice,
  sellingMrp: doc.sellingMrp || 0,
  rentMrp: doc.rentMrp || 0,
  collections: doc.collections,
  seoTitle: doc.seoTitle,
  seoDescription: doc.seoDescription,
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

export const listProductsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [{ name: regex }, { slug: regex }, { description: regex }, { seoTitle: regex }]
  }

  if (query.status === 'active' || query.status === 'inactive') filter.status = query.status
  if (query.listingType === 'sale' || query.listingType === 'rent' || query.listingType === 'both') {
    filter.listingType = query.listingType
  }

  const [rows, total] = await Promise.all([
    db.collection<ProductDoc>('Product').find(filter).sort({ createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('Product').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapProduct), total, query.page, query.limit)
}

export const isAllProductsCollection = (slug?: string) => {
  const value = String(slug || '').trim().toLowerCase()

  return !value || value === 'sarees' || value === 'all' || value === 'all-products'
}

export const listStoreProducts = async (collectionSlug?: string) => {
  const db = await getDb()
  const filter: Record<string, unknown> = { status: 'active' }

  if (collectionSlug && !isAllProductsCollection(collectionSlug)) {
    filter.collections = collectionSlug
  }

  const rows = await db.collection<ProductDoc>('Product').find(filter).sort({ createdAt: -1 }).toArray()
  const mapped = await applyGoogleRatingToProducts(rows.map(toStoreProduct))

  if (collectionSlug && !mapped.length) {
    const all = await db.collection<ProductDoc>('Product').find({ status: 'active' }).sort({ createdAt: -1 }).toArray()

    return applyGoogleRatingToProducts(all.map(toStoreProduct))
  }

  return mapped
}

const listingTypesForToken = (token: string) => {
  if (/^(rent|rental|hire)$/i.test(token)) return ['rent', 'both']
  if (/^(sell|sale|selling)$/i.test(token)) return ['sale', 'both']

  return null
}

export const searchStoreProducts = async (search: string, limit = 8) => {
  const tokens = search
    .trim()
    .split(/\s+/)
    .map(token => token.trim())
    .filter(token => token.length >= 1)

  if (!tokens.length) return { products: [] as ReturnType<typeof toStoreProduct>[], total: 0 }

  const db = await getDb()
  const filter: Record<string, unknown> = {
    status: 'active',
    $and: tokens.map(token => {
      const regex = searchRegex(token)
      const listingTypes = listingTypesForToken(token)
      const clause: Record<string, unknown>[] = [
        { name: regex },
        { slug: regex },
        { description: regex },
        { seoTitle: regex },
        { color: regex },
        { occasion: regex },
        { fabric: regex },
        { craft: regex },
        { style: regex },
        { design: regex }
      ]

      if (listingTypes) clause.push({ listingType: { $in: listingTypes } })

      return { $or: clause }
    })
  }

  const collection = db.collection<ProductDoc>('Product')
  const [rows, total] = await Promise.all([
    collection.find(filter).sort({ createdAt: -1 }).limit(Math.min(48, Math.max(1, limit))).toArray(),
    collection.countDocuments(filter)
  ])

  return { products: await applyGoogleRatingToProducts(rows.map(toStoreProduct)), total }
}

export const getStoreProduct = async (slug: string) => {
  const db = await getDb()
  const doc = await db.collection<ProductDoc>('Product').findOne({ slug, status: 'active' })

  return applyGoogleRatingToProduct(doc ? toStoreProduct(doc) : null)
}

type ProductInput = {
  name: string
  slug?: string
  description: string
  imageUrl: string
  images?: string[]
  imageName: string
  imageAlt: string
  listingType: ListingType
  sellingPrice: number
  rentPrice: number
  sellingMrp?: number
  rentMrp?: number
  collections: string[]
  fabric: string
  color: string
  craft: string
  occasion: string
  design: string
  style: string
  styles?: string[]
  details?: { label: string; value: string }[]
  seoTitle: string
  seoDescription: string
  status?: ProductStatus
}

const normalize = (input: ProductInput) => {
  const name = input.name.trim()
  const slug = slugify(input.slug || name)
  const listingType: ListingType = input.listingType === 'rent' || input.listingType === 'sale' ? input.listingType : 'both'
  const sellingPrice = Number(input.sellingPrice) || 0
  const rentPrice = Number(input.rentPrice) || 0
  const sellingMrp = Number(input.sellingMrp) || 0
  const rentMrp = Number(input.rentMrp) || 0

  if (!name || !slug) throw new Error('Product name is required')
  if (!input.imageUrl) throw new Error('Product image is required')
  if ((listingType === 'sale' || listingType === 'both') && sellingPrice <= 0) throw new Error('Selling price is required')
  if ((listingType === 'rent' || listingType === 'both') && rentPrice <= 0) throw new Error('Rent price is required')
  if (sellingMrp && sellingMrp < sellingPrice) throw new Error('Selling MRP must be greater than or equal to selling price')
  if (rentMrp && rentMrp < rentPrice) throw new Error('Rent MRP must be greater than or equal to rent price')

  return {
    name,
    slug,
    description: input.description.trim(),
    imageUrl: input.imageUrl,
    images: uniqueImages({ imageUrl: input.imageUrl, images: input.images }),
    imageName: input.imageName.trim() || name,
    imageAlt: input.imageAlt.trim() || name,
    listingType,
    sellingPrice,
    rentPrice,
    sellingMrp,
    rentMrp,
    collections: Array.isArray(input.collections) ? input.collections.filter(Boolean) : [],
    fabric: input.fabric.trim(),
    color: input.color.trim(),
    craft: input.craft.trim(),
    occasion: input.occasion.trim(),
    design: input.design.trim(),
    styles: [...new Set((Array.isArray(input.styles) ? input.styles : []).map(item => String(item || '').trim()).filter(Boolean))].slice(0, 20),
    style: ([...new Set((Array.isArray(input.styles) ? input.styles : []).map(item => String(item || '').trim()).filter(Boolean))][0] ||
      input.style.trim() ||
      'Chaniya Choli'),
    details: (Array.isArray(input.details) ? input.details : [])
      .map(row => ({ label: String(row?.label || '').trim().slice(0, 80), value: String(row?.value || '').trim().slice(0, 240) }))
      .filter(row => row.label && row.value)
      .slice(0, 30),
    seoTitle: (input.seoTitle || `${name} | Jagu's Designing`).trim(),
    seoDescription: (input.seoDescription || input.description).trim(),
    status: input.status === 'inactive' ? 'inactive' : 'active'
  }
}

export const createProduct = async (input: ProductInput) => {
  const data = normalize(input)
  const db = await getDb()
  const exists = await db.collection('Product').findOne({ slug: data.slug })

  if (exists) throw new Error('Slug already exists')

  const now = new Date()
  const result = await db.collection('Product').insertOne({
    ...data,
    rating: 0,
    reviews: 0,
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString() }
}

export const updateProduct = async (id: string, input: ProductInput) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid product')

  const data = normalize(input)
  const db = await getDb()

  await db.collection('Product').updateOne({ _id: new ObjectId(id) }, { $set: { ...data, updatedAt: new Date() } })
}

export const updateProductStatus = async (id: string, status: ProductStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid product')

  const db = await getDb()

  await db.collection('Product').updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export const deleteProduct = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid product')

  const db = await getDb()

  await db.collection('Product').deleteOne({ _id: new ObjectId(id) })
}
