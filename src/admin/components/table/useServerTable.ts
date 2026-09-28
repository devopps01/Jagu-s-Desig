'use client'

import { useCallback, useEffect, useState } from 'react'

import type { TableResponse } from '@/libs/table-query'

type UseServerTableOptions = {
  extraParams?: Record<string, string>
  refreshMs?: number
}

export const useServerTable = <T,>(endpoint: string, options: UseServerTableOptions = {}) => {
  const [rows, setRows] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 350)

    return () => clearTimeout(timer)
  }, [search])

  const reload = useCallback(async () => {
    setLoading(true)

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search: debouncedSearch
    })

    Object.entries(options.extraParams || {}).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    const res = await fetch(`${endpoint}?${params.toString()}`)
    const json = (await res.json()) as TableResponse<T>

    if (res.ok) {
      setRows(json.data || [])
      setTotal(json.total || 0)
    }

    setLoading(false)
  }, [debouncedSearch, endpoint, limit, options.extraParams, page])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    if (!options.refreshMs) return

    const timer = setInterval(() => void reload(), options.refreshMs)

    return () => clearInterval(timer)
  }, [options.refreshMs, reload])

  return {
    rows,
    total,
    page,
    limit,
    search,
    loading,
    setSearch: (value: string) => {
      setPage(1)
      setSearch(value)
    },
    setPage,
    setLimit,
    reload
  }
}
