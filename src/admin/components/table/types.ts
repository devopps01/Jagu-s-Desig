import type { ReactNode } from 'react'

export type DataTableColumn<T> = {
  id: string
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  render?: (row: T) => ReactNode
}

/** Use on action columns for consistent width and header label. */
export const adminActionsColumn = <T,>(render: (row: T) => ReactNode): DataTableColumn<T> => ({
  id: 'actions',
  label: 'Actions',
  minWidth: 112,
  align: 'right',
  render
})

export type DataTableMeta = {
  total: number
  page: number
  limit: number
}
