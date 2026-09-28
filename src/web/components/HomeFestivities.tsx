'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { SectionHeader } from '@web/components/ProductGrid'

const festivities = [
  {
    title: 'Haldi',
    href: '/collections/haldi',
    image: '/images/home/home-navratri.png'
  },
  {
    title: 'Mehendi',
    href: '/collections/mehendi',
    image: '/images/home/home-party.png'
  },
  {
    title: 'Sangeet',
    href: '/collections/sangeet',
    image: '/images/home/home-craft.png'
  },
  {
    title: 'Cocktail',
    href: '/collections/cocktail',
    image: '/images/home/home-hero.png'
  },
  {
    title: 'Wedding',
    href: '/collections/wedding',
    image: '/images/home/home-wedding.png'
  },
  {
    title: 'Engagement',
    href: '/collections/engagement',
    image: '/images/home/home-engagement.png'
  }
]

const CENTER_SCALE = 1.12
const NEAR_SCALE = 0.96
const FAR_SCALE = 0.82
const AUTOPLAY_MS = 3400
const MOBILE_BP = 760

const scaleForAbs = (abs: number, mobile: boolean) => {
  if (abs <= 0) return CENTER_SCALE
  if (abs === 1) return NEAR_SCALE
  return mobile ? NEAR_SCALE : FAR_SCALE
}

const loopOffset = (index: number, active: number, len: number) => {
  let diff = index - active

  while (diff > Math.floor(len / 2)) diff -= len
  while (diff < -Math.floor(len / 2)) diff += len

  return diff
}

type SlotLayout = {
  cardW: number
  left: number[]
  gap: number
  mobile: boolean
  maxAbs: number
}

const buildSlots = (width: number): SlotLayout => {
  const mobile = width < MOBILE_BP
  const gap = mobile ? 6 : 8
  const scales = mobile
    ? ([NEAR_SCALE, CENTER_SCALE, NEAR_SCALE] as const)
    : ([FAR_SCALE, NEAR_SCALE, CENTER_SCALE, NEAR_SCALE, FAR_SCALE] as const)
  const scaleSum = scales.reduce((sum, scale) => sum + scale, 0)
  const cardW = Math.max(mobile ? 96 : 110, (width - gap * (scales.length - 1)) / scaleSum)
  const left: number[] = []
  let cursor = 0

  scales.forEach(scale => {
    const visualW = cardW * scale
    const visualCenter = cursor + visualW / 2
    left.push(visualCenter - cardW / 2)
    cursor += visualW + gap
  })

  return { cardW, left, gap, mobile, maxAbs: mobile ? 1 : 2 }
}

const HomeFestivities = () => {
  const [active, setActive] = useState(2)
  const [slots, setSlots] = useState<SlotLayout>({
    cardW: 180,
    left: [0, 0, 0, 0, 0],
    gap: 8,
    mobile: false,
    maxAbs: 2
  })
  const sliderRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const dragRef = useRef<{ x: number; y: number; active: boolean; moved: boolean }>({
    x: 0,
    y: 0,
    active: false,
    moved: false
  })
  const len = festivities.length

  const go = (dir: -1 | 1) => setActive(value => (value + dir + len) % len)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') go(1)
      if (event.key === 'ArrowLeft') go(-1)
    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)
  }, [len])

  useEffect(() => {
    const el = sliderRef.current
    if (!el) return

    const measure = () => {
      const width = el.clientWidth
      if (width < 80) return

      const next = buildSlots(width)
      el.style.setProperty('--fest-card-w', `${next.cardW}px`)
      el.dataset.mobile = next.mobile ? '1' : '0'
      setSlots(next)
    }

    measure()
    const frame = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(el)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (pausedRef.current || dragRef.current.active) return
      setActive(value => (value + 1) % len)
    }, AUTOPLAY_MS)

    return () => window.clearInterval(timer)
  }, [len, active])

  useEffect(() => {
    const el = sliderRef.current
    if (!el) return

    const pause = () => {
      pausedRef.current = true
    }
    const resume = () => {
      pausedRef.current = false
    }

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return
      dragRef.current = { x: event.clientX, y: event.clientY, active: true, moved: false }
      pause()
      el.classList.add('is-dragging')
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!dragRef.current.active) return
      const dx = event.clientX - dragRef.current.x
      const dy = event.clientY - dragRef.current.y
      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy)) {
        dragRef.current.moved = true
      }
    }

    const onPointerUp = (event: PointerEvent) => {
      if (!dragRef.current.active) return
      const dx = event.clientX - dragRef.current.x
      const moved = dragRef.current.moved
      const threshold = slots.mobile ? 36 : 48
      dragRef.current.active = false
      el.classList.remove('is-dragging')

      if (moved && Math.abs(dx) >= threshold) {
        go(dx < 0 ? 1 : -1)
      }

      window.setTimeout(resume, slots.mobile ? 800 : 1200)
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('mouseenter', pause)
    el.addEventListener('mouseleave', resume)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('mouseenter', pause)
      el.removeEventListener('mouseleave', resume)
    }
  }, [len, slots.mobile])

  return (
    <section className='vn-festivities'>
      <div className='vn-fest-head-wrap'>
        <SectionHeader title='Pre Wedding Festivities' note='Styled for every function before the big day' />
      </div>
      <div className='vn-fest-slider' ref={sliderRef}>
        <p className='vn-fest-mark' aria-hidden='true'>
          Jagu&apos;s
        </p>
        <div className='vn-fest-stage' aria-roledescription='carousel' aria-live='polite'>
          {festivities.map((item, index) => {
            const offset = loopOffset(index, active, len)
            const abs = Math.abs(offset)
            const visible = abs <= slots.maxAbs
            const slot = offset + slots.maxAbs
            const left = slots.left[slot] ?? 0
            const scale = scaleForAbs(abs, slots.mobile)

            return (
              <article
                key={item.title}
                className={`vn-fest-card-wrap is-abs-${abs} ${offset === 0 ? 'is-center' : ''} ${visible ? 'is-on' : 'is-off'}`}
                style={{
                  left: `${left}px`,
                  width: `${slots.cardW}px`,
                  ['--fest-scale' as string]: String(scale),
                  zIndex: 30 - abs
                }}
                aria-hidden={!visible}
              >
                <Link
                  className='vn-fest-card'
                  href={item.href}
                  tabIndex={offset === 0 ? 0 : -1}
                  draggable={false}
                  onClick={event => {
                    if (dragRef.current.moved) {
                      event.preventDefault()
                      dragRef.current.moved = false
                    }
                  }}
                >
                  <div className='vn-fest-media'>
                    <img src={item.image} alt={`${item.title} look`} draggable={false} />
                  </div>
                  <div className='vn-fest-label'>
                    <span>{item.title}</span>
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default HomeFestivities
