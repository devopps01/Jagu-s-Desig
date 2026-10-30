'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'

import { discountPercent, type StoreProduct } from '@web/data/catalog'
import { useLoginModal } from '@web/context/LoginModalContext'
import { imageAttrs } from '@web/lib/image-src'
import { RENT_SIZES, isSizeOutOfStock, sizeQuantity } from '@/libs/rent-sizes'
import { dayFullyHeld, holdStillOut, rentSpansOverlap } from '@/libs/rent-span'
import RentDateField from '@/rent/RentDateField'
import { RentWishButton } from '@/rent/RentWishlist'

const money = (value: number) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

type RentHold = {
  size: string
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
  status: string
  care?: 'pending' | 'done'
  ready?: string
}

const holdText = (hold: RentHold) => {
  if (hold.care === 'pending') return 'In dress care'

  if (hold.care === 'done' && hold.ready) return `Rent again from ${formatDay(hold.ready)}`

  return `${formatDay(hold.startDate)} – ${formatDay(hold.endDate)}`
}

const localToday = () => {
  const date = new Date()

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const monthLabel = (year: number, month: number) =>
  new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

const monthCells = (year: number, month: number) => {
  const first = new Date(year, month, 1)
  const startPad = first.getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ iso: string } | null> = Array.from({ length: startPad }, () => null)

  for (let day = 1; day <= days; day += 1) {
    cells.push({
      iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    })
  }

  return cells
}

const RentProduct = ({ product, related = [] }: { product: StoreProduct; related?: StoreProduct[] }) => {
  const images = useMemo(
    () => [...new Set([product.image, ...(product.images || [])].filter(Boolean))],
    [product.image, product.images]
  )
  const sizes = useMemo(() => {
    const picked = (product.sizes || []).filter(size => (RENT_SIZES as readonly string[]).includes(size))

    return picked.length ? picked : [...RENT_SIZES]
  }, [product.sizes])

  const [image, setImage] = useState(images[0] || '')
  const [size, setSize] = useState(sizes[0] || 'M')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('18:00')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('')
  const [statusOk, setStatusOk] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState('')
  const [holds, setHolds] = useState<RentHold[]>([])
  const datesTouched = useRef(false)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()

    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const { user, ready, openLogin } = useLoginModal()

  const loadHolds = async () => {
    const res = await fetch(`/api/rent/schedule?slug=${encodeURIComponent(product.slug)}`, { cache: 'no-store' })
    const json = await res.json().catch(() => null)

    setHolds(Array.isArray(json?.holds) ? json.holds : [])
  }

  useEffect(() => {
    void loadHolds()

    const refresh = () => {
      if (document.visibilityState === 'visible') void loadHolds()
    }

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [product.slug])

  useEffect(() => {
    if (!user?.email) return

    setCustomerEmail(user.email)

    fetch('/api/rent/account')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        const contact = json?.contact || {}

        if (contact.name) setCustomerName(current => current || String(contact.name))
        if (contact.phone) setCustomerPhone(current => current || String(contact.phone))
        if (contact.email) setCustomerEmail(String(contact.email))
      })
      .catch(() => undefined)
  }, [user])

  useEffect(() => {
    if (datesTouched.current) return

    setStartDate('')
    setEndDate('')
  }, [size])

  const price = Number(product.rentPrice) || 0
  const mrp = Number(product.rentMrp) || 0
  const off = discountPercent(mrp, price)
  const saved = off ? Math.max(0, mrp - price) : 0
  const today = localToday()
  const stock = sizeQuantity(product.rentSizeStock, size)
  const sizeClosed = isSizeOutOfStock(product.rentOutOfStock, size)
  const sizeHolds = holds.filter(hold => hold.size === size && holdStillOut(hold))
  const overlapCount = (start: string, end: string, pickup = startTime, drop = endTime) =>
    sizeHolds.filter(hold => rentSpansOverlap({ startDate: start, endDate: end, startTime: pickup, endTime: drop }, hold)).length
  const todayCount = sizeHolds.filter(hold => hold.startDate <= today && hold.endDate >= today).length
  const rangeCount = startDate && endDate ? overlapCount(startDate, endDate) : 0
  const rangeFull = Boolean(startDate && endDate && rangeCount >= stock)
  const cells = monthCells(cursor.year, cursor.month)

  const dayState = (iso: string) => {
    const count = sizeHolds.filter(hold => dayFullyHeld(iso, hold)).length

    if (count >= stock) return 'booked'
    if (iso < today) return 'past'
    if (startDate && endDate && iso >= startDate && iso <= endDate) return 'picked'
    if (iso === startDate || iso === endDate) return 'picked'
    if (count > 0) return 'partial'

    return 'open'
  }

  const pickDay = (iso: string) => {
    if (sizeClosed || dayState(iso) === 'past' || dayState(iso) === 'booked') return

    datesTouched.current = true

    if (!startDate || (startDate && endDate)) {
      const back = sizeHolds
        .filter(hold => hold.endDate === iso && hold.startDate !== hold.endDate && hold.endTime)
        .map(hold => hold.endTime || '')
        .sort()
        .at(-1)

      setStartDate(iso)
      setEndDate('')
      if (back && startTime < back) {
        setStartTime(back)
        setStatusOk(true)
        setStatus(`This outfit comes back at ${back}. Pickup is set to ${back} so it can go out again.`)
      } else {
        setStatus('')
        setStatusOk(null)
      }

      return
    }

    if (iso < startDate) {
      setStartDate(iso)

      return
    }

    const blocked = overlapCount(startDate, iso) >= stock

    if (blocked) {
      setStatusOk(false)
      setStatus(`All ${stock} ${stock === 1 ? 'piece is' : 'pieces are'} already booked in size ${size} for those dates.`)

      return
    }

    setEndDate(iso)
    setStatusOk(true)
    setStatus(`Available for ${size} from ${formatDay(startDate)} ${startTime} to ${formatDay(iso)} ${endTime}`)
  }

  const checkDates = async () => {
    if (!startDate || !endDate || !size) return

    const params = new URLSearchParams({ slug: product.slug, size, startDate, endDate, startTime, endTime })
    const res = await fetch(`/api/rent/book?${params.toString()}`)
    const json = await res.json().catch(() => null)

    setStatusOk(Boolean(json?.available))
    setStatus(json?.message || (res.ok ? '' : 'Could not check dates'))
  }

  const submit = async () => {
    if (sizeClosed) {
      setStatusOk(false)
      setStatus(`${size} is out of stock`)

      return
    }

    if (rangeFull || !startDate || !endDate) {
      setStatusOk(false)
      setStatus(rangeFull ? `All ${stock} ${stock === 1 ? 'piece is' : 'pieces are'} already booked in size ${size} for those dates.` : 'Pick free dates')

      return
    }

    setBusy(true)
    setDone('')
    setStatus('')

    const res = await fetch('/api/rent/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productSlug: product.slug,
        size,
        startDate,
        endDate,
        startTime,
        endTime,
        customerName,
        customerPhone,
        customerEmail,
        notes
      })
    })
    const json = await res.json().catch(() => null)

    setBusy(false)

    if (!res.ok) {
      setStatusOk(false)
      setStatus(json?.message || 'Could not book this rental')

      return
    }

    setStatusOk(true)
    setDone(json?.message || 'Rental request saved.')
    setStatus('')
    setStartDate('')
    setEndDate('')
    setStartTime('10:00')
    setEndTime('18:00')
    await loadHolds()
  }

  return (
    <div className='vn-pdp jr-pdp'>
      <section className='vn-product'>
        <div className='vn-gallery-sticky'>
          <div className='vn-gallery'>
            <div className='vn-gallery-thumbs' role='tablist' aria-label='Outfit photos'>
              {images.map(src => (
                <button
                  key={src}
                  type='button'
                  className={src === image ? 'is-on' : ''}
                  onClick={() => setImage(src)}
                >
                  <img {...imageAttrs(src, 'thumb')} alt='' />
                </button>
              ))}
            </div>
            <div className='vn-card-media vn-gallery-stage'>
              {image ? <img {...imageAttrs(image, 'full')} alt={product.imageAlt || product.title} /> : null}
            </div>
          </div>
        </div>
        <div className='vn-product-info'>
          <p className='vn-product-kicker'>
            <Link href='/rent'>Jagu&apos;s Rent</Link>
            {product.style ? ` · ${product.style}` : ''}
          </p>
          <div className='jr-title-row'>
            <h1>{product.title}</h1>
            <RentWishButton product={product} className='is-text' />
          </div>
          {price ? (
            <div className='vn-price'>
              <div className='vn-price-row'>
                <span className='vn-money'>
                  <strong>₹</strong>
                  {price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {off ? (
                  <>
                    <span className='vn-compare'>
                      <span className='vn-money is-mrp'>
                        <strong>₹</strong>
                        {mrp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </span>
                    <span className='vn-off'>{off}% off</span>
                  </>
                ) : null}
              </div>
              {saved ? <p className='vn-price-save'>You save ₹{saved.toLocaleString('en-IN')}</p> : null}
              <p className='vn-price-save'>Rent price for the selected dates</p>
            </div>
          ) : null}
          {product.description ? <p>{product.description}</p> : null}
          {done ? <p className='jr-note is-ok'>{done}</p> : null}
          {ready ? (
          <form
            className='jr-book'
            onSubmit={event => {
              event.preventDefault()
              if (!user) {
                openLogin()

                return
              }

              void submit()
            }}
          >
            <strong>Book this outfit</strong>
            <p className={`jr-rent-status ${todayCount >= stock ? 'is-out' : 'is-free'}`}>
              {sizeHolds.some(hold => hold.care === 'pending' && hold.startDate <= today && today <= hold.endDate)
                ? `Size ${size} is in dress care. It can be rented on the day care is marked done, and on every day after that.`
                : todayCount >= stock
                  ? `All ${stock} ${stock === 1 ? 'piece is' : 'pieces are'} out in size ${size}`
                  : todayCount
                    ? `${stock - todayCount} of ${stock} pieces still free in size ${size}`
                    : `Available now in size ${size}. ${stock} ${stock === 1 ? 'piece' : 'pieces'} in stock.`}
            </p>
            {sizeHolds.length ? (
              <ul className='jr-hold-list'>
                {sizeHolds.map((hold, index) => (
                  <li key={`${hold.size}-${hold.startDate}-${hold.endDate}-${index}`}>
                    <span>{hold.care ? 'Care' : `Order ${index + 1}`}</span>
                    {holdText(hold)}
                    {!hold.care && hold.startDate <= today && hold.endDate >= today ? ' · on rent now' : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className='jr-note'>No dates are booked for size {size} yet.</p>
            )}
            {holds.some(hold => hold.size !== size) ? (
              <p className='jr-note'>
                Other sizes already booked:{' '}
                {holds
                  .filter(hold => hold.size !== size)
                  .map(hold => `${hold.size} ${holdText(hold)}`)
                  .join(', ')}
              </p>
            ) : null}
            <div className='jr-cal'>
              <div className='jr-cal-head'>
                <button
                  type='button'
                  onClick={() =>
                    setCursor(current =>
                      current.month === 0
                        ? { year: current.year - 1, month: 11 }
                        : { year: current.year, month: current.month - 1 }
                    )
                  }
                >
                  ‹
                </button>
                <strong>{monthLabel(cursor.year, cursor.month)}</strong>
                <button
                  type='button'
                  onClick={() =>
                    setCursor(current =>
                      current.month === 11
                        ? { year: current.year + 1, month: 0 }
                        : { year: current.year, month: current.month + 1 }
                    )
                  }
                >
                  ›
                </button>
              </div>
              <div className='jr-cal-week'>
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(label => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className='jr-cal-grid'>
                {cells.map((cell, index) =>
                  cell ? (
                    <button
                      key={cell.iso}
                      type='button'
                      className={`is-${dayState(cell.iso)}`}
                      disabled={sizeClosed || dayState(cell.iso) === 'past' || dayState(cell.iso) === 'booked'}
                      onClick={() => pickDay(cell.iso)}
                    >
                      {Number(cell.iso.slice(-2))}
                    </button>
                  ) : (
                    <span key={`pad-${index}`} />
                  )
                )}
              </div>
              <p className='jr-note'>
                {sizeClosed
                  ? `Size ${size} is out of stock.`
                  : `Red dates cannot be booked. While an outfit is in dress care, every day stays closed. After care is marked done, that day and every later day can be booked.`}
              </p>
            </div>
            <div className='vn-option-block'>
              <div className='vn-size-head'>
                <strong>Select size</strong>
              </div>
              <div className='vn-size-row'>
                {sizes.map(item => {
                  const count = sizeQuantity(product.rentSizeStock, item)
                  const off = isSizeOutOfStock(product.rentOutOfStock, item)

                  return (
                  <button
                    key={item}
                    type='button'
                    className={`${size === item ? 'is-on' : ''}${off ? ' is-out' : ''}`}
                    disabled={off}
                    onClick={() => {
                      datesTouched.current = false
                      setSize(item)
                      window.setTimeout(() => void checkDates(), 0)
                    }}
                  >
                    {item}
                    <span className='jr-size-qty'>{off ? 'Out' : count}</span>
                  </button>
                  )
                })}
              </div>
            </div>
            <div className='jr-dates'>
              <div className='jr-when'>
                <RentDateField
                  label='From'
                  value={startDate}
                  min={today}
                  blocked={sizeHolds}
                  stock={stock}
                  onChange={iso => {
                    datesTouched.current = true
                    setStartDate(iso)
                  }}
                  onClose={() => void checkDates()}
                />
                <label>
                  Pickup time
                  <input type='time' required step={1800} value={startTime} onChange={event => setStartTime(event.target.value)} />
                </label>
              </div>
              <div className='jr-when'>
                <RentDateField
                  label='To'
                  value={endDate}
                  min={startDate || today}
                  blocked={sizeHolds}
                  stock={stock}
                  onChange={iso => {
                    datesTouched.current = true
                    setEndDate(iso)
                  }}
                  onClose={() => void checkDates()}
                />
                <label>
                  Return time
                  <input type='time' required step={1800} value={endTime} onChange={event => setEndTime(event.target.value)} />
                </label>
              </div>
            </div>
            {startDate && endDate && startDate === endDate && endTime <= startTime ? (
              <p className='jr-note is-bad'>Return time must be after pickup time on the same day.</p>
            ) : null}
            {user ? (
              <>
                <label>
                  Name
                  <input required value={customerName} onChange={event => setCustomerName(event.target.value)} />
                </label>
                <label>
                  Phone
                  <input required value={customerPhone} onChange={event => setCustomerPhone(event.target.value)} />
                </label>
                <label>
                  Email
                  <input type='email' value={customerEmail} readOnly />
                </label>
                <label>
                  Note
                  <textarea rows={3} value={notes} onChange={event => setNotes(event.target.value)} />
                </label>
              </>
            ) : null}
            {sizeClosed ? <p className='jr-note is-bad'>Out of stock in size {size}.</p> : null}
            {rangeFull ? (
              <p className='jr-note is-bad'>
                All {stock} {stock === 1 ? 'piece is' : 'pieces are'} already booked in size {size} for these dates.
              </p>
            ) : null}
            {status ? <p className={`jr-note ${statusOk ? 'is-ok' : 'is-bad'}`}>{status}</p> : null}
            <button
              className='vn-btn vn-btn-solid'
              type='submit'
              disabled={busy || sizeClosed || rangeFull || !startDate || !endDate || !startTime || !endTime || (startDate === endDate && endTime <= startTime)}
            >
              {busy ? 'Saving…' : sizeClosed ? 'Out of stock' : rangeFull ? 'Dates already rented' : user ? 'Request rental' : 'Login to book these dates'}
            </button>
          </form>
          ) : null}
        </div>
      </section>
      {related.length ? (
        <section className='vn-section'>
          <div className='vn-section-head'>
            <p className='vn-section-note'>More to rent</p>
            <h2>Other outfits</h2>
            <div className='vn-rule' />
          </div>
          <div className='vn-grid'>
            {related.map(item => {
              const secondary = (item.images || []).find(src => src && src !== item.image) || ''

              return (
              <article key={item.slug} className='vn-card'>
                <Link href={`/rent/${item.slug}`} className='jr-card-link'>
                  <div className={`vn-card-media${secondary ? ' has-swap' : ' has-zoom'}`}>
                    {item.image ? <img {...imageAttrs(item.image, 'card')} className='is-primary' alt={item.imageAlt || item.title} /> : null}
                    {secondary ? <img {...imageAttrs(secondary, 'card')} className='is-hover' alt={`${item.title} — alternate view`} /> : null}
                  </div>
                  <div className='jr-card-body'>
                    <span className='jr-rent-tag'>For rent</span>
                    <h2>{item.title}</h2>
                    {item.rentPrice ? <strong>{money(item.rentPrice)}</strong> : null}
                  </div>
                </Link>
              </article>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default RentProduct
