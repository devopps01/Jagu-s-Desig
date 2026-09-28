'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { formatPrice, type StoreProduct } from '@web/data/catalog'

const HeaderSearch = ({ variant = 'bar' }: { variant?: 'bar' | 'icon' }) => {
  const router = useRouter()
  const wrapRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [results, setResults] = useState<StoreProduct[]>([])

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false)
        if (variant === 'icon') setExpanded(false)
      }
    }

    document.addEventListener('mousedown', onPointer)

    return () => document.removeEventListener('mousedown', onPointer)
  }, [variant])

  useEffect(() => {
    const value = query.trim()

    abortRef.current?.abort()

    if (value.length < 2) {
      setResults(current => (current.length ? [] : current))
      setTotal(current => (current ? 0 : current))
      setLoading(current => (current ? false : current))

      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setOpen(true)

    const timer = window.setTimeout(() => {
      fetch(`/api/web/products?search=${encodeURIComponent(value)}&limit=6`, { signal: controller.signal })
        .then(res => (res.ok ? res.json() : { products: [], total: 0 }))
        .then(json => {
          setResults(Array.isArray(json.products) ? json.products : [])
          setTotal(Number(json.total) || 0)
        })
        .catch(error => {
          if (error?.name === 'AbortError') return
          setResults([])
          setTotal(0)
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false)
        })
    }, 280)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    if (variant === 'icon' && expanded) {
      window.setTimeout(() => inputRef.current?.focus(), 40)
    }
  }, [expanded, variant])

  const goSearch = () => {
    const value = query.trim()

    if (value.length < 2) return

    setOpen(false)
    setExpanded(false)
    router.push(`/search?q=${encodeURIComponent(value)}`)
  }

  const drop =
    open && query.trim().length >= 2 ? (
      <div className='vn-search-drop'>
        {loading ? <p className='vn-search-status'>Searching...</p> : null}
        {!loading && !results.length ? <p className='vn-search-status'>No products found</p> : null}
        {!loading
          ? results.map(product => (
              <Link
                key={product.slug}
                className='vn-search-hit'
                href={`/products/${product.slug}`}
                onClick={() => {
                  setOpen(false)
                  setExpanded(false)
                }}
              >
                <img src={product.image} alt='' />
                <span>
                  <strong>{product.title}</strong>
                  <em>{formatPrice(product.price)}</em>
                </span>
              </Link>
            ))
          : null}
        {!loading && total > results.length ? (
          <button className='vn-search-more' type='button' onClick={goSearch}>
            View all {total} results
          </button>
        ) : null}
      </div>
    ) : null

  if (variant === 'icon') {
    return (
      <form
        ref={wrapRef}
        className={`vn-search-wrap is-icon${expanded ? ' is-open' : ''}`}
        role='search'
        onSubmit={event => {
          event.preventDefault()
          goSearch()
        }}
      >
        <button
          className='vn-icon-tip vn-search-toggle'
          type='button'
          aria-label='Search'
          data-tip='Search'
          aria-expanded={expanded}
          onClick={() => setExpanded(current => !current)}
        >
          <i className='tabler-search' />
        </button>
        {expanded ? (
          <div className='vn-search-panel'>
            <input
              ref={inputRef}
              className='vn-search'
              placeholder='Search chaniya choli...'
              value={query}
              autoComplete='off'
              onChange={event => setQuery(event.target.value)}
              onFocus={() => {
                if (query.trim().length >= 2) setOpen(true)
              }}
            />
            {query ? (
              <button
                className='vn-search-clear'
                type='button'
                aria-label='Clear search'
                onClick={() => {
                  setQuery('')
                  setResults([])
                  setOpen(false)
                  inputRef.current?.focus()
                }}
              >
                <i className='tabler-x' />
              </button>
            ) : null}
            {drop}
          </div>
        ) : null}
      </form>
    )
  }

  return (
    <form
      ref={wrapRef}
      className='vn-search-wrap is-bar'
      role='search'
      onSubmit={event => {
        event.preventDefault()
        goSearch()
      }}
    >
      <i className='tabler-search' aria-hidden />
      <input
        ref={inputRef}
        className='vn-search'
        placeholder='Search chaniya choli...'
        value={query}
        autoComplete='off'
        onChange={event => setQuery(event.target.value)}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true)
        }}
      />
      {query ? (
        <button
          className='vn-search-clear'
          type='button'
          aria-label='Clear search'
          onClick={() => {
            setQuery('')
            setResults([])
            setOpen(false)
          }}
        >
          <i className='tabler-x' />
        </button>
      ) : null}
      {drop}
    </form>
  )
}

export default HeaderSearch
