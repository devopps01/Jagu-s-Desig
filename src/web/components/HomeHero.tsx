'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useKeenSlider } from 'keen-slider/react'
import 'keen-slider/keen-slider.min.css'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'

type HeroSlide = {
  image: string
  imageMobile?: string
  showKicker?: boolean
  kicker: string
  showTitle?: boolean
  title: string
  showText?: boolean
  text: string
  showButton?: boolean
  buttonLabel?: string
  cta?: string
  href: string
  showSecondButton?: boolean
  secondLabel?: string
  secondHref?: string
}

const defaultSlides: HeroSlide[] = [
  {
    image: '/images/home/home-hero.png',
    kicker: 'Jagu’s Designing',
    title: 'Tradition, tailored for today',
    text: 'Handcrafted chaniya choli for Navratri, weddings and celebrations.',
    href: '/collections/all',
    cta: 'Shop collection',
    buttonLabel: 'Shop collection',
    showKicker: true,
    showTitle: true,
    showText: true,
    showButton: true,
    showSecondButton: true,
    secondLabel: 'Shop on video',
    secondHref: '/video'
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
    cta: 'Shop party',
    buttonLabel: 'Shop party',
    showKicker: true,
    showTitle: true,
    showText: true,
    showButton: true
  }
]

const HomeHero = ({ slides = defaultSlides }: { slides?: HeroSlide[] }) => {
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
        {slides.map((slide, index) => (
          <article key={slide.title} className='keen-slider__slide vn-hero-slide'>
            <ResponsiveHomeImage image={slide.image} imageMobile={slide.imageMobile} alt={slide.title} size='banner' loading={index === 0 ? 'eager' : 'lazy'} />
            <div className='vn-hero-copy'>
              {slide.showKicker !== false && slide.kicker ? <p className='vn-hero-kicker'>{slide.kicker}</p> : null}
              {slide.showTitle !== false && slide.title ? <h1>{slide.title}</h1> : null}
              {slide.showText !== false && slide.text ? <p>{slide.text}</p> : null}
              <div className='vn-hero-actions'>
                {slide.showButton !== false && (slide.buttonLabel || slide.cta) ? (
                  <Link className='vn-btn vn-btn-solid vn-btn-light' href={slide.href}>
                    {slide.buttonLabel || slide.cta}
                  </Link>
                ) : null}
                {slide.showSecondButton && slide.secondLabel ? (
                  <Link className='vn-btn vn-btn-ghost' href={slide.secondHref || '/video'}>
                    {slide.secondLabel}
                  </Link>
                ) : null}
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
