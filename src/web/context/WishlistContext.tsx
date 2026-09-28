'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { StoreProduct } from '@web/data/catalog'
import { useLoginModal } from '@web/context/LoginModalContext'

const WISH_KEY = 'jagu-wishlist'

type WishlistContextValue = {
  items: StoreProduct[]
  count: number
  has: (slug: string) => boolean
  toggle: (product: StoreProduct) => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useLoginModal()
  const [items, setItems] = useState<StoreProduct[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISH_KEY)
      const parsed = raw ? JSON.parse(raw) : []

      if (Array.isArray(parsed)) setItems(parsed)
    } catch {
      setItems([])
    }

    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return

    window.localStorage.setItem(WISH_KEY, JSON.stringify(items))
  }, [items, ready])

  useEffect(() => {
    if (!user) return

    fetch('/api/web/wishlist')
      .then(res => (res.ok ? res.json() : []))
      .then(json => {
        if (!Array.isArray(json)) return

        setItems(current => {
          const map = new Map<string, StoreProduct>()

          ;[...current, ...(json as StoreProduct[])].forEach(item => {
            if (item?.slug) map.set(item.slug, item)
          })

          return [...map.values()]
        })
      })
      .catch(() => undefined)
  }, [user])

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      count: items.length,
      has: slug => items.some(item => item.slug === slug),
      toggle: product => {
        setItems(current => {
          const exists = current.some(item => item.slug === product.slug)

          if (user) {
            fetch('/api/web/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ product, wished: !exists })
            }).catch(() => undefined)
          }

          return exists ? current.filter(item => item.slug !== product.slug) : [product, ...current]
        })
      }
    }),
    [items, user]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error('useWishlist must be used inside WishlistProvider')
  }

  return context
}
