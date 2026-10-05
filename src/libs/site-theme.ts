import {
  THEME_SANS_FONTS,
  THEME_SERIF_FONTS,
  defaultSiteThemeSettings,
  type SiteThemeSettings
} from '@/libs/site-theme-types'
import { getDb } from '@/libs/mongo'

const KEY = 'default'

const cleanText = (value: unknown, max: number) => String(value || '').trim().slice(0, max)

const cleanColor = (value: unknown, fallback: string) => {
  const raw = String(value || '').trim()

  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(raw)) return raw.toLowerCase()

  return fallback
}

const cleanFontId = (value: unknown, list: { id: string }[], fallback: string) => {
  const id = String(value || '').trim()

  return list.some(item => item.id === id) ? id : fallback
}

export const normalizeSiteTheme = (input: Partial<SiteThemeSettings> = {}): SiteThemeSettings => {
  const fallback = defaultSiteThemeSettings()

  return {
    logoUrl: cleanText(input.logoUrl, 400) || fallback.logoUrl,
    logoAlt: cleanText(input.logoAlt, 120) || fallback.logoAlt,
    logoHeight: Math.max(40, Math.min(160, Number(input.logoHeight || fallback.logoHeight) || fallback.logoHeight)),
    bg: cleanColor(input.bg, fallback.bg),
    paper: cleanColor(input.paper, fallback.paper),
    ink: cleanColor(input.ink, fallback.ink),
    muted: cleanColor(input.muted, fallback.muted),
    accent: cleanColor(input.accent, fallback.accent),
    purple: cleanColor(input.purple, fallback.purple),
    gold: cleanColor(input.gold, fallback.gold),
    headingFont: cleanFontId(input.headingFont, THEME_SERIF_FONTS, fallback.headingFont),
    bodyFont: cleanFontId(input.bodyFont, THEME_SANS_FONTS, fallback.bodyFont),
    buttonRadius: Math.max(0, Math.min(28, Number(input.buttonRadius ?? fallback.buttonRadius) || 0)),
    cardRadius: Math.max(0, Math.min(32, Number(input.cardRadius ?? fallback.cardRadius) || 0))
  }
}

export const getSiteThemeSettings = async (): Promise<SiteThemeSettings> => {
  try {
    const db = await getDb()
    const doc = await db.collection<{ key: string } & SiteThemeSettings>('SiteTheme').findOne({ key: KEY })

    return normalizeSiteTheme(doc || {})
  } catch {
    return defaultSiteThemeSettings()
  }
}

export const saveSiteThemeSettings = async (input: Partial<SiteThemeSettings>) => {
  const db = await getDb()
  const data = normalizeSiteTheme(input)
  const now = new Date()

  await db.collection('SiteTheme').updateOne(
    { key: KEY },
    { $set: { ...data, key: KEY, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}
