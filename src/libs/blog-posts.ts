import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { slugify } from '@/libs/slug'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type BlogPostStatus = 'draft' | 'published'

export type BlogPostDoc = {
  _id: ObjectId
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  coverImageAlt: string
  author: string
  tags: string[]
  status: BlogPostStatus
  publishedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type BlogPostInput = {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  coverImage?: string
  coverImageAlt?: string
  author?: string
  tags?: string[] | string
  status?: BlogPostStatus
  publishedAt?: string | null
}

const mapBlog = (doc: BlogPostDoc) => ({
  id: doc._id.toHexString(),
  title: doc.title,
  slug: doc.slug,
  excerpt: doc.excerpt,
  content: doc.content,
  coverImage: doc.coverImage || '',
  coverImageAlt: doc.coverImageAlt || doc.title,
  author: doc.author || "Jagu's Designing",
  tags: doc.tags || [],
  status: doc.status,
  publishedAt: doc.publishedAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const mapBlogPublic = (doc: BlogPostDoc) => ({
  id: doc._id.toHexString(),
  title: doc.title,
  slug: doc.slug,
  excerpt: doc.excerpt,
  coverImage: doc.coverImage || '',
  coverImageAlt: doc.coverImageAlt || doc.title,
  author: doc.author || "Jagu's Designing",
  tags: doc.tags || [],
  publishedAt: doc.publishedAt,
  createdAt: doc.createdAt
})

export type BlogPostPublic = ReturnType<typeof mapBlogPublic>

const cleanTags = (value: unknown) =>
  [...new Set((Array.isArray(value) ? value : String(value || '').split(',')).map(item => String(item || '').trim()).filter(Boolean))].slice(0, 12)

const normalizeInput = (input: BlogPostInput) => {
  const title = String(input.title || '').trim()
  const slug = slugify(input.slug || title)
  const content = String(input.content || '').trim()
  let excerpt = String(input.excerpt || '').trim()

  if (!excerpt && content) {
    excerpt = content.replace(/\s+/g, ' ').slice(0, 180)
    if (content.length > 180) excerpt += '…'
  }

  if (!title || !slug) throw new Error('Blog title is required')
  if (!content) throw new Error('Blog content is required')

  const status: BlogPostStatus = input.status === 'published' ? 'published' : 'draft'
  let publishedAt: Date | null = null

  if (input.publishedAt) {
    const parsed = new Date(input.publishedAt)

    publishedAt = Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return {
    title,
    slug,
    excerpt,
    content,
    coverImage: String(input.coverImage || '').trim(),
    coverImageAlt: String(input.coverImageAlt || title).trim(),
    author: String(input.author || "Jagu's Designing").trim(),
    tags: cleanTags(input.tags),
    status,
    publishedAt
  }
}

export const listBlogPostsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ title: regex }, { slug: regex }, { excerpt: regex }, { tags: regex }]
  if (query.status === 'draft' || query.status === 'published') filter.status = query.status

  const [rows, total] = await Promise.all([
    db.collection<BlogPostDoc>('BlogPost').find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(query.skip).limit(query.limit).toArray(),
    db.collection('BlogPost').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapBlog), total, query.page, query.limit)
}

export const getBlogPostById = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Blog post not found')

  const db = await getDb()
  const doc = await db.collection<BlogPostDoc>('BlogPost').findOne({ _id: new ObjectId(id) })

  if (!doc) throw new Error('Blog post not found')

  return mapBlog(doc)
}

export const listPublishedBlogPosts = async (options: { limit?: number; page?: number } = {}) => {
  const limit = Math.min(50, Math.max(1, options.limit ?? 24))
  const page = Math.max(1, options.page ?? 1)
  const skip = (page - 1) * limit
  const now = new Date()

  const db = await getDb()
  const filter = {
    status: 'published' as const,
    $or: [{ publishedAt: { $lte: now } }, { publishedAt: null }]
  }

  const [rows, total] = await Promise.all([
    db.collection<BlogPostDoc>('BlogPost').find(filter).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection('BlogPost').countDocuments(filter)
  ])

  return {
    data: rows.map(mapBlogPublic),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1)
  }
}

export const getPublishedBlogPostBySlug = async (slug: string) => {
  const normalized = slugify(slug)

  if (!normalized) return null

  const db = await getDb()
  const now = new Date()
  const doc = await db.collection<BlogPostDoc>('BlogPost').findOne({
    slug: normalized,
    status: 'published',
    $or: [{ publishedAt: { $lte: now } }, { publishedAt: null }]
  })

  if (!doc) return null

  return mapBlog(doc)
}

export const createBlogPost = async (input: BlogPostInput) => {
  const data = normalizeInput(input)
  const db = await getDb()
  const exists = await db.collection('BlogPost').findOne({ slug: data.slug })

  if (exists) throw new Error('This URL slug is already used')

  const now = new Date()
  const publishedAt = data.status === 'published' ? data.publishedAt || now : null

  const result = await db.collection('BlogPost').insertOne({
    ...data,
    publishedAt,
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString() }
}

export const updateBlogPost = async (id: string, input: BlogPostInput) => {
  if (!ObjectId.isValid(id)) throw new Error('Blog post not found')

  const data = normalizeInput(input)
  const db = await getDb()
  const clash = await db.collection('BlogPost').findOne({ slug: data.slug, _id: { $ne: new ObjectId(id) } })

  if (clash) throw new Error('This URL slug is already used')

  const existing = await db.collection<BlogPostDoc>('BlogPost').findOne({ _id: new ObjectId(id) })

  if (!existing) throw new Error('Blog post not found')

  let publishedAt = data.publishedAt

  if (data.status === 'published') {
    publishedAt = publishedAt || existing.publishedAt || new Date()
  } else {
    publishedAt = null
  }

  await db.collection('BlogPost').updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...data,
        publishedAt,
        updatedAt: new Date()
      }
    }
  )
}

export const updateBlogPostStatus = async (id: string, status: BlogPostStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Blog post not found')

  const db = await getDb()
  const existing = await db.collection<BlogPostDoc>('BlogPost').findOne({ _id: new ObjectId(id) })

  if (!existing) throw new Error('Blog post not found')

  const publishedAt = status === 'published' ? existing.publishedAt || new Date() : null

  await db.collection('BlogPost').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, publishedAt, updatedAt: new Date() } }
  )
}

export const deleteBlogPost = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Blog post not found')

  const db = await getDb()

  await db.collection('BlogPost').deleteOne({ _id: new ObjectId(id) })
}
