'use client'

import type { ReactNode } from 'react'

import Card from '@mui/material/Card'

import DataTable from './DataTable'
import TableToolbar from './TableToolbar'
import type { DataTableColumn } from './types'

type AdminDataTableProps<T> = {
  title: string
  subtitle?: string
  search: string
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  onRefresh?: () => void
  actions?: ReactNode
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  total: number
  page: number
  limit: number
  loading?: boolean
  emptyText?: string
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const AdminDataTable = <T,>(props: AdminDataTableProps<T>) => (
  <Card>
    <TableToolbar
      title={props.title}
      subtitle={props.subtitle}
      search={props.search}
      searchPlaceholder={props.searchPlaceholder}
      onSearchChange={props.onSearchChange}
      onRefresh={props.onRefresh}
      actions={props.actions}
    />
    <DataTable
      columns={props.columns}
      rows={props.rows}
      rowKey={props.rowKey}
      meta={{ total: props.total, page: props.page, limit: props.limit }}
      loading={props.loading}
      emptyText={props.emptyText}
      onPageChange={props.onPageChange}
      onLimitChange={props.onLimitChange}
    />
  </Card>
)

export default AdminDataTable
