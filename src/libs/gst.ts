import { calcGstAmount, defaultGstSettings, money2, type GstSettings } from '@/libs/gst-types'
import { getDb } from '@/libs/mongo'

export type { GstSettings } from '@/libs/gst-types'
export { calcGstAmount, defaultGstSettings, money2 } from '@/libs/gst-types'

const SETTINGS_KEY = 'default'

const normalize = (input: Partial<GstSettings> = {}): GstSettings => {
  const rate = Number(input.rate)

  return {
    enabled: Boolean(input.enabled),
    rate: Number.isFinite(rate) ? Math.min(40, Math.max(0, Math.round(rate * 100) / 100)) : defaultGstSettings.rate,
    label: String(input.label || defaultGstSettings.label).trim().slice(0, 40) || defaultGstSettings.label
  }
}

export const getGstSettings = async (): Promise<GstSettings> => {
  const db = await getDb()
  const doc = await db.collection<{ key: string } & GstSettings>('GstSettings').findOne({ key: SETTINGS_KEY })

  return normalize(doc || defaultGstSettings)
}

export const saveGstSettings = async (input: Partial<GstSettings>) => {
  const db = await getDb()
  const data = normalize(input)
  const now = new Date()

  await db.collection('GstSettings').updateOne(
    { key: SETTINGS_KEY },
    { $set: { ...data, key: SETTINGS_KEY, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}

export const gstForTaxable = async (taxable: number) => {
  const settings = await getGstSettings()
  const amount = calcGstAmount(money2(taxable), settings)

  return {
    enabled: settings.enabled && amount > 0,
    rate: settings.enabled ? settings.rate : 0,
    label: settings.label,
    amount
  }
}
