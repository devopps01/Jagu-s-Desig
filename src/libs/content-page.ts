import {
  createContentAction,
  createContentBlock,
  defaultContentPage,
  type ContentAction,
  type ContentBlock,
  type ContentPageSettings
} from '@/libs/site-pages'
import { getDb } from '@/libs/mongo'

const cleanBlock = (input: Partial<ContentBlock>, index: number): ContentBlock => ({
  id: String(input.id || `block-${index + 1}`),
  enabled: input.enabled !== false,
  title: String(input.title || `Section ${index + 1}`),
  paragraphs: String(input.paragraphs || ''),
  list: String(input.list || '')
})

const cleanAction = (input: Partial<ContentAction>, index: number): ContentAction => ({
  id: String(input.id || `action-${index + 1}`),
  enabled: input.enabled !== false,
  label: String(input.label || 'Learn more'),
  href: String(input.href || '/'),
  style: input.style === 'outline' ? 'outline' : 'solid'
})

export const normalizeContentPage = (page: string, input?: Partial<ContentPageSettings> | null): ContentPageSettings => {
  const fallback = defaultContentPage(page)

  return {
    page,
    kicker: String(input?.kicker ?? fallback.kicker),
    title: String(input?.title ?? fallback.title),
    intro: String(input?.intro ?? fallback.intro),
    showBanner: Boolean(input?.showBanner ?? fallback.showBanner),
    bannerImage: String(input?.bannerImage ?? fallback.bannerImage),
    bannerImageMobile: String(input?.bannerImageMobile ?? fallback.bannerImageMobile),
    bannerKicker: String(input?.bannerKicker ?? fallback.bannerKicker),
    bannerTitle: String(input?.bannerTitle ?? fallback.bannerTitle),
    bannerText: String(input?.bannerText ?? fallback.bannerText),
    bannerButtonLabel: String(input?.bannerButtonLabel ?? fallback.bannerButtonLabel),
    bannerButtonHref: String(input?.bannerButtonHref ?? fallback.bannerButtonHref),
    blocks: Array.isArray(input?.blocks) ? input.blocks.map((row, index) => cleanBlock(row, index)) : fallback.blocks,
    actions: Array.isArray(input?.actions) ? input.actions.map((row, index) => cleanAction(row, index)) : fallback.actions,
    footerNote: String(input?.footerNote ?? fallback.footerNote)
  }
}

export const getContentPageSettings = async (page: string) => {
  const key = String(page || '').trim() || 'about'

  try {
    const db = await getDb()
    const doc = await db.collection<ContentPageSettings & { key: string }>('ContentPage').findOne({ key })

    return normalizeContentPage(key, doc)
  } catch {
    return defaultContentPage(key)
  }
}

export const saveContentPageSettings = async (page: string, input: Partial<ContentPageSettings>) => {
  const key = String(page || '').trim() || 'about'
  const data = normalizeContentPage(key, input)
  const db = await getDb()
  const now = new Date()

  await db.collection('ContentPage').updateOne(
    { key },
    { $set: { ...data, key, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}

export { createContentBlock, createContentAction }
