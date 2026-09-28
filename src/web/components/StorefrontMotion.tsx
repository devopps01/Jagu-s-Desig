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
    let lastY = window.scrollY

    const onScroll = () => {
      lastY = window.scrollY
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    const reveal = (el: Element) => {
      if (seen.has(el)) return
      if (el.classList.contains('vn-reveal') || el.closest('.vn-reveal')) return
      seen.add(el)
      el.classList.add('vn-reveal', 'is-from-bottom')

      const observer = new IntersectionObserver(
        ([entry]) => {
          const y = window.scrollY
          const goingDown = y >= lastY - 1

          if (entry.isIntersecting) {
            el.classList.toggle('is-from-top', !goingDown)
            el.classList.toggle('is-from-bottom', goingDown)
            el.classList.add('is-in')
          } else {
            el.classList.toggle('is-from-top', goingDown)
            el.classList.toggle('is-from-bottom', !goingDown)
            el.classList.remove('is-in')
          }

          lastY = y
        },
        { threshold: 0.1, rootMargin: '0px 0px -4% 0px' }
      )

      observer.observe(el)
    }

    const scan = () => {
      document.querySelectorAll(SELECTORS).forEach(reveal)
    }

    scan()

    const mo = new MutationObserver(() => scan())
    mo.observe(document.querySelector('main') || document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      mo.disconnect()
    }
  }, [])

  return null
}

export default StorefrontMotion
