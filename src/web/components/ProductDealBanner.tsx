'use client'

import { useEffect, useState } from 'react'

type Deal = {
  code: string
  headline: string
  label: string
  endsAt: string
}

const pad = (value: number) => String(value).padStart(2, '0')

const remainingLabel = (endsAt: string, now: number) => {
  const left = new Date(endsAt).getTime() - now

  if (left <= 0) return ''

  const totalSeconds = Math.floor(left / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`

  return days > 0 ? `Ends in ${days}d ${clock}` : `Ends in ${clock}`
}

const ProductDealBanner = () => {
  const [deal, setDeal] = useState<Deal | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let ignore = false

    fetch('/api/web/discounts/deal')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!ignore && json?.code && json?.endsAt) setDeal(json)
      })
      .catch(() => {})

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    if (!deal) return

    const timer = window.setInterval(() => setNow(Date.now()), 1000)

    return () => window.clearInterval(timer)
  }, [deal])

  const label = deal ? remainingLabel(deal.endsAt, now) : ''

  if (!deal || !label) return null

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(deal.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className='vn-deal'>
      <span className='vn-deal-mark' aria-hidden='true'>
        <i className='tabler-gift' />
      </span>
      <div className='vn-deal-copy'>
        <p>
          {deal.headline} — {deal.label}
        </p>
        <strong>{deal.code}</strong>
        <em>{label}</em>
      </div>
      <button className='vn-deal-btn' type='button' onClick={() => void copy()}>
        <i className='tabler-gift' />
        {copied ? 'Copied' : 'Copy code'}
      </button>
    </div>
  )
}

export default ProductDealBanner
