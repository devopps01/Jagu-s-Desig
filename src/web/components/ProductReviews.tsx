'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useLoginModal } from '@web/context/LoginModalContext'

const MAX_PHOTOS = 4

type Review = {
  id: string
  userName: string
  userEmail: string
  rating: number
  title: string
  body: string
  images?: string[]
  verifiedPurchase?: boolean
  createdAt: string
  status: string
}

type Summary = {
  average: number
  count: number
  stars: Record<1 | 2 | 3 | 4 | 5, number>
}

const StarRow = ({
  value,
  onChange,
  size = 'md'
}: {
  value: number
  onChange?: (next: number) => void
  size?: 'sm' | 'md'
}) => (
  <div className={`vn-stars${size === 'sm' ? ' is-sm' : ''}${onChange ? ' is-pick' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map(star =>
      onChange ? (
        <button key={star} type='button' className={star <= value ? 'is-on' : ''} aria-label={`${star} star`} onClick={() => onChange(star)}>
          ★
        </button>
      ) : (
        <span key={star} className={star <= Math.round(value) ? 'is-on' : ''}>
          ★
        </span>
      )
    )}
  </div>
)

const ProductReviews = ({ slug, onSummary }: { slug: string; onSummary?: (average: number, count: number) => void }) => {
  const { user, openLogin } = useLoginModal()
  const pendingOpen = useRef(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [summary, setSummary] = useState<Summary>({ average: 0, count: 0, stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [reviews, setReviews] = useState<Review[]>([])
  const [mine, setMine] = useState<Review | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [keptImages, setKeptImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [lightbox, setLightbox] = useState('')

  const load = async () => {
    const res = await fetch(`/api/web/reviews?slug=${encodeURIComponent(slug)}`)
    const json = await res.json()

    if (!res.ok) return

    setSummary(json.summary)
    setReviews(Array.isArray(json.reviews) ? json.reviews : [])
    setMine(json.mine || null)
    onSummary?.(json.summary.average, json.summary.count)
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user?.id])

  useEffect(() => {
    if (user && pendingOpen.current) {
      pendingOpen.current = false
      openForm()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const openForm = () => {
    setError('')
    setOk('')
    setRating(mine?.rating || 5)
    setBody(mine?.body || '')
    setName(mine?.userName || user?.email.split('@')[0] || '')
    setKeptImages(mine?.images || [])
    setFiles([])
    setOpen(true)
  }

  const closeForm = () => {
    setOpen(false)
    setFiles([])
    setError('')
  }

  const startReview = () => {
    if (!user) {
      pendingOpen.current = true
      openLogin()

      return
    }

    openForm()
  }

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return

    const room = MAX_PHOTOS - keptImages.length - files.length
    const next = [...files]

    for (const file of Array.from(list)) {
      if (next.length >= files.length + room) break
      if (!file.type.startsWith('image/')) continue
      next.push(file)
    }

    setFiles(next.slice(0, MAX_PHOTOS - keptImages.length))
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    setError('')
    setOk('')
    setSaving(true)

    const form = new FormData()

    form.set('slug', slug)
    form.set('rating', String(rating))
    form.set('body', body)
    form.set('name', name)
    form.set('title', '')
    form.set('keptImages', JSON.stringify(keptImages))
    files.forEach(file => form.append('photos', file))

    const res = await fetch('/api/web/reviews', { method: 'POST', body: form })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save review')

      return
    }

    setSummary(json.summary)
    setReviews(Array.isArray(json.reviews) ? json.reviews : [])
    setMine(json.mine || null)
    onSummary?.(json.summary.average, json.summary.count)
    setOk(mine ? 'Your review was updated.' : 'Thank you. Your review is live.')
    setFiles([])
    setKeptImages(json.mine?.images || keptImages)
    window.setTimeout(() => closeForm(), 700)
  }

  const maxBar = Math.max(1, ...Object.values(summary.stars))
  const photoCount = keptImages.length + files.length
  const filePreviews = useMemo(
    () => files.map((file, index) => ({ key: `${file.name}-${file.size}-${index}`, src: URL.createObjectURL(file) })),
    [files]
  )

  useEffect(
    () => () => {
      filePreviews.forEach(item => URL.revokeObjectURL(item.src))
    },
    [filePreviews]
  )

  const previews = [
    ...keptImages.map(src => ({ key: src, src, stored: true as const })),
    ...filePreviews.map(item => ({ ...item, stored: false as const }))
  ]

  return (
    <section className='vn-reviews'>
      <div className='vn-reviews-head'>
        <div>
          <h2>Reviews & ratings</h2>
          <div className='vn-reviews-score'>
            <strong>{summary.count ? summary.average.toFixed(1) : '—'}</strong>
            <div>
              <StarRow value={summary.average} />
              <p>{summary.count ? `${summary.count} ${summary.count === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}</p>
            </div>
          </div>
        </div>
        <div className='vn-review-bars'>
          {([5, 4, 3, 2, 1] as const).map(star => (
            <div key={star}>
              <span>{star} star</span>
              <i>
                <b style={{ width: `${(summary.stars[star] / maxBar) * 100}%` }} />
              </i>
              <em>{summary.stars[star]}</em>
            </div>
          ))}
        </div>
        <div className='vn-reviews-head-actions'>
          <button className='vn-btn vn-btn-solid' type='button' onClick={startReview}>
            {mine ? 'Update review' : 'Add review'}
          </button>
        </div>
      </div>

      <div className='vn-review-grid'>
        {reviews.length ? (
          reviews.map(item => (
            <article key={item.id} className='vn-review-card'>
              {item.images?.length ? (
                <div className={`vn-review-card-photos count-${Math.min(item.images.length, 4)}`}>
                  {item.images.slice(0, 4).map(src => (
                    <button key={src} type='button' onClick={() => setLightbox(src)} aria-label='View review photo'>
                      <img src={src} alt='' />
                    </button>
                  ))}
                </div>
              ) : null}
              <div className='vn-review-meta'>
                <b className='vn-review-avatar'>{(item.userName || 'C').slice(0, 1).toUpperCase()}</b>
                <strong>{item.userName}</strong>
                <StarRow value={item.rating} size='sm' />
                <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                {item.verifiedPurchase ? <em className='vn-review-verified'>Verified purchase</em> : null}
              </div>
              {item.title ? <h4>{item.title}</h4> : null}
              <p>{item.body}</p>
            </article>
          ))
        ) : (
          <p className='vn-review-empty'>Be the first to review this piece. Add a rating, photos and your notes.</p>
        )}
      </div>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className='vn-modal-backdrop' onClick={closeForm}>
              <div className='vn-modal is-review' onClick={event => event.stopPropagation()} role='dialog' aria-modal='true' aria-labelledby='vn-review-title'>
                <div className='vn-modal-head'>
                  <h2 id='vn-review-title'>{mine ? 'Update your review' : 'Write a review'}</h2>
                  <button className='vn-icon-btn' type='button' onClick={closeForm} aria-label='Close'>
                    <i className='tabler-x' />
                  </button>
                </div>
                <p>Rate the piece and add photos of the fit, fabric and look.</p>
                <form
                  className='vn-form'
                  onSubmit={event => {
                    event.preventDefault()
                    void submit()
                  }}
                >
                  <label className='vn-field'>
                    <span>Your rating</span>
                    <StarRow value={rating} onChange={setRating} />
                  </label>
                  <label className='vn-field'>
                    <span>Name</span>
                    <input value={name} onChange={event => setName(event.target.value)} required placeholder='Your name' />
                  </label>
                  <label className='vn-field'>
                    <span>Your review</span>
                    <textarea required rows={4} value={body} onChange={event => setBody(event.target.value)} placeholder='How was the fit, fabric and look?' />
                  </label>
                  <div className='vn-field'>
                    <span>Photos {photoCount ? `(${photoCount}/${MAX_PHOTOS})` : ''}</span>
                    <div className='vn-review-upload'>
                      {previews.map(item => (
                        <div key={item.key} className='vn-review-thumb'>
                          <img src={item.src} alt='' />
                          <button
                            type='button'
                            aria-label='Remove photo'
                            onClick={() => {
                              if (item.stored) setKeptImages(current => current.filter(src => src !== item.src))
                              else setFiles(current => current.filter((_, index) => `${current[index].name}-${current[index].size}-${index}` !== item.key))
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {photoCount < MAX_PHOTOS ? (
                        <label className='vn-review-add-photo'>
                          <input ref={fileRef} type='file' accept='image/jpeg,image/png,image/webp' multiple onChange={event => addFiles(event.target.files)} />
                          <i className='tabler-camera' />
                          Add photos
                        </label>
                      ) : null}
                    </div>
                    <em className='vn-review-upload-note'>JPG, PNG or WEBP. Up to 4 photos, 4 MB each.</em>
                  </div>
                  {error ? <p className='vn-checkout-error'>{error}</p> : null}
                  {ok ? <p className='vn-checkout-ok'>{ok}</p> : null}
                  <button className='vn-btn vn-btn-solid vn-review-submit' type='submit' disabled={saving}>
                    {saving ? 'Saving…' : mine ? 'Save review' : 'Post review'}
                  </button>
                </form>
              </div>
            </div>,
            document.body
          )
        : null}

      {lightbox && typeof document !== 'undefined'
        ? createPortal(
            <div className='vn-modal-backdrop is-lightbox' onClick={() => setLightbox('')}>
              <img src={lightbox} alt='' onClick={event => event.stopPropagation()} />
              <button className='vn-icon-btn' type='button' onClick={() => setLightbox('')} aria-label='Close'>
                <i className='tabler-x' />
              </button>
            </div>,
            document.body
          )
        : null}
    </section>
  )
}

export default ProductReviews

export const ProductRatingBadge = ({ rating, reviews, google }: { rating: number; reviews: number; google?: boolean }) => (
  <a className='vn-rating-badge' href={google ? '#google-reviews' : '#reviews'}>
    <StarRow value={rating} size='sm' />
    <span>
      {reviews
        ? `${google ? 'Google ' : ''}${rating.toFixed(1)} · ${reviews} ${reviews === 1 ? 'review' : 'reviews'}`
        : 'Write a review'}
    </span>
  </a>
)
