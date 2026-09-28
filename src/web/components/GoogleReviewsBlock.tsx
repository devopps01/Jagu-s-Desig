'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import type { GoogleReviewPublic } from '@/libs/google-reviews-types'
import { SURAT_ATELIER } from '@/libs/contact-types'

const fallback: GoogleReviewPublic = {
  enabled: true,
  showOnHome: true,
  showOnProducts: true,
  applyToProducts: true,
  placeName: SURAT_ATELIER.name,
  address: SURAT_ATELIER.full,
  rating: 0,
  userRatingsTotal: 0,
  mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SURAT_ATELIER.full)}`,
  mapsEmbedUrl: `https://maps.google.com/maps?q=${SURAT_ATELIER.lat},${SURAT_ATELIER.lng}&z=16&hl=en&output=embed`,
  writeReviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SURAT_ATELIER.full)}`,
  hasPlaceId: false,
  fetchedAt: null,
  reviews: []
}

const StarRow = ({ value }: { value: number }) => (
  <span className='vn-stars is-sm' aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map(star => (
      <span key={star} className={star <= Math.round(value) ? 'is-on' : ''}>
        ★
      </span>
    ))}
  </span>
)

const GoogleReviewsBlock = ({ variant = 'home' }: { variant?: 'home' | 'product' }) => {
  const [data, setData] = useState<GoogleReviewPublic>(fallback)

  useEffect(() => {
    fetch('/api/web/google-reviews')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json && json.enabled !== false) setData({ ...fallback, ...json })
      })
      .catch(() => null)
  }, [])

  if (variant === 'product' && data.showOnProducts === false) return null

  return (
    <section className={`vn-google-reviews${variant === 'product' ? ' is-product' : ''}`} id='google-reviews'>
      <div className='vn-google-reviews-head'>
        <p className='vn-hero-kicker'>
          <i className='tabler-brand-google' /> Google reviews
        </p>
        <h2>{data.placeName || "Jagu's Designing"}</h2>
        <div className='vn-google-score'>
          {data.rating ? <strong>{data.rating.toFixed(1)}</strong> : null}
          <div>
            <StarRow value={data.rating} />
            <p>
              {data.userRatingsTotal
                ? `${data.userRatingsTotal} Google ${data.userRatingsTotal === 1 ? 'review' : 'reviews'}`
                : 'Find us on Google Maps'}
            </p>
          </div>
        </div>
        <div className='vn-google-actions'>
          {data.mapsUrl ? (
            <Link className='vn-btn vn-btn-solid' href={data.mapsUrl} target='_blank' rel='noreferrer'>
              See on Google
            </Link>
          ) : null}
          {data.writeReviewUrl ? (
            <Link className='vn-btn vn-btn-outline' href={data.writeReviewUrl} target='_blank' rel='noreferrer'>
              Write a Google review
            </Link>
          ) : null}
        </div>
      </div>
      {data.reviews?.length ? (
        <div className='vn-google-review-grid'>
          {data.reviews.map(item => (
            <article key={`${item.authorName}-${item.relativeTime}-${item.text.slice(0, 12)}`}>
              <header>
                {item.profilePhotoUrl ? <img src={item.profilePhotoUrl} alt='' /> : <i className='tabler-brand-google' />}
                <div>
                  <strong>{item.authorName}</strong>
                  <span>
                    <StarRow value={item.rating} /> {item.relativeTime}
                  </span>
                </div>
              </header>
              {item.text ? <p>{item.text}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
      {data.mapsEmbedUrl ? (
        <div className='vn-google-map'>
          <iframe
            className='vn-google-embed'
            title={`${data.placeName} on Google Maps`}
            src={data.mapsEmbedUrl}
            loading='lazy'
            allowFullScreen
            referrerPolicy='no-referrer-when-downgrade'
          />
          <div className='vn-google-map-card'>
            <h3>{data.placeName}</h3>
            <p>{data.address}</p>
            <Link className='vn-btn vn-btn-solid' href={data.mapsUrl} target='_blank' rel='noreferrer'>
              Open in Google Maps
            </Link>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default GoogleReviewsBlock
