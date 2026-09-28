import { ObjectId } from 'mongodb'

import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export const OTP_TTL_MS = 60 * 1000

export type OtpLogDoc = {
  _id: ObjectId
  email: string
  otp: string
  used: boolean
  createdAt: Date
  expiresAt: Date
}

export type WebUserAddress = {
  id: string
  label: string
  name: string
  phone: string
  address: string
  locality: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

export type WebUserDoc = {
  _id: ObjectId
  email: string
  referralCode?: string
  addresses?: WebUserAddress[]
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export const makeReferralCode = (id: string, email: string) => {
  const letters = email.replace(/[^a-z]/gi, '').slice(0, 4).toUpperCase() || 'JAGU'
  const tail = id.replace(/[^a-z0-9]/gi, '').slice(-4).toUpperCase()

  return `JD${letters}${tail}`
}

export const purgeExpiredOtps = async () => {
  const db = await getDb()

  await db.collection('OtpLog').deleteMany({
    expiresAt: { $lt: new Date() }
  })
}

export const createOtp = async (email: string) => {
  const normalized = email.trim().toLowerCase()
  const db = await getDb()

  await purgeExpiredOtps()

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const now = new Date()
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS)

  const result = await db.collection('OtpLog').insertOne({
    email: normalized,
    otp,
    used: false,
    createdAt: now,
    expiresAt
  })

  return {
    id: result.insertedId.toHexString(),
    email: normalized,
    otp,
    expiresAt
  }
}

export const verifyOtp = async (email: string, otp: string) => {
  const normalized = email.trim().toLowerCase()
  const db = await getDb()

  await purgeExpiredOtps()

  const record = await db.collection<OtpLogDoc>('OtpLog').findOne({
    email: normalized,
    otp: otp.trim(),
    used: false,
    expiresAt: { $gt: new Date() }
  })

  if (!record) {
    return null
  }

  await db.collection('OtpLog').updateOne({ _id: record._id }, { $set: { used: true } })

  const now = new Date()
  const users = db.collection<WebUserDoc>('WebUser')
  const existing = await users.findOne({ email: normalized })

  if (existing) {
    const referralCode = existing.referralCode || makeReferralCode(existing._id.toHexString(), existing.email)

    await users.updateOne(
      { _id: existing._id },
      { $set: { lastLoginAt: now, updatedAt: now, referralCode } }
    )

    return {
      id: existing._id.toHexString(),
      email: existing.email,
      referralCode
    }
  }

  const id = new ObjectId()
  const created = await users.insertOne({
    _id: id,
    email: normalized,
    lastLoginAt: now,
    createdAt: now,
    updatedAt: now
  })
  const referralCode = makeReferralCode(created.insertedId.toHexString(), normalized)

  await users.updateOne({ _id: created.insertedId }, { $set: { referralCode } })

  return {
    id: created.insertedId.toHexString(),
    email: normalized,
    referralCode
  }
}

export const getWebUserProfile = async (id: string) => {
  const db = await getDb()
  const user = ObjectId.isValid(id)
    ? await db.collection<WebUserDoc>('WebUser').findOne({ _id: new ObjectId(id) })
    : null

  if (!user) return null

  const referralCode = user.referralCode || makeReferralCode(user._id.toHexString(), user.email)

  if (!user.referralCode) {
    await db.collection('WebUser').updateOne({ _id: user._id }, { $set: { referralCode } })
  }

  return {
    id: user._id.toHexString(),
    email: user.email,
    referralCode,
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
    createdAt: user.createdAt
  }
}

export const listWebUsers = async (query?: TableQuery) => {
  const db = await getDb()
  const regex = query?.search ? searchRegex(query.search) : null
  const filter = regex ? { email: regex } : {}
  const skip = query?.skip || 0
  const limit = query?.limit || 10

  const [users, total] = await Promise.all([
    db
      .collection<WebUserDoc>('WebUser')
      .find(filter)
      .sort({ lastLoginAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    db.collection('WebUser').countDocuments(filter)
  ])

  return tableResponse(
    users.map(user => ({
      id: user._id.toHexString(),
      email: user.email,
      referralCode: user.referralCode || makeReferralCode(user._id.toHexString(), user.email),
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    })),
    total,
    query?.page || 1,
    limit
  )
}

export const listOtpLogs = async (query?: TableQuery) => {
  const db = await getDb()

  await purgeExpiredOtps()

  const regex = query?.search ? searchRegex(query.search) : null
  const filter = regex ? { $or: [{ email: regex }, { otp: regex }] } : {}
  const skip = query?.skip || 0
  const limit = query?.limit || 10

  const [logs, total] = await Promise.all([
    db.collection<OtpLogDoc>('OtpLog').find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    db.collection('OtpLog').countDocuments(filter)
  ])

  return tableResponse(
    logs.map(log => ({
      id: log._id.toHexString(),
      email: log.email,
      otp: log.otp,
      used: log.used,
      createdAt: log.createdAt,
      expiresAt: log.expiresAt
    })),
    total,
    query?.page || 1,
    limit
  )
}
