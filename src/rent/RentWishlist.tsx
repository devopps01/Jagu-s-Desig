'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { StoreProduct } from '@web/data/catalog'

const WISH_KEY = 'jagu-rent-wishlist'

type RentWishlistValue = {
  items: StoreProduct[]
  count: number
  has: (slug: string) => boolean
  toggle: (product: StoreProduct) => void
}

const RentWishlistContext = createContext<RentWishlistValue | null>(null)

export const RentWishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<StoreProduct[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISH_KEY)
      const parsed = raw ? JSON.parse(raw) : []

      if (Array.isArray(parsed)) setItems(parsed.filter(item => item?.slug))
    } catch {
      setItems([])
    }

    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return

    window.localStorage.setItem(WISH_KEY, JSON.stringify(items))
  }, [items, ready])

  const value = useMemo<RentWishlistValue>(
    () => ({
      items,
      count: items.length,
      has: slug => items.some(item => item.slug === slug),
      toggle: product => {
        setItems(current => {
          const exists = current.some(item => item.slug === product.slug)

          return exists ? current.filter(item => item.slug !== product.slug) : [product, ...current]
        })
      }
    }),
    [items]
  )

  return <RentWishlistContext.Provider value={value}>{children}</RentWishlistContext.Provider>
}

export const useRentWishlist = () => {
  const context = useContext(RentWishlistContext)

  if (!context) throw new Error('useRentWishlist must be used inside RentWishlistProvider')

  return context
}

export const RentWishButton = ({ product, className = '' }: { product: StoreProduct; className?: string }) => {
  const { has, toggle } = useRentWishlist()
  const wished = has(product.slug)

  return (
    <button
      className={`vn-wish ${wished ? 'is-on' : ''} ${className}`.trim()}
      type='button'
      aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      onClick={event => {
        event.preventDefault()
        event.stopPropagation()
        toggle(product)
      }}
    >
      <i className={wished ? 'tabler-heart-filled' : 'tabler-heart'} />
    </button>
  )
}
