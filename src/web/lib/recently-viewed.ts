const KEY = 'jagu-recently-viewed'

export const rememberViewed = (slug: string) => {
  if (typeof window === 'undefined' || !slug) return

  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '[]') as string[]
    const next = [slug, ...current.filter(item => item !== slug)].slice(0, 12)

    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    localStorage.setItem(KEY, JSON.stringify([slug]))
  }
}

export const getViewedSlugs = (exclude?: string) => {
  if (typeof window === 'undefined') return [] as string[]

  try {
    const current = JSON.parse(localStorage.getItem(KEY) || '[]') as string[]

    return current.filter(item => item && item !== exclude).slice(0, 12)
  } catch {
    return []
  }
}
