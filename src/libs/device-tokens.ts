import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type PushPermission = 'granted' | 'denied' | 'default'

export type DeviceTokenDoc = {
  _id: ObjectId
  deviceId: string
  token: string
  userId: string
  email: string
  userAgent: string
  platform: string
  permission: PushPermission
  createdAt: Date
  updatedAt: Date
  lastSeenAt: Date
}

export const detectPlatform = (userAgent: string) => {
  const ua = userAgent.toLowerCase()

  if (/android/.test(ua)) return 'Android'
  if (/iphone|ipad|ipod/.test(ua)) return 'iOS'
  if (/windows/.test(ua)) return 'Windows'
  if (/mac os|macos/.test(ua)) return 'macOS'
  if (/linux/.test(ua)) return 'Linux'

  return 'Other'
}

const mapToken = (doc: DeviceTokenDoc) => ({
  id: doc._id.toHexString(),
  deviceId: doc.deviceId || '',
  token: doc.token || '',
  userId: doc.userId || '',
  email: doc.email || '',
  userAgent: doc.userAgent || '',
  platform: doc.platform || 'Other',
  permission: doc.permission || 'default',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  lastSeenAt: doc.lastSeenAt
})

export const upsertDeviceToken = async (input: {
  deviceId: string
  token?: string
  userId?: string
  email?: string
  userAgent?: string
  permission?: PushPermission
}) => {
  const db = await getDb()
  const deviceId = String(input.deviceId || '').trim()
  const token = String(input.token || '').trim()
  const now = new Date()
  const userAgent = String(input.userAgent || '').slice(0, 400)

  if (!deviceId) throw new Error('Device id is required')

  const payload = {
    deviceId,
    token,
    userId: String(input.userId || ''),
    email: String(input.email || '').trim().toLowerCase(),
    userAgent,
    platform: detectPlatform(userAgent),
    permission: (input.permission === 'granted' || input.permission === 'denied' ? input.permission : 'default') as PushPermission,
    updatedAt: now,
    lastSeenAt: now
  }

  const existing = token
    ? await db.collection<DeviceTokenDoc>('DeviceToken').findOne({ $or: [{ deviceId }, { token }] })
    : await db.collection<DeviceTokenDoc>('DeviceToken').findOne({ deviceId })

  const nextToken = token || (payload.permission === 'granted' && existing?.token ? existing.token : token)
  const nextPayload = { ...payload, token: nextToken }

  if (existing) {
    await db.collection('DeviceToken').updateOne(
      { _id: existing._id },
      {
        $set: nextPayload
      }
    )

    return { id: existing._id.toHexString(), ...nextPayload }
  }

  const result = await db.collection('DeviceToken').insertOne({ ...nextPayload, createdAt: now })

  return { id: result.insertedId.toHexString(), ...nextPayload }
}

export const listDeviceTokensTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) {
    filter.$or = [{ email: regex }, { platform: regex }, { token: regex }, { deviceId: regex }]
  }

  if (query.status === 'granted' || query.status === 'denied' || query.status === 'default') {
    filter.permission = query.status
  }

  if (query.listingType === 'users') filter.email = { $ne: '' }
  if (query.listingType === 'guests') filter.email = ''

  const [rows, total] = await Promise.all([
    db
      .collection<DeviceTokenDoc>('DeviceToken')
      .find(filter)
      .sort({ lastSeenAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('DeviceToken').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapToken), total, query.page, query.limit)
}

export const listSendableTokens = async (target: 'all' | 'users' | 'guests') => {
  const db = await getDb()
  const filter: Record<string, unknown> = { token: { $ne: '' }, permission: 'granted' }

  if (target === 'users') filter.email = { $ne: '' }
  if (target === 'guests') filter.email = ''

  const rows = await db
    .collection<DeviceTokenDoc>('DeviceToken')
    .find(filter)
    .project({ token: 1, email: 1, platform: 1 })
    .toArray()

  const tokens = [...new Set(rows.map(row => String(row.token || '')).filter(Boolean))]

  return { tokens, totalDevices: rows.length }
}
