'use client'

import { useEffect, useRef, useState } from 'react'

import ProductMedia from '@web/components/ProductMedia'
import ListingBadges from '@web/components/ListingBadges'
import WishlistButton from '@web/components/WishlistButton'
import type { StoreProduct } from '@web/data/catalog'
import { productGallery } from '@web/lib/product-gallery'
import { imageAttrs } from '@web/lib/image-src'

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.5

const ProductGallery = ({ product }: { product: StoreProduct }) => {
  const views = productGallery(product)
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  const [origin, setOrigin] = useState('50% 50%')
  const stageRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(ZOOM_MIN)
  const panRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const hoverZoom = useRef(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const current = views[index] || views[0]

  zoomRef.current = zoom
  panRef.current = pan
  scaleRef.current = current?.scale || 1

  const movePan = (x: number, y: number) => {
    const box = stageRef.current?.getBoundingClientRect()
    const scale = scaleRef.current * zoomRef.current

    if (!box || scale <= ZOOM_MIN) {
      panRef.current = { x: 0, y: 0 }
      setPan({ x: 0, y: 0 })

      return
    }

    const maxX = (box.width * (scale - 1)) / 2
    const maxY = (box.height * (scale - 1)) / 2
    const next = {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y))
    }

    panRef.current = next
    setPan(next)
  }

  useEffect(() => {
    setZoom(ZOOM_MIN)
    setPan({ x: 0, y: 0 })
    setOrigin('50% 50%')
  }, [index])

  useEffect(() => {
    const node = stageRef.current

    if (!node) return

    let pinch: { dist: number; zoom: number } | null = null
    let drag: { x: number; y: number; ox: number; oy: number } | null = null
    let lastTap = 0

    const distance = (first: Touch, second: Touch) =>
      Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)

    const onStart = (event: TouchEvent) => {
      if ((event.target as HTMLElement).closest('button')) return

      if (event.touches.length === 2) {
        drag = null
        node.classList.remove('is-dragging')
        pinch = { dist: distance(event.touches[0], event.touches[1]), zoom: zoomRef.current }

        return
      }

      if (event.touches.length === 1 && zoomRef.current > ZOOM_MIN) {
        const touch = event.touches[0]

        drag = { x: touch.clientX, y: touch.clientY, ox: panRef.current.x, oy: panRef.current.y }
        node.classList.add('is-dragging')
      }
    }

    const onMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && pinch) {
        event.preventDefault()
        const next = pinch.zoom * (distance(event.touches[0], event.touches[1]) / pinch.dist)

        setZoom(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 10) / 10)))

        return
      }

      if (event.touches.length === 1 && drag && zoomRef.current > ZOOM_MIN) {
        event.preventDefault()
        const touch = event.touches[0]

        movePan(drag.ox + (touch.clientX - drag.x), drag.oy + (touch.clientY - drag.y))
      }
    }

    const onEnd = (event: TouchEvent) => {
      if (event.touches.length < 2) pinch = null

      if (event.touches.length === 0) {
        drag = null
        node.classList.remove('is-dragging')
      }

      const target = event.target as HTMLElement

      if (target.closest('button')) return

      if (event.touches.length === 0 && event.changedTouches.length === 1) {
        const now = Date.now()

        if (now - lastTap < 280) {
          setZoom(currentZoom => (currentZoom > ZOOM_MIN ? ZOOM_MIN : 2))
          setPan({ x: 0, y: 0 })
          setOrigin('50% 50%')
          lastTap = 0
        } else {
          lastTap = now
        }
      }
    }

    node.addEventListener('touchstart', onStart, { passive: true })
    node.addEventListener('touchmove', onMove, { passive: false })
    node.addEventListener('touchend', onEnd)
    node.addEventListener('touchcancel', onEnd)

    return () => {
      node.removeEventListener('touchstart', onStart)
      node.removeEventListener('touchmove', onMove)
      node.removeEventListener('touchend', onEnd)
      node.removeEventListener('touchcancel', onEnd)
    }
  }, [current?.src])

  if (!current) {
    return (
      <div className='vn-gallery-sticky'>
        <div className='vn-card-media'>
          <ProductMedia alt={product.title} />
          <ListingBadges />
          <WishlistButton product={product} className='is-on-page' />
        </div>
      </div>
    )
  }

  const go = (next: number) => setIndex((next + views.length) % views.length)

  const setZoomClamped = (value: number) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(value * 10) / 10))

    setZoom(next)
    if (next === ZOOM_MIN) {
      setPan({ x: 0, y: 0 })
      setOrigin('50% 50%')
    }
  }

  const onStageMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if ((event.target as HTMLElement).closest('button')) return

    const activeZoom = zoom > ZOOM_MIN ? zoom : 2

    if (zoom <= ZOOM_MIN) {
      hoverZoom.current = true
      setZoom(2)
    }

    const box = stageRef.current?.getBoundingClientRect()

    if (!box) return

    const scale = current.scale * activeZoom
    const px = Math.min(1, Math.max(0, (event.clientX - box.left) / box.width))
    const py = Math.min(1, Math.max(0, (event.clientY - box.top) / box.height))
    const maxX = (box.width * (scale - 1)) / 2
    const maxY = (box.height * (scale - 1)) / 2
    const next = { x: (0.5 - px) * 2 * maxX, y: (0.5 - py) * 2 * maxY }

    panRef.current = next
    setPan(next)
  }

  const onStageLeave = () => {
    if (!hoverZoom.current) return

    hoverZoom.current = false
    setZoom(ZOOM_MIN)
    setPan({ x: 0, y: 0 })
    setOrigin('50% 50%')
  }

  const imageScale = current.scale * zoom

  return (
    <div className='vn-gallery-sticky'>
      <div className='vn-gallery'>
        <div className='vn-gallery-thumbs' role='tablist' aria-label='Product photos'>
          {views.map((view, itemIndex) => (
            <button
              key={`${view.src}-${view.label}-${itemIndex}`}
              type='button'
              role='tab'
              aria-selected={itemIndex === index}
              className={itemIndex === index ? 'is-on' : ''}
              onClick={() => setIndex(itemIndex)}
            >
              <img {...imageAttrs(view.src, 'thumb')} alt='' loading='lazy' decoding='async' style={{ objectPosition: view.position }} />
            </button>
          ))}
        </div>
        <div
          ref={stageRef}
          className={`vn-card-media vn-gallery-stage${zoom > ZOOM_MIN ? ' is-zoomed' : ''}`}
          onMouseMove={onStageMove}
          onMouseLeave={onStageLeave}
          onDoubleClick={() => setZoomClamped(zoom > ZOOM_MIN ? ZOOM_MIN : 2)}
        >
          <img
            {...imageAttrs(current.src, 'full')}
            alt={current.alt}
            loading='eager'
            decoding='async'
            style={{
              objectPosition: current.position,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${imageScale})`,
              transformOrigin: 'center center'
            }}
          />
          <ListingBadges />
          <WishlistButton product={product} className='is-on-page' />
          <p className='vn-gallery-label'>{current.label}</p>
          <div className='vn-gallery-zoom' role='group' aria-label='Zoom controls'>
            <button
              type='button'
              aria-label='Zoom out'
              disabled={zoom <= ZOOM_MIN}
              onClick={event => {
                event.stopPropagation()
                setZoomClamped(zoom - ZOOM_STEP)
              }}
            >
              <i className='tabler-zoom-out' />
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              type='button'
              aria-label='Zoom in'
              disabled={zoom >= ZOOM_MAX}
              onClick={event => {
                event.stopPropagation()
                setZoomClamped(zoom + ZOOM_STEP)
              }}
            >
              <i className='tabler-zoom-in' />
            </button>
          </div>
          {views.length > 1 ? (
            <>
              <button className='vn-gallery-nav is-prev' type='button' aria-label='Previous photo' onClick={() => go(index - 1)}>
                <i className='tabler-chevron-left' />
              </button>
              <button className='vn-gallery-nav is-next' type='button' aria-label='Next photo' onClick={() => go(index + 1)}>
                <i className='tabler-chevron-right' />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ProductGallery
