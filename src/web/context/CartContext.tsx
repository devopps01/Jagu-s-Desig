'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { StoreProduct } from '@web/data/catalog'

const CART_KEY = 'jagu-cart'

export type CartOptions = {
  size?: string
  qty?: number
  open?: boolean
}

export type CartLine = {
  id: string
  product: StoreProduct
  qty: number
  size?: string
}

type CartContextValue = {
  lines: CartLine[]
  isOpen: boolean
  count: number
  subtotal: number
  openCart: () => void
  closeCart: () => void
  addItem: (product: StoreProduct, options?: CartOptions) => void
  setQty: (id: string, qty: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export const lineUnitPrice = (line: CartLine) => line.product.sellingPrice || line.product.price || 0

export const lineKey = (product: StoreProduct, options?: CartOptions) => [product.slug, options?.size || ''].join('|')

export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0)

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(CART_KEY)
      const parsed = raw ? JSON.parse(raw) : []

      if (Array.isArray(parsed)) setLines(parsed)
    } catch {
      setLines([])
    }

    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return

    window.localStorage.setItem(CART_KEY, JSON.stringify(lines))
  }, [lines, ready])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      isOpen,
      count: lines.reduce((sum, line) => sum + line.qty, 0),
      subtotal: cartSubtotal(lines),
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem: (product, options) => {
        const id = lineKey(product, options)
        const add = Math.max(1, Number(options?.qty) || 1)

        setLines(current => {
          const existing = current.find(line => line.id === id)

          if (existing) {
            return current.map(line => (line.id === id ? { ...line, qty: Math.min(20, line.qty + add) } : line))
          }

          return [...current, { id, product, qty: Math.min(20, add), size: options?.size }]
        })

        if (options?.open !== false) setIsOpen(true)
      },
      setQty: (id, qty) => {
        setLines(current => {
          if (qty < 1) return current.filter(line => line.id !== id)

          const next = Math.min(20, Math.max(1, Math.floor(Number(qty) || 1)))

          return current.map(line => (line.id === id ? { ...line, qty: next } : line))
        })
      },
      removeItem: id => setLines(current => current.filter(line => line.id !== id && line.product.slug !== id)),
      clearCart: () => setLines([])
    }),
    [isOpen, lines]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used inside CartProvider')
  }

  return context
}
