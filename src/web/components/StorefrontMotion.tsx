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
  'main .vn-video-shop',
  '.vn-footer'
].join(', ')

const StorefrontMotion = () => {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const seen = new WeakSet<Element>()
    const observers: IntersectionObserver[] = []

    const reveal = (el: Element) => {
      if (seen.has(el)) return
      if (el.classList.contains('vn-reveal') || el.closest('.vn-reveal')) return
      seen.add(el)
      el.classList.add('vn-reveal', 'is-from-bottom')

      const show = () => {
        el.classList.add('is-in')
      }

      const rect = el.getBoundingClientRect()
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        show()
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return
          show()
          observer.disconnect()
        },
        { threshold: 0.01, rootMargin: '0px 0px -4% 0px' }
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

    return () => {
      observers.forEach(observer => observer.disconnect())
      mo.disconnect()
    }
  }, [])

  return null
}

export default StorefrontMotion
