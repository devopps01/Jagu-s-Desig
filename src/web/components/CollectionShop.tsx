'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'

import ProductCard from '@web/components/ProductCard'
import { optionMatchesProduct, type FilterKey, type FilterOption } from '@/libs/filter-utils'
import type { StoreProduct } from '@web/data/catalog'

type ResolvedFilter = {
  key: FilterKey
  label: string
  type: 'range' | 'list'
  source: 'product' | 'static'
  showPills: boolean
  options: FilterOption[]
}

const CollectionShop = ({
  slug,
  title
}: {
  slug: string
  title: string
}) => {
  const [products, setProducts] = useState<StoreProduct[]>([])
  const [filters, setFilters] = useState<ResolvedFilter[]>([])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(0)
  const [priceFrom, setPriceFrom] = useState(0)
  const [priceTo, setPriceTo] = useState(0)
  const [selected, setSelected] = useState<Record<string, string[]>>({})
  const [openKey, setOpenKey] = useState<string>('')
  const [sort, setSort] = useState('loved')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    setLoading(true)
    setProducts([])

    fetch(`/api/web/products?slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(json => {
        if (!ignore) setProducts(Array.isArray(json) ? json : [])
      })
      .catch(() => {
        if (!ignore) setProducts([])
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })

    fetch(`/api/web/filters?slug=${encodeURIComponent(slug)}`)
      .then(res => res.json())
      .then(json => {
        setFilters(json.filters || [])
        setMinPrice(json.minPrice || 0)
        setMaxPrice(json.maxPrice || 0)
        setPriceFrom(json.minPrice || 0)
        setPriceTo(json.maxPrice || 0)
        setSelected({})
      })
      .catch(() => setFilters([]))

    return () => {
      ignore = true
    }
  }, [slug])

  const toggleValue = (key: string, value: string) => {
    setSelected(current => {
      const list = current[key] || []

      return {
        ...current,
        [key]: list.includes(value) ? list.filter(item => item !== value) : [...list, value]
      }
    })
  }

  const applyPricePill = (option: FilterOption) => {
    const from = option.min ?? 0
    const to = option.max ?? maxPrice

    setPriceFrom(from)
    setPriceTo(to)
    setSelected(current => ({ ...current, price: [option.value] }))
  }

  const filtered = useMemo(() => {
    let rows = products.filter(product => product.price >= priceFrom && product.price <= (priceTo || product.price))

    filters.forEach(filter => {
      if (filter.key === 'price') return

      const values = selected[filter.key] || []
      if (!values.length) return

      const options = filter.options.filter(option => values.includes(option.value))

      rows = rows.filter(product => options.some(option => optionMatchesProduct(product, filter.key, option)))
    })

    if (sort === 'price-asc') rows = [...rows].sort((a, b) => a.price - b.price)
    if (sort === 'price-desc') rows = [...rows].sort((a, b) => b.price - a.price)
    if (sort === 'loved') rows = [...rows].sort((a, b) => b.reviews - a.reviews)

    return rows
  }, [filters, priceFrom, priceTo, products, selected, sort])

  const hiddenKeys = new Set(['price', 'fabric'])
  const visibleFilters = filters.filter(item => !hiddenKeys.has(item.key))
  const pillFilters = visibleFilters.filter(item => item.showPills && item.options.length)

  return (
    <section className='vn-collection'>
      <nav className='vn-crumbs'>
        <Link href='/'>Home</Link>
        <span> / </span>
        <span>{title}</span>
      </nav>
      <h1 className='vn-collection-title'>{title}</h1>
      {pillFilters.length ? (
        <div className='vn-filter-pills'>
          {pillFilters.map(filter => (
            <div key={filter.key} className='vn-pill-row'>
              <span>{filter.label}</span>
              <div>
                {filter.options.map(option => {
                  const active = (selected[filter.key] || []).includes(option.value)

                  return (
                    <button
                      key={option.value}
                      type='button'
                      className={active ? 'is-on' : ''}
                      onClick={() => (filter.key === 'price' ? applyPricePill(option) : toggleValue(filter.key, option.value))}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <button className='vn-filters-toggle' type='button' onClick={() => setFiltersOpen(true)}>
        <i className='tabler-adjustments' />
        Filters
      </button>
      <div className='vn-collection-layout'>
        <aside className='vn-filters'>
          <h2>Filters</h2>
          <FilterGroups
            filters={visibleFilters}
            openKey={openKey}
            setOpenKey={setOpenKey}
            minPrice={minPrice}
            maxPrice={maxPrice}
            priceFrom={priceFrom}
            priceTo={priceTo}
            setPriceFrom={setPriceFrom}
            setPriceTo={setPriceTo}
            selected={selected}
            toggleValue={toggleValue}
          />
        </aside>
        <div>
          <div className='vn-collection-toolbar'>
            <span>{loading ? 'Loading collection…' : `${filtered.length} products`}</span>
            <label>
              Sort by
              <select value={sort} onChange={event => setSort(event.target.value)}>
                <option value='loved'>Most Loved</option>
                <option value='price-asc'>Price: Low to High</option>
                <option value='price-desc'>Price: High to Low</option>
              </select>
            </label>
          </div>
          <div className='vn-collection-grid' aria-busy={loading}>
            {loading
              ? Array.from({ length: 8 }, (_, index) => (
                  <article className='vn-skel-card' key={index} aria-hidden='true'>
                    <div className='vn-skel-media' />
                    <div className='vn-skel-body'>
                      <span className='vn-skel-line' />
                      <span className='vn-skel-line is-short' />
                    </div>
                  </article>
                ))
              : filtered.map(product => <ProductCard key={product.slug} product={product} />)}
          </div>
          {!loading && !filtered.length ? <p className='vn-empty'>No products match these filters.</p> : null}
        </div>
      </div>
      {filtersOpen ? (
        <FilterModal
          onClose={() => setFiltersOpen(false)}
          filters={visibleFilters}
          openKey={openKey}
          setOpenKey={setOpenKey}
          minPrice={minPrice}
          maxPrice={maxPrice}
          priceFrom={priceFrom}
          priceTo={priceTo}
          setPriceFrom={setPriceFrom}
          setPriceTo={setPriceTo}
          selected={selected}
          toggleValue={toggleValue}
          count={filtered.length}
        />
      ) : null}
    </section>
  )
}

const FilterGroups = ({
  filters,
  openKey,
  setOpenKey,
  minPrice,
  maxPrice,
  priceFrom,
  priceTo,
  setPriceFrom,
  setPriceTo,
  selected,
  toggleValue
}: {
  filters: ResolvedFilter[]
  openKey: string
  setOpenKey: (key: string) => void
  minPrice: number
  maxPrice: number
  priceFrom: number
  priceTo: number
  setPriceFrom: (value: number) => void
  setPriceTo: (value: number) => void
  selected: Record<string, string[]>
  toggleValue: (key: string, value: string) => void
}) => (
  <>
    {filters.map(filter => (
      <div key={filter.key} className='vn-acc'>
        <button type='button' className='vn-acc-btn' onClick={() => setOpenKey(openKey === filter.key ? '' : filter.key)}>
          {filter.label}
          <span>{openKey === filter.key ? '−' : '+'}</span>
        </button>
        {openKey === filter.key ? (
          <div className='vn-acc-body'>
            {filter.key === 'price' ? (
              <div className='vn-price-filter'>
                <input
                  type='range'
                  min={minPrice}
                  max={maxPrice || 1}
                  value={priceTo}
                  onChange={event => setPriceTo(Number(event.target.value))}
                />
                <div className='vn-price-inputs'>
                  <label>
                    ₹
                    <input type='number' value={priceFrom} onChange={event => setPriceFrom(Number(event.target.value))} />
                  </label>
                  <span>to</span>
                  <label>
                    ₹
                    <input type='number' value={priceTo} onChange={event => setPriceTo(Number(event.target.value))} />
                  </label>
                </div>
              </div>
            ) : (
              filter.options.map(option => (
                <label key={option.value} className='vn-check'>
                  <input
                    type='checkbox'
                    checked={(selected[filter.key] || []).includes(option.value)}
                    onChange={() => toggleValue(filter.key, option.value)}
                  />
                  {option.label}
                </label>
              ))
            )}
          </div>
        ) : null}
      </div>
    ))}
  </>
)

const FilterModal = (props: {
  onClose: () => void
  count: number
  filters: ResolvedFilter[]
  openKey: string
  setOpenKey: (key: string) => void
  minPrice: number
  maxPrice: number
  priceFrom: number
  priceTo: number
  setPriceFrom: (value: number) => void
  setPriceTo: (value: number) => void
  selected: Record<string, string[]>
  toggleValue: (key: string, value: string) => void
}) => {
  useEffect(() => {
    const previous = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className='vn-modal-backdrop' onClick={props.onClose}>
      <div className='vn-modal is-filters' role='dialog' aria-modal='true' aria-labelledby='vn-filter-title' onClick={event => event.stopPropagation()}>
        <div className='vn-modal-head'>
          <h2 id='vn-filter-title'>Filters</h2>
          <button className='vn-icon-btn' type='button' onClick={props.onClose} aria-label='Close filters'>
            <i className='tabler-x' />
          </button>
        </div>
        <div className='vn-filter-modal-body'>
          <FilterGroups
            filters={props.filters}
            openKey={props.openKey}
            setOpenKey={props.setOpenKey}
            minPrice={props.minPrice}
            maxPrice={props.maxPrice}
            priceFrom={props.priceFrom}
            priceTo={props.priceTo}
            setPriceFrom={props.setPriceFrom}
            setPriceTo={props.setPriceTo}
            selected={props.selected}
            toggleValue={props.toggleValue}
          />
        </div>
        <button className='vn-btn vn-btn-solid vn-filter-apply' type='button' onClick={props.onClose}>
          Show {props.count} products
        </button>
      </div>
    </div>,
    document.body
  )
}

export default CollectionShop
