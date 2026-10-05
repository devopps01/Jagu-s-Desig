import {
  defaultFanItems,
  defaultFestivityItems,
  defaultHomePageSettings,
  defaultNavratriItems,
  type HomeItem,
  type HomePageSettings,
  type HomeSection
} from '@/libs/home-types'
import { getDb } from '@/libs/mongo'

const blankItem = (): HomeItem => ({
  id: '',
  enabled: true,
  showKicker: false,
  kicker: '',
  showTitle: true,
  title: '',
  showText: false,
  text: '',
  showButton: false,
  buttonLabel: '',
  href: '',
  showSecondButton: false,
  secondLabel: '',
  secondHref: '',
  image: '',
  imageMobile: '',
  icon: 'tabler-sparkles'
})

const cleanItem = (input: Partial<HomeItem>, index: number): HomeItem => ({
  ...blankItem(),
  ...input,
  id: String(input.id || `item-${index + 1}`),
  title: String(input.title || ''),
  text: String(input.text || ''),
  href: String(input.href || ''),
  image: String(input.image || ''),
  imageMobile: String(input.imageMobile || ''),
  icon: String(input.icon || 'tabler-sparkles'),
  buttonLabel: String(input.buttonLabel || ''),
  kicker: String(input.kicker || ''),
  secondLabel: String(input.secondLabel || ''),
  secondHref: String(input.secondHref || ''),
  enabled: input.enabled !== false,
  showTitle: input.showTitle !== false,
  showText: Boolean(input.showText),
  showButton: Boolean(input.showButton),
  showKicker: Boolean(input.showKicker),
  showSecondButton: Boolean(input.showSecondButton)
})

const cleanSection = (input: Partial<HomeSection>, fallback: HomeSection): HomeSection => {
  const type = input.type || fallback.type
  const textRaw = String(input.text ?? fallback.text ?? '')
  const buttonRaw = String(input.buttonLabel ?? fallback.buttonLabel ?? '')

  // Navratri uses text/buttonLabel as the “more looks” header — fill defaults when still blank/generic.
  const text =
    type === 'navratri' && !textRaw.trim()
      ? String(fallback.text || 'Beyond the garba circle')
      : textRaw
  const buttonLabel =
    type === 'navratri' && (!buttonRaw.trim() || buttonRaw === 'View all')
      ? String(fallback.buttonLabel || 'Wedding, engagement and after-aarti looks')
      : buttonRaw

  return {
    ...fallback,
    ...input,
    id: String(input.id || fallback.id),
    type,
    title: String(input.title ?? fallback.title),
    note: String(input.note ?? fallback.note),
    text,
    image: String(input.image ?? fallback.image),
    imageMobile: String(input.imageMobile ?? fallback.imageMobile ?? ''),
    href: String(input.href ?? fallback.href),
    buttonLabel,
    filterSlug: String(input.filterSlug || fallback.filterSlug || 'latest'),
    productMode: input.productMode === 'selected' ? 'selected' : 'filter',
    layout: input.layout === 'grid' || input.layout === 'occasions' || input.layout === 'looks' ? input.layout : fallback.layout,
    limit: Math.max(1, Math.min(24, Number(input.limit || fallback.limit || 8))),
    productSlugs: Array.isArray(input.productSlugs) ? input.productSlugs.map(String).filter(Boolean) : fallback.productSlugs,
    enabled: input.enabled !== false,
    showTitle: input.showTitle !== false,
    showNote: input.showNote !== false,
    showButton: Boolean(input.showButton),
    showText: input.showText !== false,
    locked: Boolean(fallback.locked) || Boolean(input.locked),
    width: String(input.width ?? fallback.width ?? ''),
    height: String(input.height ?? fallback.height ?? ''),
    gap: String(input.gap ?? fallback.gap ?? ''),
    padding: String(input.padding ?? fallback.padding ?? ''),
    // Keep saved items. Seed festivities (and other defaulted sections) when the list is empty.
    items: (() => {
      if (Array.isArray(input.items) && input.items.length > 0) {
        return input.items.map((row, index) => cleanItem(row, index))
      }

      if (fallback.type === 'festivities') {
        return defaultFestivityItems()
      }

      if (fallback.type === 'fan') {
        return defaultFanItems()
      }

      if (fallback.type === 'navratri') {
        return defaultNavratriItems()
      }

      if (Array.isArray(fallback.items) && fallback.items.length > 0) {
        return fallback.items
      }

      return Array.isArray(input.items) ? input.items.map((row, index) => cleanItem(row, index)) : []
    })()
  }
}

export const normalizeHomePage = (input?: Partial<HomePageSettings> | null): HomePageSettings => {
  const defaults = defaultHomePageSettings()
  const incoming = Array.isArray(input?.sections) ? input.sections : []

  if (!incoming.length) return defaults

  const defaultById = new Map(defaults.sections.map(section => [section.id, section]))
  const used = new Set<string>()
  const sections: HomeSection[] = []

  incoming.forEach((section, index) => {
    if (!section?.id || used.has(section.id)) return

    used.add(section.id)
    const fallback = defaultById.get(section.id)

    if (fallback) {
      sections.push(cleanSection(section, fallback))

      return
    }

    const template = defaults.sections.find(item => item.type === section.type)

    if (!template) return

    sections.push(
      cleanSection(
        { ...section, locked: false },
        { ...template, id: section.id, locked: false, title: section.title || `Section ${index + 1}` }
      )
    )
  })

  defaults.sections.forEach(fallback => {
    if (used.has(fallback.id)) return
    sections.push(cleanSection({}, fallback))
  })

  // Keep Trending + Most Selling under Pre Wedding Festivities (for older saved home pages).
  const festIndex = sections.findIndex(section => section.id === 'festivities' || section.type === 'festivities')
  if (festIndex >= 0) {
    const orderedIds = ['trending', 'best-sellers'] as const
    const moved = orderedIds
      .map(id => {
        const index = sections.findIndex(section => section.id === id)
        if (index < 0) return null
        const [row] = sections.splice(index, 1)

        return row
      })
      .filter(Boolean) as HomeSection[]

    if (moved.length) {
      const nextFest = sections.findIndex(section => section.id === 'festivities' || section.type === 'festivities')
      sections.splice(nextFest + 1, 0, ...moved)
    }
  }

  return { sections }
}

export const getHomePageSettings = async () => {
  try {
    const db = await getDb()
    const doc = await db.collection<HomePageSettings & { key: string }>('HomePage').findOne({ key: 'default' })
    const normalized = normalizeHomePage(doc)
    const needsPersist = (['festivities', 'fan', 'navratri'] as const).some(type => {
      const seeded = normalized.sections.find(section => section.type === type)
      const stored = Array.isArray(doc?.sections)
        ? doc.sections.find(section => section?.type === type || section?.id === type)
        : null
      const storedEmpty = !stored || !Array.isArray(stored.items) || stored.items.length === 0
      const navHeaderStale =
        type === 'navratri' &&
        Boolean(seeded) &&
        (!String(stored?.text || '').trim() ||
          !String(stored?.buttonLabel || '').trim() ||
          stored?.buttonLabel === 'View all')

      return Boolean((seeded?.items?.length && storedEmpty) || navHeaderStale)
    })

    // Persist seeded cards so the admin editor shows name / image / link immediately.
    if (needsPersist) {
      await db.collection('HomePage').updateOne(
        { key: 'default' },
        {
          $set: {
            sections: normalized.sections,
            key: 'default',
            updatedAt: new Date()
          },
          $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
      )
    }

    return normalized
  } catch {
    return defaultHomePageSettings()
  }
}

export const saveHomePageSettings = async (input: Partial<HomePageSettings>) => {
  const data = normalizeHomePage(input)
  const db = await getDb()
  const now = new Date()

  await db.collection('HomePage').updateOne(
    { key: 'default' },
    { $set: { ...data, key: 'default', updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  )

  return data
}
