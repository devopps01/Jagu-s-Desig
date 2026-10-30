'use client'

import { useEffect, useMemo, useState } from 'react'

type UseClientTableOptions<T> = {
  getSearchText?: (row: T) => string
  searchKeys?: (keyof T)[]
  initialLimit?: number
}

export const useClientTable = <T,>(allRows: T[], options: UseClientTableOptions<T> = {}) => {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(options.initialLimit ?? 10)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 350)

    return () => clearTimeout(timer)
  }, [search])

  const filtered = useMemo(() => {
    if (!debouncedSearch) return allRows

    return allRows.filter(row => {
      if (options.getSearchText) {
        return options.getSearchText(row).toLowerCase().includes(debouncedSearch)
      }

      const keys = options.searchKeys || []

      return keys.some(key => String(row[key] ?? '').toLowerCase().includes(debouncedSearch))
    })
  }, [allRows, debouncedSearch, options.getSearchText, options.searchKeys])

  const total = filtered.length

  const rows = useMemo(() => {
    const start = (page - 1) * limit

    return filtered.slice(start, start + limit)
  }, [filtered, page, limit])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(total / limit) || 1)

    if (page > maxPage) setPage(maxPage)
  }, [total, limit, page])

  return {
    rows,
    total,
    page,
    limit,
    search,
    setSearch: (value: string) => {
      setPage(1)
      setSearch(value)
    },
    setPage,
    setLimit
  }
}
