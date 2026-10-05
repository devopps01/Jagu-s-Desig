'use client'

import { useEffect } from 'react'

const SELECTORS = [
  'main .vn-section',
  'main .vn-stats',
  'main .vn-story',
  'main .vn-banner',
  'main .vn-product',
  'main .vn-page',
  'main .vn-about',
  'main .vn-contact',
  'main .vn-cart-page',
  'main .vn-checkout',
  'main .vn-account',
  'main .vn-track',
  'main .vn-search-page',
  'main .vn-collection',
  'main .vn-reviews-block',
  'main .vn-google-reviews',
  'main .vn-features',
  'main .vn-festivities',
  'main .vn-fan-look',
  'main .vn-video-shop'
].join(', ')

const StorefrontMotion = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const seen = new WeakSet<Element>()
    const observers: IntersectionObserver[] = []

    const reveal = (el: Element) => {
      if (seen.has(el)) return
      if (el.classList.contains('vn-reveal') || el.closest('.vn-reveal')) return

      const rect = el.getBoundingClientRect()

      if (rect.height < 8) return

      seen.add(el)
      el.classList.add('vn-reveal', 'is-from-bottom')

      const show = () => {
        el.classList.add('is-in')
      }

      if (rect.bottom > 0 && rect.top < window.innerHeight + 80) {
        show()

        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          show()
          observer.disconnect()
        },
        { threshold: 0.01, rootMargin: '80px 0px 80px 0px' }
      )

      observers.push(observer)
      observer.observe(el)
    }

    const scan = () => {
      document.querySelectorAll(SELECTORS).forEach(reveal)
    }

    scan()
    const mo = new MutationObserver(() => scan())
    mo.observe(document.querySelector('main') || document.body, { childList: true, subtree: true })
    window.addEventListener('load', scan)
    const fallback = window.setTimeout(() => {
      document.querySelectorAll('.vn-reveal:not(.is-in)').forEach(el => el.classList.add('is-in'))
    }, 400)

    return () => {
      observers.forEach(observer => observer.disconnect())
      mo.disconnect()
      window.removeEventListener('load', scan)
      window.clearTimeout(fallback)
    }
  }, [])

  return null
}

export default StorefrontMotion
