'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

const slides = [
  {
    image: '/images/home/home-hero.png',
    kicker: 'Jagu’s Designing',
    title: 'Tradition, tailored for today',
    text: 'Handcrafted chaniya choli for Navratri, weddings and celebrations.',
    href: '/collections/all',
    cta: 'Shop collection'
  },
  {
    image: '/images/home/home-navratri.png',
    kicker: 'Navratri edit',
    title: 'Made to move at Garba',
    text: 'Mirror work chaniya choli for nine nights of colour and dance.',
    href: '/collections/festive',
    cta: 'Shop Navratri'
  },
  {
    image: '/images/home/home-wedding.png',
    kicker: 'Bridal atelier',
    title: 'Wine, gold and ceremony',
    text: 'Bridal chaniya choli finished for pheras, portraits and the mandap.',
    href: '/collections/wedding',
    cta: 'Shop wedding'
  },
  {
    image: '/images/home/home-engagement.png',
    kicker: 'Engagement',
    title: 'Soft light, sharp craft',
    text: 'Pastel and ivory pieces for rings, portraits and intimate evenings.',
    href: '/collections/party',
    cta: 'Shop engagement'
  },
  {
    image: '/images/home/home-party.png',
    kicker: 'Party nights',
    title: 'Festive after dark',
    text: 'Emerald and gold silhouettes for receptions and cocktail hours.',
    href: '/collections/party',
    cta: 'Shop party'
  }
]

const HomeHero = () => {
  const [current, setCurrent] = useState(0)
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: true,
      initial: 0,
      slideChanged(slider) {
        const rel = slider.track.details.rel
        queueMicrotask(() => setCurrent(rel))
      }
    },
    [
      slider => {
        let paused = false
        let timer: ReturnType<typeof setTimeout>

        const stop = () => clearTimeout(timer)
        const play = () => {
          stop()
          if (paused) return
          timer = setTimeout(() => slider.next(), 5200)
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
      }
    ]
  )

  return (
    <section className='vn-hero' aria-label='Featured collections'>
      <div ref={sliderRef} className='keen-slider vn-hero-slider'>
        {slides.map(slide => (
          <article key={slide.title} className='keen-slider__slide vn-hero-slide'>
            <img src={slide.image} alt={slide.title} />
            <div className='vn-hero-copy'>
              <p className='vn-hero-kicker'>{slide.kicker}</p>
              <h1>{slide.title}</h1>
              <p>{slide.text}</p>
              <div className='vn-hero-actions'>
                <Link className='vn-btn vn-btn-solid vn-btn-light' href={slide.href}>
                  {slide.cta}
                </Link>
                <Link className='vn-btn vn-btn-ghost' href='/video'>
                  Shop on video
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      <button
        className='vn-hero-nav is-prev'
        type='button'
        aria-label='Previous slide'
        onClick={() => instanceRef.current?.prev()}
      >
        <i className='tabler-chevron-left' />
      </button>
      <button
        className='vn-hero-nav is-next'
        type='button'
        aria-label='Next slide'
        onClick={() => instanceRef.current?.next()}
      >
        <i className='tabler-chevron-right' />
      </button>
      <div className='vn-hero-dots' role='tablist' aria-label='Hero slides'>
        {slides.map((slide, index) => (
          <button
            key={slide.title}
            type='button'
            role='tab'
            aria-label={`Show ${slide.kicker}`}
            aria-selected={current === index}
            className={current === index ? 'is-on' : ''}
            onClick={() => instanceRef.current?.moveToIdx(index)}
          />
        ))}
      </div>
    </section>
  )
}

export default HomeHero
