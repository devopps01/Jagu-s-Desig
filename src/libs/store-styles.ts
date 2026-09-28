import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { slugify } from '@/libs/slug'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type StyleStatus = 'active' | 'inactive'

export type StoreStyleDoc = {
  _id: ObjectId
  name: string
  slug: string
  collections: string[]
  status: StyleStatus
  createdAt: Date
  updatedAt: Date
}

const mapStyle = (doc: StoreStyleDoc) => ({
  id: doc._id.toHexString(),
  name: doc.name,
  slug: doc.slug,
  collections: doc.collections || [],
  status: doc.status,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const seedStyles = async () => {
  const db = await getDb()
  const count = await db.collection('StoreStyle').countDocuments()

  if (count) return

  const now = new Date()

  await db.collection('StoreStyle').insertMany(
    ['Chaniya Choli', 'Lehenga', 'Kurti', 'Dress'].map(name => ({
      name,
      slug: slugify(name),
      collections: [],
      status: 'active' as StyleStatus,
      createdAt: now,
      updatedAt: now
    }))
  )
}

export const listStylesTable = async (query: TableQuery) => {
  await seedStyles()

  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ name: regex }, { slug: regex }]
  if (query.status === 'active' || query.status === 'inactive') filter.status = query.status

  const [rows, total] = await Promise.all([
    db.collection<StoreStyleDoc>('StoreStyle').find(filter).sort({ name: 1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('StoreStyle').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapStyle), total, query.page, query.limit)
}

export const listActiveStyles = async () => {
  await seedStyles()

  const db = await getDb()
  const rows = await db.collection<StoreStyleDoc>('StoreStyle').find({ status: 'active' }).sort({ name: 1 }).toArray()

  return rows.map(mapStyle)
}

const cleanCollections = (value: unknown) =>
  [...new Set((Array.isArray(value) ? value : []).map(item => String(item || '').trim()).filter(Boolean))].slice(0, 40)

export const createStyle = async (input: { name?: string; slug?: string; collections?: string[]; status?: StyleStatus }) => {
  const name = String(input.name || '').trim()
  const slug = slugify(input.slug || name)

  if (!name || !slug) throw new Error('Style name is required')

  const db = await getDb()
  const exists = await db.collection('StoreStyle').findOne({ slug })

  if (exists) throw new Error('This style already exists')

  const now = new Date()
  const result = await db.collection('StoreStyle').insertOne({
    name,
    slug,
    collections: cleanCollections(input.collections),
    status: input.status === 'inactive' ? 'inactive' : 'active',
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString() }
}

export const updateStyle = async (
  id: string,
  input: { name?: string; slug?: string; collections?: string[]; status?: StyleStatus }
) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid style')

  const name = String(input.name || '').trim()
  const slug = slugify(input.slug || name)

  if (!name || !slug) throw new Error('Style name is required')

  const db = await getDb()
  const clash = await db.collection('StoreStyle').findOne({ slug, _id: { $ne: new ObjectId(id) } })

  if (clash) throw new Error('This style already exists')

  await db.collection('StoreStyle').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        name,
        slug,
        collections: cleanCollections(input.collections),
        status: input.status === 'inactive' ? 'inactive' : 'active',
        updatedAt: new Date()
      }
    }
  )
}

export const updateStyleStatus = async (id: string, status: StyleStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid style')

  const db = await getDb()

  await db.collection('StoreStyle').updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })
}

export const deleteStyle = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Invalid style')

  const db = await getDb()

  await db.collection('StoreStyle').deleteOne({ _id: new ObjectId(id) })
}
