import {
  defaultGoogleReviewSettings,
  type GoogleReviewPublic,
  type GoogleReviewQuote,
  type GoogleReviewSettings
} from '@/libs/google-reviews-types'
import { SURAT_ATELIER } from '@/libs/contact-types'
import { getDb } from '@/libs/mongo'

const SETTINGS_KEY = 'default'
const CACHE_MS = 6 * 60 * 60 * 1000

type GoogleReviewDoc = GoogleReviewSettings & {
  key: string
  placeName: string
  rating: number
  userRatingsTotal: number
  mapsUrl: string
  fetchedAt: Date | null
  lastError: string
  reviews: GoogleReviewQuote[]
  updatedAt: Date
}

const clean = (value: unknown, max: number) => String(value || '').trim().slice(0, max)

export const extractPlaceId = (value: string) => {
  const raw = clean(value, 400)

  if (!raw) return ''

  try {
    const url = new URL(raw)
    const fromQuery = url.searchParams.get('place_id') || url.searchParams.get('query_place_id')

    if (fromQuery) return fromQuery

    const match = raw.match(/place_id:([^&]+)/i)

    if (match?.[1]) return decodeURIComponent(match[1])
  } catch {
    /* pasted id, not a URL */
  }

  return raw
}

const normalizeSettings = (input: Partial<GoogleReviewSettings> = {}): GoogleReviewSettings => ({
  enabled: input.enabled === undefined ? defaultGoogleReviewSettings.enabled : Boolean(input.enabled),
  placeId: extractPlaceId(input.placeId || ''),
  apiKey: clean(input.apiKey, 200),
  showOnHome: input.showOnHome !== false,
  showOnProducts: input.showOnProducts !== false,
  applyToProducts: input.applyToProducts !== false
})

const emptyDoc = (): Omit<GoogleReviewDoc, 'key' | 'updatedAt'> => ({
  ...defaultGoogleReviewSettings,
  placeName: '',
  rating: 0,
  userRatingsTotal: 0,
  mapsUrl: '',
  fetchedAt: null,
  lastError: '',
  reviews: []
})

const mapsSearchUrl = (query: string, placeId = '') =>
  placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&query_place_id=${placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const mapsEmbedSrc = () =>
  `https://maps.google.com/maps?q=${SURAT_ATELIER.lat},${SURAT_ATELIER.lng}&z=16&hl=en&output=embed`

const mapPublic = (doc: Partial<GoogleReviewDoc>): GoogleReviewPublic => {
  const placeId = extractPlaceId(doc.placeId || '')
  const query = SURAT_ATELIER.full
  const mapsUrl = doc.mapsUrl || mapsSearchUrl(query, placeId)

  return {
    enabled: doc.enabled !== false,
    showOnHome: doc.showOnHome !== false,
    showOnProducts: doc.showOnProducts !== false,
    applyToProducts: doc.applyToProducts !== false,
    placeName: doc.placeName || SURAT_ATELIER.name,
    address: SURAT_ATELIER.full,
    rating: Number(doc.rating) || 0,
    userRatingsTotal: Number(doc.userRatingsTotal) || 0,
    mapsUrl,
    mapsEmbedUrl: mapsEmbedSrc(),
    writeReviewUrl: placeId
      ? `https://search.google.com/local/writereview?placeid=${placeId}`
      : mapsUrl,
    hasPlaceId: Boolean(placeId),
    fetchedAt: doc.fetchedAt ? new Date(doc.fetchedAt).toISOString() : null,
    reviews: Array.isArray(doc.reviews) ? doc.reviews : []
  }
}

const getDoc = async () => {
  const db = await getDb()
  const doc = await db.collection<GoogleReviewDoc>('GoogleReviewSettings').findOne({ key: SETTINGS_KEY })

  return doc
}

export const getGoogleReviewSettings = async () => {
  const doc = await getDoc()
  const settings = normalizeSettings(doc || {})

  if (!settings.apiKey && process.env.GOOGLE_PLACES_API_KEY) {
    settings.apiKey = process.env.GOOGLE_PLACES_API_KEY
  }

  return {
    ...settings,
    placeName: doc?.placeName || '',
    rating: doc?.rating || 0,
    userRatingsTotal: doc?.userRatingsTotal || 0,
    mapsUrl: doc?.mapsUrl || '',
    fetchedAt: doc?.fetchedAt ? new Date(doc.fetchedAt).toISOString() : null,
    lastError: doc?.lastError || '',
    reviews: doc?.reviews || []
  }
}

export const saveGoogleReviewSettings = async (input: Partial<GoogleReviewSettings>) => {
  const db = await getDb()
  const current = await getGoogleReviewSettings()
  const next = normalizeSettings({
    ...current,
    ...input,
    apiKey: input.apiKey === undefined ? current.apiKey : input.apiKey
  })

  await db.collection('GoogleReviewSettings').updateOne(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        ...next,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  )

  return getGoogleReviewSettings()
}

export const refreshGoogleReviews = async (force = false) => {
  const current = await getGoogleReviewSettings()

  if (!current.placeId) throw new Error('Add your Google Place ID first')

  const apiKey = current.apiKey || process.env.GOOGLE_PLACES_API_KEY || ''

  if (!apiKey) throw new Error('Add a Google Places API key in this page or in GOOGLE_PLACES_API_KEY')

  const fetchedAt = current.fetchedAt ? new Date(current.fetchedAt).getTime() : 0

  if (!force && fetchedAt && Date.now() - fetchedAt < CACHE_MS && current.reviews.length) {
    return getGoogleReviewSettings()
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')

  url.searchParams.set('place_id', current.placeId)
  url.searchParams.set('fields', 'name,rating,user_ratings_total,url,reviews')
  url.searchParams.set('reviews_sort', 'newest')
  url.searchParams.set('key', apiKey)

  const res = await fetch(url.toString(), { cache: 'no-store' })
  const json = (await res.json()) as {
    status?: string
    error_message?: string
    result?: {
      name?: string
      rating?: number
      user_ratings_total?: number
      url?: string
      reviews?: {
        author_name?: string
        rating?: number
        text?: string
        relative_time_description?: string
        profile_photo_url?: string
      }[]
    }
  }

  if (json.status && json.status !== 'OK') {
    const message = json.error_message || `Google Places error: ${json.status}`
    const db = await getDb()

    await db.collection('GoogleReviewSettings').updateOne(
      { key: SETTINGS_KEY },
      { $set: { lastError: message, updatedAt: new Date() } },
      { upsert: true }
    )

    throw new Error(message)
  }

  const result = json.result || {}
  const reviews: GoogleReviewQuote[] = (result.reviews || []).slice(0, 5).map(item => ({
    authorName: clean(item.author_name, 80) || 'Google user',
    rating: Math.min(5, Math.max(1, Number(item.rating) || 5)),
    text: clean(item.text, 600),
    relativeTime: clean(item.relative_time_description, 80),
    profilePhotoUrl: clean(item.profile_photo_url, 400)
  }))

  const db = await getDb()
  const now = new Date()

  await db.collection('GoogleReviewSettings').updateOne(
    { key: SETTINGS_KEY },
    {
      $set: {
        key: SETTINGS_KEY,
        placeName: clean(result.name, 120) || "Jagu's Designing",
        rating: Number(result.rating) || 0,
        userRatingsTotal: Number(result.user_ratings_total) || reviews.length,
        mapsUrl: clean(result.url, 400),
        reviews,
        fetchedAt: now,
        lastError: '',
        updatedAt: now
      }
    },
    { upsert: true }
  )

  return getGoogleReviewSettings()
}

export const getGoogleReviewPublic = async (): Promise<GoogleReviewPublic> => {
  const current = await getGoogleReviewSettings()

  if (current.enabled && current.placeId && current.apiKey) {
    try {
      await refreshGoogleReviews(false)
    } catch {
      /* keep last cached reviews */
    }
  }

  const fresh = await getDoc()

  return mapPublic({ ...emptyDoc(), ...fresh, ...normalizeSettings(fresh || current) })
}

export const applyGoogleRatingToProducts = async <T extends { rating: number; reviews: number }>(products: T[]) => {
  const google = await getGoogleReviewPublic()

  if (!google.enabled || !google.applyToProducts || !google.rating || !google.userRatingsTotal) {
    return products
  }

  return products.map(item =>
    item.reviews > 0
      ? item
      : {
          ...item,
          rating: google.rating,
          reviews: google.userRatingsTotal,
          googleReviews: true
        }
  )
}

export const applyGoogleRatingToProduct = async <T extends { rating: number; reviews: number }>(product: T | null) => {
  if (!product) return product

  const [next] = await applyGoogleRatingToProducts([product])

  return next
}
