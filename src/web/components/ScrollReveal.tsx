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
      { threshold: 0.12, rootMargin: '0px 0px -4% 0px' }
    )

    observer.observe(el)

    return () => {
      window.removeEventListener('scroll', onScroll)
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
