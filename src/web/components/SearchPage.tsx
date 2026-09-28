'use client'

import { useEffect, useState } from 'react'

import { ProductGrid, SectionHeader } from '@web/components/ProductGrid'
import type { StoreProduct } from '@web/data/catalog'

const SearchPage = ({ query }: { query: string }) => {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(Boolean(query))

  useEffect(() => {
    const value = query.trim()

    if (value.length < 2) {
      setProducts([])
      setTotal(0)
      setLoading(false)

      return
    }

    setLoading(true)
    fetch(`/api/web/products?search=${encodeURIComponent(value)}&limit=48`)
      .then(res => (res.ok ? res.json() : { products: [], total: 0 }))
      .then(json => {
        setProducts(Array.isArray(json.products) ? json.products : [])
        setTotal(Number(json.total) || 0)
      })
      .catch(() => {
        setProducts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [query])

  return (
    <section className='vn-section'>
      <SectionHeader title={query ? `Search results for “${query}”` : 'Search products'} />
      {loading ? <p>Finding products...</p> : null}
      {!loading && query.trim().length < 2 ? <p>Type at least 2 characters in search.</p> : null}
      {!loading && query.trim().length >= 2 && !products.length ? <p>No products found.</p> : null}
      {!loading && products.length ? (
        <>
          <p style={{ marginBottom: 20, color: 'var(--vn-muted)' }}>{total} products found</p>
          <ProductGrid products={products} />
        </>
      ) : null}
    </section>
  )
}

export default SearchPage
