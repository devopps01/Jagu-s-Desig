export type GoogleReviewQuote = {
  authorName: string
  rating: number
  text: string
  relativeTime: string
  profilePhotoUrl: string
}

export type GoogleReviewSettings = {
  enabled: boolean
  placeId: string
  apiKey: string
  showOnHome: boolean
  showOnProducts: boolean
  applyToProducts: boolean
}

export type GoogleReviewPublic = {
  enabled: boolean
  showOnHome: boolean
  showOnProducts: boolean
  applyToProducts: boolean
  placeName: string
  address: string
  rating: number
  userRatingsTotal: number
  mapsUrl: string
  mapsEmbedUrl: string
  writeReviewUrl: string
  hasPlaceId: boolean
  fetchedAt: string | null
  reviews: GoogleReviewQuote[]
}

export const defaultGoogleReviewSettings: GoogleReviewSettings = {
  enabled: true,
  placeId: '',
  apiKey: '',
  showOnHome: true,
  showOnProducts: true,
  applyToProducts: true
}
