'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import ProductCard from '@web/components/ProductCard'
import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'
import { SectionHeader } from '@web/components/ProductGrid'
import { filterProductsForCollection, type StoreProduct } from '@web/data/catalog'

export type OccasionItem = {
  id?: string
  title: string
  href: string
  image: string
  imageMobile?: string
  showTitle?: boolean
}

const defaultOccasions: OccasionItem[] = [
  { title: 'Navratri', href: '/collections/festive', image: '/images/home/home-navratri.png', imageMobile: '' },
  { title: 'Wedding', href: '/collections/wedding', image: '/images/home/home-wedding.png', imageMobile: '' },
  { title: 'Engagement', href: '/collections/engagement', image: '/images/home/home-engagement.png', imageMobile: '' },
  { title: 'Party', href: '/collections/party', image: '/images/home/home-party.png', imageMobile: '' }
]

const collectionSlugFromHref = (href: string, title: string) => {
  const match = String(href || '').match(/\/collections\/([^/?#]+)/i)
  if (match?.[1] && match[1] !== 'all') return match[1].toLowerCase()

  const key = String(title || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')

  if (key.includes('navratri') || key.includes('festive') || key.includes('garba')) return 'festive'
  if (key.includes('wedding') || key.includes('bridal')) return 'wedding'
  if (key.includes('engagement')) return 'engagement'
  if (key.includes('party') || key.includes('cocktail')) return 'party'

  return key || 'all'
}

const HomeOccasions = ({
  title = 'Shop by occasion',
  note = 'Styled for every celebration',
  showTitle = true,
  showNote = true,
  items = defaultOccasions,
  products = [],
  limit = 8,
  viewMoreLabel = 'View more'
}: {
  title?: string
  note?: string
  showTitle?: boolean
  showNote?: boolean
  items?: OccasionItem[]
  products?: StoreProduct[]
  limit?: number
  viewMoreLabel?: string
}) => {
  const list = items.length ? items : defaultOccasions
  const [active, setActive] = useState(0)
  const selected = list[Math.min(Math.max(active, 0), list.length - 1)] || list[0]
  const collectionSlug = collectionSlugFromHref(selected?.href || '', selected?.title || '')
  const collectionHref = selected?.href || `/collections/${collectionSlug}`

  const picked = useMemo(() => {
    const pool = filterProductsForCollection(products, collectionSlug)
    const max = Math.max(1, Math.min(24, limit || 8))

    return pool.slice(0, max)
  }, [products, collectionSlug, limit])

  return (
    <section className='vn-section vn-occasions-block'>
      <SectionHeader title={showTitle ? title : ''} note={showNote ? note : ''} />
      <div className='vn-occasions' role='tablist' aria-label={title || 'Shop by occasion'}>
        {list.map((item, index) => {
          const selectedCard = index === active

          return (
            <button
              key={item.id || `${item.title}-${item.href}-${index}`}
              type='button'
              role='tab'
              aria-selected={selectedCard}
              className={`vn-occasion${selectedCard ? ' is-active' : ''}`}
              onClick={() => setActive(index)}
            >
              <ResponsiveHomeImage
                image={item.image}
                imageMobile={item.imageMobile}
                alt={`${item.title} chaniya choli`}
                size='card'
              />
              {item.showTitle !== false ? <span>{item.title}</span> : null}
            </button>
          )
        })}
      </div>

      <div className='vn-occasion-products' aria-live='polite'>
        <div className='vn-occasion-products-head'>
          <h3>{selected?.title ? `${selected.title} picks` : 'Picks'}</h3>
          <p>Looks styled for this occasion</p>
        </div>
        {picked.length ? (
          <div className='vn-grid vn-occasion-grid'>
            {picked.map(product => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        ) : (
          <p className='vn-occasion-empty'>Products for this occasion will appear here.</p>
        )}
        <div className='vn-occasion-more'>
          <Link className='vn-btn vn-btn-solid' href={collectionHref}>
            {viewMoreLabel || 'View more'}
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomeOccasions
