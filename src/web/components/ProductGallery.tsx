'use client'

import { useEffect, useRef, useState } from 'react'

import ProductMedia from '@web/components/ProductMedia'
import ListingBadges from '@web/components/ListingBadges'
import WishlistButton from '@web/components/WishlistButton'
import type { StoreProduct } from '@web/data/catalog'
import { productGallery } from '@web/lib/product-gallery'

const ZOOM_MIN = 1
const ZOOM_MAX = 3
const ZOOM_STEP = 0.5

const ProductGallery = ({ product }: { product: StoreProduct }) => {
  const views = productGallery(product)
  const [index, setIndex] = useState(0)
  const [zoom, setZoom] = useState(ZOOM_MIN)
  const [origin, setOrigin] = useState('50% 50%')
  const stageRef = useRef<HTMLDivElement>(null)
  const current = views[index] || views[0]

  useEffect(() => {
    setZoom(ZOOM_MIN)
    setOrigin('50% 50%')
  }, [index])

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
    if (next === ZOOM_MIN) setOrigin('50% 50%')
  }

  const onStageMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= ZOOM_MIN) return

    const box = stageRef.current?.getBoundingClientRect()

    if (!box) return

    const x = ((event.clientX - box.left) / box.width) * 100
    const y = ((event.clientY - box.top) / box.height) * 100

    setOrigin(`${Math.min(100, Math.max(0, x))}% ${Math.min(100, Math.max(0, y))}%`)
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
              <img src={view.src} alt='' style={{ objectPosition: view.position }} />
            </button>
          ))}
        </div>
        <div
          ref={stageRef}
          className={`vn-card-media vn-gallery-stage${zoom > ZOOM_MIN ? ' is-zoomed' : ''}`}
          onMouseMove={onStageMove}
          onMouseLeave={() => zoom > ZOOM_MIN && setOrigin('50% 50%')}
          onDoubleClick={() => setZoomClamped(zoom > ZOOM_MIN ? ZOOM_MIN : 2)}
        >
          <img
            src={current.src}
            alt={current.alt}
            style={{
              objectPosition: current.position,
              transform: `scale(${imageScale})`,
              transformOrigin: origin
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
