import { ObjectId } from 'mongodb'

import { defaultNewsletterSettings, type NewsletterSettings } from '@/libs/newsletter-types'
import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type { NewsletterSettings, NewsletterSubscriber } from '@/libs/newsletter-types'
export { defaultNewsletterSettings } from '@/libs/newsletter-types'

type SubscriberDoc = {
  _id: ObjectId
  email: string
  source: string
  createdAt: Date
}

const SETTINGS_KEY = 'default'

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const cleanText = (value: unknown, max: number) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)

const cleanColor = (value: unknown) => {
  const raw = String(value || '').trim()

  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) return raw.toLowerCase()

  return defaultNewsletterSettings.buttonColor
}

const normalizeSettings = (input: Partial<NewsletterSettings> = {}): NewsletterSettings => ({
  enabled: input.enabled !== false,
  headline: cleanText(input.headline, 80) || defaultNewsletterSettings.headline,
  subtext: cleanText(input.subtext, 180) || defaultNewsletterSettings.subtext,
  placeholder: cleanText(input.placeholder, 60) || defaultNewsletterSettings.placeholder,
  buttonLabel: cleanText(input.buttonLabel, 40) || defaultNewsletterSettings.buttonLabel,
  buttonColor: cleanColor(input.buttonColor),
  backgroundImage: cleanText(input.backgroundImage, 300) || defaultNewsletterSettings.backgroundImage,
  successMessage: cleanText(input.successMessage, 160) || defaultNewsletterSettings.successMessage
})

export const getNewsletterSettings = async (): Promise<NewsletterSettings> => {
  const db = await getDb()
  const doc = await db.collection<{ key: string } & NewsletterSettings>('NewsletterSettings').findOne({ key: SETTINGS_KEY })

  return normalizeSettings(doc || defaultNewsletterSettings)
}

export const saveNewsletterSettings = async (input: Partial<NewsletterSettings>) => {
  const db = await getDb()
  const data = normalizeSettings(input)
  const now = new Date()

  await db.collection('NewsletterSettings').updateOne(
    { key: SETTINGS_KEY },
    { $set: { ...data, key: SETTINGS_KEY, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}

export const subscribeNewsletter = async (input: { email?: string; website?: string; source?: string }) => {
  if (String(input.website || '').trim()) throw new Error('Could not subscribe')

  const email = cleanText(input.email, 120).toLowerCase()

  if (!emailOk(email)) throw new Error('Please enter a valid email')

  const db = await getDb()
  const existing = await db.collection<SubscriberDoc>('NewsletterSubscriber').findOne({ email })

  if (existing) return { id: existing._id.toHexString(), email, already: true as const }

  const recent = await db.collection<SubscriberDoc>('NewsletterSubscriber').findOne({
    email,
    createdAt: { $gte: new Date(Date.now() - 30 * 1000) }
  })

  if (recent) throw new Error('Please wait a moment before trying again')

  const now = new Date()
  const result = await db.collection('NewsletterSubscriber').insertOne({
    email,
    source: cleanText(input.source, 40) || 'home',
    createdAt: now
  })

  return { id: result.insertedId.toHexString(), email, already: false as const }
}

export const listNewsletterSubscribersTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.email = regex

  const [rows, total] = await Promise.all([
    db
      .collection<SubscriberDoc>('NewsletterSubscriber')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('NewsletterSubscriber').countDocuments(filter)
  ])

  return tableResponse(
    rows.map(doc => ({
      id: doc._id.toHexString(),
      email: doc.email,
      source: doc.source || 'home',
      createdAt: doc.createdAt
    })),
    total,
    query.page,
    query.limit
  )
}

export const getNewsletterStats = async () => {
  const db = await getDb()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [total, thisWeek] = await Promise.all([
    db.collection('NewsletterSubscriber').countDocuments(),
    db.collection('NewsletterSubscriber').countDocuments({ createdAt: { $gte: weekAgo } })
  ])

  return { total, thisWeek }
}

export const deleteNewsletterSubscriber = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Subscriber not found')

  const db = await getDb()
  const result = await db.collection('NewsletterSubscriber').deleteOne({ _id: new ObjectId(id) })

  if (!result.deletedCount) throw new Error('Subscriber not found')
}
