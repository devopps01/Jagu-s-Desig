import { ObjectId } from 'mongodb'

import { listSendableTokens } from '@/libs/device-tokens'
import { getFirebaseAdmin } from '@/libs/firebase-admin'
import { getDb } from '@/libs/mongo'
import { searchRegex, tableResponse, type TableQuery } from '@/libs/table-query'

export type CampaignTarget = 'all' | 'users' | 'guests'
export type CampaignStatus = 'draft' | 'sent' | 'failed'

export type PushCampaignDoc = {
  _id: ObjectId
  title: string
  body: string
  url: string
  imageUrl: string
  target: CampaignTarget
  status: CampaignStatus
  sentCount: number
  failCount: number
  error: string
  createdAt: Date
  updatedAt: Date
  sentAt: Date | null
}

const mapCampaign = (doc: PushCampaignDoc) => ({
  id: doc._id.toHexString(),
  title: doc.title,
  body: doc.body,
  url: doc.url || '/',
  imageUrl: doc.imageUrl || '',
  target: doc.target,
  status: doc.status,
  sentCount: doc.sentCount || 0,
  failCount: doc.failCount || 0,
  error: doc.error || '',
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
  sentAt: doc.sentAt
})

export const listPushCampaignsTable = async (query: TableQuery) => {
  const db = await getDb()
  const regex = query.search ? searchRegex(query.search) : null
  const filter: Record<string, unknown> = {}

  if (regex) filter.$or = [{ title: regex }, { body: regex }]
  if (query.status === 'draft' || query.status === 'sent' || query.status === 'failed') filter.status = query.status

  const [rows, total] = await Promise.all([
    db
      .collection<PushCampaignDoc>('PushCampaign')
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(query.skip)
      .limit(query.limit)
      .toArray(),
    db.collection('PushCampaign').countDocuments(filter)
  ])

  return tableResponse(rows.map(mapCampaign), total, query.page, query.limit)
}

export const createPushCampaign = async (input: {
  title?: string
  body?: string
  url?: string
  imageUrl?: string
  target?: CampaignTarget
}) => {
  const title = String(input.title || '').trim()
  const body = String(input.body || '').trim()
  const url = String(input.url || '/').trim() || '/'
  const imageUrl = String(input.imageUrl || '').trim()
  const target: CampaignTarget = input.target === 'users' || input.target === 'guests' ? input.target : 'all'

  if (!title) throw new Error('Title is required')
  if (!body) throw new Error('Message is required')

  const now = new Date()
  const db = await getDb()
  const result = await db.collection('PushCampaign').insertOne({
    title,
    body,
    url,
    imageUrl,
    target,
    status: 'draft' satisfies CampaignStatus,
    sentCount: 0,
    failCount: 0,
    error: '',
    createdAt: now,
    updatedAt: now,
    sentAt: null
  })

  return { id: result.insertedId.toHexString(), title, body, url, imageUrl, target }
}

export const sendPushCampaign = async (id: string) => {
  if (!ObjectId.isValid(id)) throw new Error('Campaign not found')

  const db = await getDb()
  const campaign = await db.collection<PushCampaignDoc>('PushCampaign').findOne({ _id: new ObjectId(id) })

  if (!campaign) throw new Error('Campaign not found')

  const { tokens } = await listSendableTokens(campaign.target)

  if (!tokens.length) throw new Error('No FCM tokens yet. Ask customers to allow notifications.')

  const messaging = await getFirebaseAdmin()
  const origin = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  const link = campaign.url.startsWith('http') ? campaign.url : `${origin}${campaign.url.startsWith('/') ? '' : '/'}${campaign.url}`
  let sentCount = 0
  let failCount = 0
  let error = ''

  for (let index = 0; index < tokens.length; index += 500) {
    const batch = tokens.slice(index, index + 500)
    const result = await messaging.sendEachForMulticast({
      tokens: batch,
      notification: {
        title: campaign.title,
        body: campaign.body,
        imageUrl: campaign.imageUrl || undefined
      },
      webpush: {
        fcmOptions: { link },
        notification: {
          title: campaign.title,
          body: campaign.body,
          icon: campaign.imageUrl || '/images/home/home-craft.png'
        }
      },
      data: { url: link }
    })

    sentCount += result.successCount
    failCount += result.failureCount
    const firstError = result.responses.find(item => !item.success)?.error?.message

    if (firstError && !error) error = firstError
  }

  const now = new Date()
  const status: CampaignStatus = sentCount ? 'sent' : 'failed'

  await db.collection('PushCampaign').updateOne(
    { _id: campaign._id },
    {
      $set: {
        status,
        sentCount,
        failCount,
        error,
        sentAt: now,
        updatedAt: now
      }
    }
  )

  return { id, status, sentCount, failCount, error }
}
