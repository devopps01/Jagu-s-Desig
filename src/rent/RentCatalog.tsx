'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

import type { StoreProduct } from '@web/data/catalog'
import { imageAttrs } from '@web/lib/image-src'
import { RentWishButton } from '@/rent/RentWishlist'

const money = (value: number) =>
  `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

const cardImages = (product: StoreProduct) => {
  const list = [...new Set([product.image, ...(product.images || [])].filter(Boolean))]
  const primary = list[0] || ''
  const secondary = list.find(src => src !== primary) || ''

  return { primary, secondary, hasSwap: Boolean(primary && secondary) }
}

const HIDDEN_COLLECTIONS = new Set(['all', 'sarees', 'all-products'])

export type RentCollectionOption = { slug: string; name: string }

const collectionLabel = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

const inCollection = (product: StoreProduct, slug: string) => {
  const tags = (product.collections || []).map(item => String(item || '').trim().toLowerCase())

  if (tags.includes(slug)) return true

  const occasion = String(product.occasion || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return occasion === slug
}

const RentCatalog = ({ products, collections = [] }: { products: StoreProduct[]; collections?: RentCollectionOption[] }) => {
  const [search, setSearch] = useState('')
  const [collection, setCollection] = useState('all')
  const query = search.trim().toLowerCase()

  const collectionTabs = useMemo(() => {
    const named = new Map<string, string>()

    for (const item of collections) {
      const slug = String(item.slug || '').trim().toLowerCase()

      if (!slug || HIDDEN_COLLECTIONS.has(slug) || named.has(slug)) continue

      named.set(slug, item.name.trim() || collectionLabel(slug))
    }

    for (const product of products) {
      for (const raw of product.collections || []) {
        const slug = String(raw || '').trim().toLowerCase()

        if (!slug || HIDDEN_COLLECTIONS.has(slug) || named.has(slug)) continue

        named.set(slug, collectionLabel(slug))
      }
    }

    return [...named.entries()].map(([slug, label]) => ({
      slug,
      label,
      count: products.filter(product => inCollection(product, slug)).length
    }))
  }, [products, collections])

  const rows = useMemo(() => {
    return products.filter(product => {
      if (collection !== 'all' && !inCollection(product, collection)) return false
      if (!query) return true

      return [product.title, product.style, product.color, product.occasion, product.fabric, product.craft]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [products, query, collection])

  const activeLabel = collectionTabs.find(item => item.slug === collection)?.label || 'All'

  return (
    <section className='vn-section jr-catalog'>
      <div className='jr-hero'>
        <p className='vn-section-note'>Rental collection</p>
        <h1>Rent an outfit</h1>
        <div className='vn-rule' />
        <p>Only pieces available to rent. Pick a collection, then choose dates and size on the outfit page.</p>
      </div>
      <div className='jr-collection-block'>
        <p className='vn-section-note'>All collections</p>
      <div className='jr-collections' role='tablist' aria-label='All collections'>
        <button type='button' role='tab' aria-selected={collection === 'all'} className={collection === 'all' ? 'is-on' : ''} onClick={() => setCollection('all')}>
          All
          <span>{products.length}</span>
        </button>
        {collectionTabs.map(item => (
          <button
            key={item.slug}
            type='button'
            role='tab'
            aria-selected={collection === item.slug}
            className={collection === item.slug ? 'is-on' : ''}
            onClick={() => setCollection(item.slug)}
          >
            {item.label}
            <span>{item.count}</span>
          </button>
        ))}
      </div>
      </div>
      <div className='jr-search'>
        <input
          value={search}
          placeholder='Search rent outfits'
          aria-label='Search rent outfits'
          onChange={event => setSearch(event.target.value)}
        />
      </div>
      {rows.length ? (
        <div className='vn-grid'>
          {rows.map(product => {
            const price = Number(product.rentPrice) || 0
            const { primary, secondary, hasSwap } = cardImages(product)
            const alt = product.imageAlt || product.title

            return (
              <article key={product.slug} className='vn-card'>
                <RentWishButton product={product} />
                <Link href={`/rent/${product.slug}`} className='jr-card-link'>
                  <div className={`vn-card-media${hasSwap ? ' has-swap' : ' has-zoom'}`}>
                    {primary ? <img {...imageAttrs(primary, 'card')} className='is-primary' alt={alt} /> : null}
                    {hasSwap ? (
                      <img {...imageAttrs(secondary, 'card')} className='is-hover' alt={`${alt} — alternate view`} />
                    ) : null}
                  </div>
                  <div className='jr-card-body'>
                    <span className='jr-rent-tag'>For rent</span>
                    <h2>{product.title}</h2>
                    {price ? <strong>{money(price)}</strong> : null}
                  </div>
                </Link>
              </article>
            )
          })}
        </div>
      ) : (
        <div className='jr-empty'>
          <p>
            {products.length
              ? query
                ? activeLabel === 'All'
                  ? 'No outfits match that search.'
                  : `No ${activeLabel} outfits match that search.`
                : `No rental outfits in ${activeLabel}.`
              : 'No rental outfits are listed yet.'}
          </p>
        </div>
      )}
    </section>
  )
}

export default RentCatalog
