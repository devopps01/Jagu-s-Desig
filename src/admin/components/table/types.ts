import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  id: string
  label: string
  minWidth?: number
  render?: (row: T) => ReactNode
}

export type DataTableMeta = {
  total: number
  page: number
  limit: number
}
