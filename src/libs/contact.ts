import { ObjectId } from 'mongodb'

import { defaultContactSettings, type ContactSettings, type ContactStatus } from '@/libs/contact-types'
import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type { ContactSettings, ContactStatus } from '@/libs/contact-types'
export { defaultContactSettings } from '@/libs/contact-types'

export type ContactSubmissionDoc = {
  _id: ObjectId
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactStatus
  userId?: string
  createdAt: Date
  updatedAt: Date
}

export type ContactSubmissionInput = {
  name?: string
  email?: string
  phone?: string
  subject?: string
  message?: string
  website?: string
  userId?: string
}

const SETTINGS_KEY = 'default'

const emailOk = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const cleanText = (value: unknown, max: number) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)

const isRemovedBangalore = (value: string) => {
  const v = value.toLowerCase()
  const digits = v.replace(/\D/g, '')

  return v.includes('jayanagar') || v.includes('632/18/3') || digits === '918154000915' || digits === '8154000915'
}

const isStaleSuratAddress = (value: string) => {
  const v = value.toLowerCase()

  if (!v || v.includes('ambika nagar')) return !v

  return v === "jagu's designing, surat, gujarat, india" || v === "jagu's designing, surat, gujarat"
}

const mapSubmission = (doc: ContactSubmissionDoc) => ({
  id: doc._id.toHexString(),
  name: doc.name,
  email: doc.email,
  phone: doc.phone || '',
  subject: doc.subject,
  message: doc.message,
  status: doc.status,
  userId: doc.userId || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt
})

const normalizeSettings = (input: Partial<ContactSettings> = {}): ContactSettings => ({
  headline: cleanText(input.headline, 120) || defaultContactSettings.headline,
  intro: cleanText(input.intro, 400) || defaultContactSettings.intro,
  email: cleanText(input.email, 120),
  phone: cleanText(input.phone, 40) || defaultContactSettings.phone,
  whatsapp: cleanText(input.whatsapp, 20).replace(/\D/g, '') || defaultContactSettings.whatsapp,
  hours: cleanText(input.hours, 80) || defaultContactSettings.hours,
  suratTitle: cleanText(input.suratTitle, 60) || defaultContactSettings.suratTitle,
  suratAddress: isStaleSuratAddress(cleanText(input.suratAddress, 280))
    ? defaultContactSettings.suratAddress
    : cleanText(input.suratAddress, 280),
  bangaloreTitle: cleanText(input.bangaloreTitle, 60) || defaultContactSettings.bangaloreTitle,
  bangaloreAddress: isRemovedBangalore(cleanText(input.bangaloreAddress, 240)) ? '' : cleanText(input.bangaloreAddress, 240),
  bangalorePhone: isRemovedBangalore(cleanText(input.bangalorePhone, 40)) ? '' : cleanText(input.bangalorePhone, 40),
  suratMapQuery: isStaleSuratAddress(cleanText(input.suratMapQuery, 240))
    ? defaultContactSettings.suratMapQuery
    : cleanText(input.suratMapQuery, 240) || defaultContactSettings.suratMapQuery,
  bangaloreMapQuery: isRemovedBangalore(cleanText(input.bangaloreMapQuery, 200) || cleanText(input.bangaloreAddress, 200))
    ? ''
    : cleanText(input.bangaloreMapQuery, 200),
})

export const getContactSettings = async (): Promise<ContactSettings> => {
  try {
    const db = await getDb()
    const doc = await db.collection<{ key: string } & ContactSettings>('ContactSettings').findOne({ key: SETTINGS_KEY })

    return normalizeSettings(doc || {})
  } catch {
    return defaultContactSettings
  }
}

export const saveContactSettings = async (input: Partial<ContactSettings>) => {
  const db = await getDb()
  const data = normalizeSettings(input)
  const now = new Date()

  await db.collection('ContactSettings').updateOne(
    { key: SETTINGS_KEY },
    { $set: { ...data, key: SETTINGS_KEY, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}

const normalizeSubmission = (input: ContactSubmissionInput) => {
  if (cleanText(input.website, 80)) throw new Error('Unable to send message')

  const name = cleanText(input.name, 80)
  const email = cleanText(input.email, 120).toLowerCase()
  const phone = cleanText(input.phone, 40)
  const subject = cleanText(input.subject, 80) || 'General inquiry'
  const message = cleanText(input.message, 2000)

  if (name.length < 2) throw new Error('Please enter your name')
  if (!emailOk(email)) throw new Error('Please enter a valid email')
  if (message.length < 10) throw new Error('Please write a slightly longer message')

  return { name, email, phone, subject, message, userId: input.userId || '' }
}

export const createContactSubmission = async (input: ContactSubmissionInput) => {
  const db = await getDb()
  const data = normalizeSubmission(input)
  const recent = await db.collection<ContactSubmissionDoc>('ContactSubmission').findOne({
    email: data.email,
    createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) }
  })

  if (recent) throw new Error('Please wait a moment before sending another message')

  const now = new Date()
  const result = await db.collection('ContactSubmission').insertOne({
    ...data,
    status: 'new',
    createdAt: now,
    updatedAt: now
  })

  return { id: result.insertedId.toHexString(), ...data, status: 'new' as const }
}

export const listContactSubmissionsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { subject: regex }, { message: regex }]
  if (['new', 'read', 'replied', 'archived'].includes(query.status)) filter.status = query.status

  const [rows, total] = await Promise.all([
    db
      .collection<ContactSubmissionDoc>('ContactSubmission')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('ContactSubmission').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapSubmission), total, query.page, query.limit)
}

export const getContactStats = async () => {
  const db = await getDb()
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [total, fresh, replied, thisWeek] = await Promise.all([
    db.collection('ContactSubmission').countDocuments(),
    db.collection('ContactSubmission').countDocuments({ status: 'new' }),
    db.collection('ContactSubmission').countDocuments({ status: 'replied' }),
    db.collection('ContactSubmission').countDocuments({ createdAt: { $gte: weekAgo } })
  ])

  return { total, new: fresh, replied, thisWeek }
}

export const updateContactStatus = async (id: string, status: ContactStatus) => {
  if (!ObjectId.isValid(id)) throw new Error('Inquiry not found')
  if (!['new', 'read', 'replied', 'archived'].includes(status)) throw new Error('Invalid status')

  const db = await getDb()
  const result = await db
    .collection('ContactSubmission')
    .updateOne({ _id: new ObjectId(id) }, { $set: { status, updatedAt: new Date() } })

  if (!result.matchedCount) throw new Error('Inquiry not found')
}

export const deleteContactSubmission = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Inquiry not found')

  const db = await getDb()

  await db.collection('ContactSubmission').deleteOne({ _id: new ObjectId(id) })
}
