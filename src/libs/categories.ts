import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { slugify } from '@/libs/slug'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type CategoryType = 'main' | 'sub'
export type CategoryStatus = 'active' | 'inactive'

export type CategoryDoc = {
  _id: ObjectId
  name: string
  slug: string
  description: string
  imageUrl: string
  imageName: string
  imageAlt: string
  type: CategoryType
  parentId: string | null
  status: CategoryStatus
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const normalizeStatus = (status?: string | null): CategoryStatus => (status === 'inactive' ? 'inactive' : 'active')

const mapCategory = (doc: CategoryDoc) => ({
  id: doc._id.toHexString(),
  name: doc.name,
  slug: doc.slug,
  description: doc.description,
  imageUrl: doc.imageUrl,
  imageName: doc.imageName,
  imageAlt: doc.imageAlt,
  type: doc.type,
  parentId: doc.parentId,
  status: normalizeStatus(doc.status),
  sortOrder: doc.sortOrder ?? 100,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

export const listCategories = async () => {
  const db = await getDb()
  const rows = await db
    .collection<CategoryDoc>('Category')
    .find({})
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray()

  return rows.map(mapCategory)
}

export const listMainCategories = async () => {
  const db = await getDb()
  const rows = await db
    .collection<CategoryDoc>('Category')
    .find({ type: 'main' })
    .sort({ sortOrder: 1, name: 1 })
    .toArray()

  return rows.map(mapCategory)
}

export const listCategoriesTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [{ name: regex }, { slug: regex }, { description: regex }]
  }

  if (query.status === 'active' || query.status === 'inactive') {
    filter.status = query.status
  }

  const [rows, total, mains] = await Promise.all([
    db
      .collection<CategoryDoc>('Category')
      .find(filter)
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('Category').countDocuments(filter),
    db.collection<CategoryDoc>('Category').find({ type: 'main' }).toArray()
  ])

  const parentNames = Object.fromEntries(mains.map(item => [item._id.toHexString(), item.name]))

  return tableResponse(
    rows.map(row => ({
      ...mapCategory(row),
      parentName: row.parentId ? parentNames[row.parentId] || '-' : '-'
    })),
    total,
    query.page,
    query.limit
  )
}

export const createCategory = async (input: {
  name: string
  slug?: string
  description: string
  imageUrl: string
  imageName: string
  imageAlt: string
  type: CategoryType
  parentId?: string | null
  status?: CategoryStatus
  sortOrder?: number
}) => {
  const name = input.name.trim()
  const slug = slugify(input.slug || name)
  const type: CategoryType = input.type === 'sub' ? 'sub' : 'main'
  const parentId = type === 'sub' ? input.parentId || null : null
  const status = normalizeStatus(input.status)

  if (!name || !slug) {
    throw new Error('Name and slug are required')
  }

  if (type === 'sub' && !parentId) {
    throw new Error('Select a main category')
  }

  if (!input.imageUrl || !input.imageName.trim() || !input.imageAlt.trim()) {
    throw new Error('Image, image name and alt text are required')
  }

  const db = await getDb()
  const exists = await db.collection('Category').findOne({ slug })

  if (exists) {
    throw new Error('Slug already exists')
  }

  const now = new Date()
  const result = await db.collection('Category').insertOne({
    name,
    slug,
    description: input.description.trim(),
    imageUrl: input.imageUrl,
    imageName: input.imageName.trim(),
    imageAlt: input.imageAlt.trim(),
    type,
    parentId,
    status,
    sortOrder: input.sortOrder ?? 100,
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString() }
}

export const updateCategory = async (
  id: string,
  input: {
    name: string
    slug?: string
    description: string
    imageUrl: string
    imageName: string
    imageAlt: string
    type: CategoryType
    parentId?: string | null
    status?: CategoryStatus
    sortOrder?: number
  }
) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid category')
  }

  const name = input.name.trim()
  const slug = slugify(input.slug || name)
  const type: CategoryType = input.type === 'sub' ? 'sub' : 'main'
  const parentId = type === 'sub' ? input.parentId || null : null

  if (type === 'sub' && !parentId) {
    throw new Error('Select a main category')
  }

  if (parentId === id) {
    throw new Error('Category cannot be its own parent')
  }

  const db = await getDb()
  const now = new Date()
  const $set: Record<string, unknown> = {
    name,
    slug,
    description: input.description.trim(),
    imageUrl: input.imageUrl,
    imageName: input.imageName.trim(),
    imageAlt: input.imageAlt.trim(),
    type,
    parentId,
    status: normalizeStatus(input.status),
    updatedAt: now
  }

  if (typeof input.sortOrder === 'number') {
    $set.sortOrder = input.sortOrder
  }

  await db.collection('Category').updateOne({ _id: new ObjectId(id) }, { $set })
}

export const updateCategoryStatus = async (id: string, status: CategoryStatus) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid category')
  }

  const db = await getDb()

  await db.collection('Category').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status: normalizeStatus(status), updatedAt: new Date() } }
  )
}

export const deleteCategory = async (id: string) => {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid category')
  }

  const db = await getDb()

  await db.collection('Category').deleteMany({ parentId: id })
  await db.collection('Category').deleteOne({ _id: new ObjectId(id) })
}

export const getHeaderCategories = async () => {
  const all = await listCategories()
  const mains = all.filter(item => item.type === 'main' && item.status === 'active')

  return mains.map(main => ({
    ...main,
    children: all.filter(item => item.type === 'sub' && item.parentId === main.id && item.status === 'active')
  }))
}
