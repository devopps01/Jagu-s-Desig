'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useLoginModal } from '@web/context/LoginModalContext'

const MAX_PHOTOS = 4

type InitialReview = {
  rating?: number
  title?: string
  body?: string
  userName?: string
  images?: string[]
}

const StarRow = ({ value, onChange }: { value: number; onChange: (next: number) => void }) => (
  <div className='vn-stars is-pick' role='radiogroup' aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map(star => (
      <button key={star} type='button' className={star <= value ? 'is-on' : ''} aria-label={`${star} star`} onClick={() => onChange(star)}>
        ★
      </button>
    ))}
  </div>
)

const ReviewWriteModal = ({
  open,
  slug,
  productTitle,
  orderId,
  orderNo,
  initial,
  onClose,
  onSaved
}: {
  open: boolean
  slug: string
  productTitle?: string
  orderId?: string
  orderNo?: string
  initial?: InitialReview | null
  onClose: () => void
  onSaved?: () => void
}) => {
  const { user, openLogin } = useLoginModal()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [rating, setRating] = useState(5)
  const [keptImages, setKeptImages] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (!open) return

    if (!user) {
      openLogin()
      onClose()

      return
    }

    let cancelled = false

    const hydrate = async () => {
      setError('')
      setOk('')
      setFiles([])

      let seed: InitialReview | null = initial || null

      if (!seed) {
        try {
          const res = await fetch(`/api/web/reviews?slug=${encodeURIComponent(slug)}`)
          const json = await res.json()

          if (res.ok && json.mine) seed = json.mine
        } catch {
          seed = null
        }
      }

      if (cancelled) return

      setRating(seed?.rating || 5)
      setBody(seed?.body || '')
      setName(seed?.userName || user.email.split('@')[0] || '')
      setKeptImages(seed?.images || [])
      setEditing(Boolean(seed?.body || seed?.rating))
    }

    void hydrate()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate only when dialog opens for a product/order
  }, [open, slug, orderId, user?.id, user?.email])

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
    if (orderId) form.set('orderId', orderId)
    files.forEach(file => form.append('photos', file))

    const res = await fetch('/api/web/reviews', { method: 'POST', body: form })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save review')

      return
    }

    setOk(editing ? 'Your review was updated.' : 'Thank you. Your review is live.')
    setKeptImages(json.mine?.images || keptImages)
    setFiles([])
    setEditing(true)
    onSaved?.()
    window.setTimeout(() => onClose(), 700)
  }

  if (!open || typeof document === 'undefined') return null

  const photoCount = keptImages.length + files.length

  return createPortal(
    <div className='vn-modal-backdrop' onClick={onClose}>
      <div className='vn-modal is-review' onClick={event => event.stopPropagation()} role='dialog' aria-modal='true' aria-labelledby='vn-order-review-title'>
        <div className='vn-modal-head'>
          <h2 id='vn-order-review-title'>{editing ? 'Update your review' : 'Write a review'}</h2>
          <button className='vn-icon-btn' type='button' onClick={onClose} aria-label='Close'>
            <i className='tabler-x' />
          </button>
        </div>
        <p>
          {productTitle ? <strong>{productTitle}</strong> : 'This piece'}
          {orderNo ? ` · Order ${orderNo}` : ''}
          {orderId ? ' · Verified purchase' : ''}
        </p>
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
          <div className='vn-modal-actions'>
            <button className='vn-btn vn-btn-outline' type='button' onClick={onClose}>
              Cancel
            </button>
            <button className='vn-btn vn-btn-solid vn-review-submit' type='submit' disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Update review' : 'Submit review'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default ReviewWriteModal
