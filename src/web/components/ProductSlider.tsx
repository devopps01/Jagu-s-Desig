'use client'

import { useState } from 'react'
import { useKeenSlider } from 'keen-slider/react'
import type { KeenSliderPlugin } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

import ProductCard from '@web/components/ProductCard'
import type { StoreProduct } from '@web/data/catalog'

const Autoplay: KeenSliderPlugin = slider => {
  let paused = false
  let timer: ReturnType<typeof setTimeout>

  const stop = () => clearTimeout(timer)
  const play = () => {
    stop()
    if (paused) return
    timer = setTimeout(() => slider.next(), 3800)
  }

  slider.on('created', () => {
    slider.container.addEventListener('mouseenter', () => {
      paused = true
      stop()
    })
    slider.container.addEventListener('mouseleave', () => {
      paused = false
      play()
    })
    play()
  })
  slider.on('dragStarted', stop)
  slider.on('animationEnded', play)
  slider.on('updated', play)
  slider.on('destroyed', stop)
}

const ResizePlugin: KeenSliderPlugin = slider => {
  const observer = new ResizeObserver(() => slider.update())

  slider.on('created', () => observer.observe(slider.container))
  slider.on('destroyed', () => observer.disconnect())
}

const ProductSlider = ({ products }: { products: StoreProduct[] }) => {
  const [current, setCurrent] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const canLoop = products.length > 4
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: canLoop,
      renderMode: 'performance',
      defaultAnimation: { duration: 720 },
      slides: { perView: Math.min(4, products.length), spacing: 22 },
      breakpoints: {
        '(max-width: 1100px)': {
          slides: { perView: Math.min(2, products.length), spacing: 16 }
        },
        '(max-width: 760px)': {
          slides: { perView: Math.min(2, products.length), spacing: 10 }
        }
      },
      slideChanged(slider) {
        const rel = slider.track.details.rel
        queueMicrotask(() => setCurrent(rel))
      },
      created() {
        queueMicrotask(() => setLoaded(true))
      }
    },
    [ResizePlugin, ...(canLoop ? [Autoplay] : [])]
  )

  if (!products.length) return null

  return (
    <div className='vn-product-slider'>
      <div ref={sliderRef} className='keen-slider vn-product-track'>
        {products.map(product => (
          <div key={product.slug} className='keen-slider__slide vn-product-slide'>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
      {loaded && products.length > 1 ? (
        <>
          <button
            className='vn-product-nav is-prev'
            type='button'
            aria-label='Previous products'
            onClick={() => instanceRef.current?.prev()}
          >
            <i className='tabler-chevron-left' />
          </button>
          <button
            className='vn-product-nav is-next'
            type='button'
            aria-label='Next products'
            onClick={() => instanceRef.current?.next()}
          >
            <i className='tabler-chevron-right' />
          </button>
        </>
      ) : null}
      {loaded && products.length > 4 ? (
        <div className='vn-product-dots' role='tablist' aria-label='Spotlight slides'>
          {Array.from({ length: Math.ceil(products.length / 4) }, (_, index) => (
            <button
              key={index}
              type='button'
              className={Math.floor(current / 4) === index ? 'is-on' : undefined}
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => instanceRef.current?.moveToIdx(index * 4)}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default ProductSlider
