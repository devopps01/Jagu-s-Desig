'use client'

import { useEffect, useState } from 'react'

const ScrollTopButton = () => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let frame = 0
    const read = () => {
      const y = window.scrollY || document.documentElement.scrollTop || 0
      const next = y > 420
      setVisible(prev => (prev === next ? prev : next))
      document.documentElement.classList.toggle('vn-show-scroll-top', next)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      document.documentElement.classList.remove('vn-show-scroll-top')
    }
  }, [])

  return (
    <button
      className='vn-scroll-top'
      type='button'
      aria-label='Back to top'
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    >
      <i className='tabler-arrow-up' />
    </button>
  )
}

export default ScrollTopButton
