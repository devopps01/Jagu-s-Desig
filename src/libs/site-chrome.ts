import {
  createFooterLink,
  defaultFooterInfoLinks,
  defaultFooterPolicyLinks,
  defaultSiteChromeSettings,
  type FooterLink,
  type SiteChromeSettings
} from '@/libs/site-chrome-types'
import { getDb } from '@/libs/mongo'

const KEY = 'default'

const cleanText = (value: unknown, max: number) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, max)

const cleanMultiline = (value: unknown, max: number) =>
  String(value || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, max)

const cleanLink = (input: Partial<FooterLink>, index: number): FooterLink =>
  createFooterLink({
    id: String(input.id || `link-${index + 1}`),
    enabled: input.enabled !== false,
    label: cleanText(input.label, 80) || `Link ${index + 1}`,
    href: cleanText(input.href, 240) || '/'
  })

const cleanLinks = (input: unknown, fallback: FooterLink[]) => {
  if (!Array.isArray(input) || input.length === 0) return fallback

  return input.map((row, index) => cleanLink((row || {}) as Partial<FooterLink>, index))
}

export const normalizeSiteChrome = (input: Partial<SiteChromeSettings> = {}): SiteChromeSettings => {
  const fallback = defaultSiteChromeSettings()

  return {
    showAnnouncement: input.showAnnouncement !== false,
    announcements: cleanMultiline(input.announcements, 600) || fallback.announcements,
    footerTagline: cleanText(input.footerTagline, 220) || fallback.footerTagline,
    footerCopyright: cleanText(input.footerCopyright, 160) || fallback.footerCopyright,
    footerPolicyTitle: cleanText(input.footerPolicyTitle, 60) || fallback.footerPolicyTitle,
    footerInfoTitle: cleanText(input.footerInfoTitle, 60) || fallback.footerInfoTitle,
    footerAtelierTitle: cleanText(input.footerAtelierTitle, 60) || fallback.footerAtelierTitle,
    footerPolicyLinks: cleanLinks(input.footerPolicyLinks, defaultFooterPolicyLinks()),
    footerInfoLinks: cleanLinks(input.footerInfoLinks, defaultFooterInfoLinks()),
    floatEnabled: input.floatEnabled !== false,
    floatLabel: cleanText(input.floatLabel, 40) || fallback.floatLabel,
    floatMessage: cleanText(input.floatMessage, 200) || fallback.floatMessage
  }
}

export const getSiteChromeSettings = async (): Promise<SiteChromeSettings> => {
  try {
    const db = await getDb()
    const doc = await db.collection<{ key: string } & SiteChromeSettings>('SiteChrome').findOne({ key: KEY })
    const normalized = normalizeSiteChrome(doc || {})
    const storedEmptyPolicy = !doc || !Array.isArray(doc.footerPolicyLinks) || doc.footerPolicyLinks.length === 0
    const storedEmptyInfo = !doc || !Array.isArray(doc.footerInfoLinks) || doc.footerInfoLinks.length === 0

    if (storedEmptyPolicy || storedEmptyInfo) {
      await db.collection('SiteChrome').updateOne(
        { key: KEY },
        {
          $set: { ...normalized, key: KEY, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )
    }

    return normalized
  } catch {
    return defaultSiteChromeSettings()
  }
}

export const saveSiteChromeSettings = async (input: Partial<SiteChromeSettings>) => {
  const db = await getDb()
  const data = normalizeSiteChrome(input)
  const now = new Date()

  await db.collection('SiteChrome').updateOne(
    { key: KEY },
    { $set: { ...data, key: KEY, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}
