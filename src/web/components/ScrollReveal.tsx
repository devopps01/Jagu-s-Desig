'use client'

import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

const ScrollReveal = ({
  children,
  className = '',
  delay = 0
}: {
  children: ReactNode
  className?: string
  delay?: number
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current

    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-in')

      return
    }

    let lastY = window.scrollY

    const onScroll = () => {
      lastY = window.scrollY
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        const y = window.scrollY
        const goingDown = y >= lastY - 1

        el.classList.toggle('is-from-top', !goingDown)
        el.classList.toggle('is-from-bottom', goingDown)
        el.classList.add('is-in')
        lastY = y
        observer.disconnect()
      },
      { threshold: 0.08, rootMargin: '40px 0px 40px 0px' }
    )

    observer.observe(el)

    // Editor iframe / slow paint: never leave a blank hole under the fold.
    const fallback = window.setTimeout(() => el.classList.add('is-in'), 600)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className={`vn-reveal ${className}`.trim()} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>
      {children}
    </div>
  )
}

export default ScrollReveal
