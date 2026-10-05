'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'
import { defaultFanItems, type HomeItem } from '@/libs/home-types'

const dandiyaArt = {
  left: '/images/home/fan-dandiya-left.png',
  right: '/images/home/fan-dandiya-right.png'
} as const

type FanSlot = 'outer-left' | 'inner-left' | 'center' | 'inner-right' | 'outer-right'

const slotsForCount = (count: number): FanSlot[] => {
  if (count <= 0) return []
  if (count === 1) return ['center']
  if (count === 2) return ['inner-left', 'inner-right']
  if (count === 3) return ['inner-left', 'center', 'inner-right']
  if (count === 4) return ['outer-left', 'inner-left', 'inner-right', 'outer-right']

  return ['outer-left', 'inner-left', 'center', 'inner-right', 'outer-right']
}

const HomeFanLook = ({
  note = 'Current most trending requirement',
  title = 'Navratri Favourites',
  href = '/collections/festive',
  items
}: {
  note?: string
  title?: string
  href?: string
  items?: HomeItem[]
}) => {
  const frames = useMemo(() => {
    const source = Array.isArray(items) && items.length ? items : defaultFanItems()
    const enabled = source.filter(item => item.enabled !== false && (item.image || item.imageMobile || item.title))
    const visible = enabled.slice(0, 5)
    const slots = slotsForCount(visible.length)

    return visible.map((item, index) => ({
      id: item.id,
      slot: slots[index],
      title: item.showTitle === false ? '' : item.title,
      alt: item.text || item.title || 'Navratri look',
      href: item.href || href || '/collections/festive',
      image: item.image || '',
      imageMobile: item.imageMobile || ''
    }))
  }, [href, items])

  return (
    <section className='vn-section vn-fan-look' aria-label='Most trending Navratri looks'>
      <div className='vn-fan-look-frame'>
        {(note || title) && (
          <div className='vn-fan-head-wrap'>
            <div className='vn-section-head vn-fan-head'>
              {note ? <p className='vn-section-note'>{note}</p> : null}
              {note && title ? <div className='vn-rule' /> : null}
              {title ? <h2>{title}</h2> : null}
            </div>
          </div>
        )}

        <img
          className='vn-fan-dandiya is-left'
          src={dandiyaArt.left}
          alt=''
          aria-hidden='true'
          draggable={false}
        />
        <img
          className='vn-fan-dandiya is-right'
          src={dandiyaArt.right}
          alt=''
          aria-hidden='true'
          draggable={false}
        />

        <div className='vn-fan-stack'>
          {frames.map(frame => (
            <Link
              key={frame.id}
              href={frame.href}
              className={`vn-fan-card is-${frame.slot}`}
              aria-label={frame.alt}
            >
              <ResponsiveHomeImage image={frame.image} imageMobile={frame.imageMobile} alt={frame.alt} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default HomeFanLook
