'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'
import { SectionHeader } from '@web/components/ProductGrid'
import { defaultNavratriItems, type HomeItem } from '@/libs/home-types'

const paragraphs = (text: string) =>
  String(text || '')
    .split(/\n+/)
    .map(row => row.trim())
    .filter(Boolean)

const HomeNavratri = ({
  title = 'Navratri, from the atelier',
  note = 'Image, craft and the nine nights',
  moreTitle = 'Beyond the garba circle',
  moreNote = 'Wedding, engagement and after-aarti looks',
  showMoreHeader = true,
  items
}: {
  title?: string
  note?: string
  moreTitle?: string
  moreNote?: string
  showMoreHeader?: boolean
  items?: HomeItem[]
}) => {
  const { stories, notes } = useMemo(() => {
    const source = Array.isArray(items) && items.length ? items : defaultNavratriItems()
    const enabled = source.filter(item => item.enabled !== false)

    return {
      stories: enabled.filter(item => item.showButton),
      notes: enabled.filter(item => !item.showButton)
    }
  }, [items])

  return (
    <section className='vn-section'>
      <SectionHeader title={title} note={note} />
      {stories.length ? (
        <div className='vn-info-list'>
          {stories.map(item => (
            <article key={item.id} className={`vn-info${item.showSecondButton ? ' is-reverse' : ''}`}>
              <div className='vn-info-media'>
                <ResponsiveHomeImage
                  image={item.image}
                  imageMobile={item.imageMobile}
                  alt={item.title || 'Navratri story'}
                  size='card'
                />
              </div>
              <div className='vn-info-copy'>
                {item.showKicker !== false && item.kicker ? <p className='vn-hero-kicker'>{item.kicker}</p> : null}
                {item.showTitle !== false && item.title ? <h3>{item.title}</h3> : null}
                {item.showText !== false
                  ? paragraphs(item.text).map(paragraph => <p key={paragraph}>{paragraph}</p>)
                  : null}
                {item.showButton && item.buttonLabel && item.href ? (
                  <Link className='vn-btn vn-btn-solid' href={item.href}>
                    {item.buttonLabel}
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
      {notes.length ? (
        <div className='vn-info-more'>
          {showMoreHeader && (moreTitle || moreNote) ? <SectionHeader title={moreTitle} note={moreNote} /> : null}
          <div className='vn-info-notes'>
            {notes.map(item => (
              <article key={item.id}>
                {item.href ? (
                  <Link href={item.href} aria-label={item.title || 'Open look'}>
                    <ResponsiveHomeImage
                      image={item.image}
                      imageMobile={item.imageMobile}
                      alt={item.title || 'Navratri look'}
                      size='card'
                    />
                  </Link>
                ) : (
                  <ResponsiveHomeImage
                    image={item.image}
                    imageMobile={item.imageMobile}
                    alt={item.title || 'Navratri look'}
                    size='card'
                  />
                )}
                {item.showTitle !== false && item.title ? <h4>{item.title}</h4> : null}
                {item.showText !== false && item.text ? <p>{item.text}</p> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default HomeNavratri
