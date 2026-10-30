'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

import { RENT_SIZES } from '@/libs/rent-sizes'
import RentRangePicker from '@/rent/RentRangePicker'
import { AddressBook } from '@web/components/AddressBook'
import { useLoginModal } from '@web/context/LoginModalContext'
import { imageAttrs } from '@web/lib/image-src'
import { useRentWishlist } from '@/rent/RentWishlist'

type Booking = {
  id: string
  productName: string
  productSlug: string
  productImage: string
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  notes: string
  status: string
}

type Draft = {
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  notes: string
}

const canChange = (status: string) => status === 'booked' || status === 'ongoing'

const formatRentDate = (iso: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '')

  return match ? `${match[3]}-${match[2]}-${match[1]}` : iso
}

const formatRentWhen = (iso: string, time?: string) => {
  const date = formatRentDate(iso)

  return time ? `${date}, ${time}` : date
}

const RentAccount = () => {
  const params = useSearchParams()
  const tab = params.get('tab') === 'wishlist' ? 'wishlist' : params.get('tab') === 'profile' ? 'profile' : 'bookings'
  const { user, ready, openLogin } = useLoginModal()
  const { items, toggle } = useRentWishlist()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileNotice, setProfileNotice] = useState<{ text: string; ok: boolean } | null>(null)

  const loadBookings = () => {
    if (!user) return

    fetch('/api/rent/account')
      .then(res => (res.ok ? res.json() : null))
      .then(json => setBookings(Array.isArray(json?.bookings) ? json.bookings : []))
      .catch(() => setBookings([]))
  }

  useEffect(() => {
    loadBookings()

    if (!user) return

    fetch('/api/rent/account')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        const contact = json?.contact || {}

        setProfileName(String(contact.name || ''))
        setProfilePhone(String(contact.phone || ''))
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const saveProfile = async () => {
    setProfileSaving(true)
    setProfileNotice(null)

    try {
      const res = await fetch('/api/web/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      })
      const json = await res.json().catch(() => ({}))

      setProfileNotice({ text: json.message || (res.ok ? 'Profile saved' : 'Could not save your profile'), ok: res.ok })
    } catch {
      setProfileNotice({ text: 'Could not save your profile', ok: false })
    } finally {
      setProfileSaving(false)
    }
  }

  const openEdit = (booking: Booking) => {
    setNotice(null)
    setConfirmId(null)
    setEditingId(booking.id)
    setDraft({
      size: booking.size,
      startDate: booking.startDate,
      endDate: booking.endDate,
      startTime: booking.startTime || '10:00',
      endTime: booking.endTime || '18:00',
      customerName: booking.customerName || '',
      customerPhone: booking.customerPhone || '',
      notes: booking.notes || ''
    })
  }

  const saveEdit = async (id: string) => {
    if (!draft) return

    setBusyId(id)
    setNotice(null)

    try {
      const res = await fetch(`/api/rent/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setNotice({ text: json.message || 'Could not update this booking', ok: false })

        return
      }

      setEditingId(null)
      setDraft(null)
      setNotice({ text: 'Booking updated', ok: true })
      loadBookings()
    } catch {
      setNotice({ text: 'Could not update this booking', ok: false })
    } finally {
      setBusyId(null)
    }
  }

  const cancelBooking = async (id: string) => {
    setBusyId(id)
    setNotice(null)

    try {
      const res = await fetch(`/api/rent/bookings/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setNotice({ text: json.message || 'Could not cancel this booking', ok: false })

        return
      }

      setConfirmId(null)
      setEditingId(null)
      setDraft(null)
      setNotice({ text: 'Booking cancelled', ok: true })
      loadBookings()
    } catch {
      setNotice({ text: 'Could not cancel this booking', ok: false })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <section className='vn-section jr-account'>
      <div className='jr-hero'>
        <p className='vn-section-note'>Your rent account</p>
        <h1>{user ? 'My rentals' : 'Login to continue'}</h1>
        <div className='vn-rule' />
      </div>
      <div className='jr-tabs'>
        <Link className={tab === 'bookings' ? 'is-on' : ''} href='/rent/account'>
          Bookings
        </Link>
        <Link className={tab === 'wishlist' ? 'is-on' : ''} href='/rent/account?tab=wishlist'>
          Wishlist
        </Link>
        <Link className={tab === 'profile' ? 'is-on' : ''} href='/rent/account?tab=profile'>
          Profile
        </Link>
      </div>

      {tab === 'wishlist' ? (
        items.length ? (
          <div className='vn-grid'>
            {items.map(product => (
              <article key={product.slug} className='vn-card'>
                <Link href={`/rent/${product.slug}`} className='jr-card-link'>
                  <div className='jr-card-media'>
                    {product.image ? <img {...imageAttrs(product.image, 'card')} alt={product.title} /> : null}
                  </div>
                  <div className='jr-card-body'>
                    <h2>{product.title}</h2>
                  </div>
                </Link>
                <button className='jr-remove' type='button' onClick={() => toggle(product)}>
                  Remove
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className='jr-empty'>
            <p>Your rent wishlist is empty.</p>
            <Link className='vn-btn vn-btn-solid' href='/rent'>
              Browse outfits
            </Link>
          </div>
        )
      ) : null}

      {tab === 'bookings' ? (
        !ready ? (
          <p className='jr-note'>Loading…</p>
        ) : !user ? (
          <div className='jr-empty'>
            <p>Login to see outfits you requested.</p>
            <button className='vn-btn vn-btn-solid' type='button' onClick={openLogin}>
              Login
            </button>
          </div>
        ) : bookings.length ? (
          <div className='jr-bookings'>
            {notice ? <p className={notice.ok ? 'jr-note is-ok' : 'jr-note is-bad'}>{notice.text}</p> : null}
            {bookings.map(booking => {
              const editable = canChange(booking.status)
              const editing = editingId === booking.id && draft
              const outfitHref = booking.productSlug ? `/rent/${booking.productSlug}` : ''

              const outfit = (
                <>
                  <span className='jr-booking-photo'>
                    {booking.productImage ? <img src={booking.productImage} alt='' /> : null}
                  </span>
                  <span className='jr-booking-copy'>
                    <strong>{booking.productName}</strong>
                    <span className='jr-booking-meta'>Size {booking.size}</span>
                    <span className='jr-booking-meta'>From {formatRentWhen(booking.startDate, booking.startTime)}</span>
                    <span className='jr-booking-meta'>To {formatRentWhen(booking.endDate, booking.endTime)}</span>
                    <span className={`jr-status is-${booking.status}`}>{booking.status}</span>
                  </span>
                </>
              )

              return (
                <article key={booking.id}>
                  {outfitHref ? (
                    <Link href={outfitHref} className='jr-booking-open'>
                      {outfit}
                    </Link>
                  ) : (
                    <div className='jr-booking-open'>{outfit}</div>
                  )}
                  {editable ? (
                    <div className='jr-booking-actions'>
                      <button type='button' onClick={() => (editing ? setEditingId(null) : openEdit(booking))} disabled={busyId === booking.id}>
                        {editing ? 'Close' : 'Edit'}
                      </button>
                      <button type='button' className='is-cancel' onClick={() => setConfirmId(confirmId === booking.id ? null : booking.id)} disabled={busyId === booking.id}>
                        Cancel
                      </button>
                    </div>
                  ) : null}
                  {confirmId === booking.id ? (
                    <div className='jr-booking-confirm'>
                      <p>Cancel this rental? The dates will be free for someone else.</p>
                      <button type='button' className='is-cancel' disabled={busyId === booking.id} onClick={() => cancelBooking(booking.id)}>
                        {busyId === booking.id ? 'Cancelling…' : 'Yes, cancel'}
                      </button>
                      <button type='button' onClick={() => setConfirmId(null)} disabled={busyId === booking.id}>
                        Keep booking
                      </button>
                    </div>
                  ) : null}
                  {editing ? (
                    <form
                      className='jr-booking-edit'
                      onSubmit={event => {
                        event.preventDefault()
                        void saveEdit(booking.id)
                      }}
                    >
                        <label>
                          Size
                          <select value={draft.size} onChange={event => setDraft({ ...draft, size: event.target.value })}>
                            {RENT_SIZES.map(size => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </label>
                        <RentRangePicker
                          allowPast
                          startDate={draft.startDate}
                          endDate={draft.endDate}
                          startTime={draft.startTime}
                          endTime={draft.endTime}
                          onDates={(startDate, endDate) => setDraft({ ...draft, startDate, endDate })}
                          onTimes={(startTime, endTime) => setDraft({ ...draft, startTime, endTime })}
                        />
                        <label>
                          Name
                          <input value={draft.customerName} onChange={event => setDraft({ ...draft, customerName: event.target.value })} required />
                        </label>
                        <label>
                          Phone
                          <input value={draft.customerPhone} onChange={event => setDraft({ ...draft, customerPhone: event.target.value })} required />
                        </label>
                        <label>
                          Note
                          <textarea rows={2} value={draft.notes} onChange={event => setDraft({ ...draft, notes: event.target.value })} />
                        </label>
                        <button className='vn-btn vn-btn-solid' type='submit' disabled={busyId === booking.id}>
                          {busyId === booking.id ? 'Saving…' : 'Save changes'}
                        </button>
                      </form>
                  ) : null}
                </article>
              )
            })}
          </div>
        ) : (
          <div className='jr-empty'>
            <p>No rental requests yet for {user.email}.</p>
            <Link className='vn-btn vn-btn-solid' href='/rent'>
              Rent an outfit
            </Link>
          </div>
        )
      ) : null}

      {tab === 'profile' ? (
        user ? (
          <div className='jr-profile'>
            <form
              className='jr-profile-form'
              onSubmit={event => {
                event.preventDefault()
                void saveProfile()
              }}
            >
              <label>
                Name
                <input required value={profileName} onChange={event => setProfileName(event.target.value)} />
              </label>
              <label>
                Phone
                <input required value={profilePhone} onChange={event => setProfilePhone(event.target.value)} />
              </label>
              <label>
                Email
                <input value={user.email} readOnly />
              </label>
              {profileNotice ? <p className={profileNotice.ok ? 'jr-note is-ok' : 'jr-note is-bad'}>{profileNotice.text}</p> : null}
              <button className='vn-btn vn-btn-solid' type='submit' disabled={profileSaving}>
                {profileSaving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
            <div className='jr-profile-address'>
              <h2>Address</h2>
              <p className='jr-note'>Add or change the address saved on your account.</p>
              <AddressBook mode='manage' />
            </div>
          </div>
        ) : (
          <div className='jr-empty'>
            <p>You are not logged in.</p>
            <button className='vn-btn vn-btn-solid' type='button' onClick={openLogin}>
              Login
            </button>
          </div>
        )
      ) : null}
    </section>
  )
}

export default RentAccount
