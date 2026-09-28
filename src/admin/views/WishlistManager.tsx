'use client'

import { useEffect, useState } from 'react'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import Chip from '@mui/material/Chip'

type WishRow = {
  id: string
  slug: string
  title: string
  image: string
  count: number
  emails: string[]
  lastAt: string
}

const WishlistManager = () => {
  const table = useServerTable<WishRow>('/api/admin/wishlists')
  const [totalHearts, setTotalHearts] = useState(0)

  useEffect(() => {
    fetch('/api/admin/wishlists?count=1')
      .then(res => res.json())
      .then(json => setTotalHearts(Number(json.count) || 0))
      .catch(() => setTotalHearts(0))
  }, [table.rows])

  return (
    <AdminDataTable
      title='Wishlists'
      subtitle={`${totalHearts} hearts saved across ${table.total} products.`}
      search={table.search}
      searchPlaceholder='Search product or email...'
      onSearchChange={table.setSearch}
      onRefresh={() => void table.reload()}
      columns={[
        {
          id: 'image',
          label: '',
          render: row => <img src={row.image} alt='' style={{ width: 48, height: 64, objectFit: 'cover', borderRadius: 6 }} />
        },
        { id: 'title', label: 'Product' },
        { id: 'slug', label: 'Slug' },
        {
          id: 'count',
          label: 'Hearts',
          render: row => <Chip size='small' color='error' label={`${row.count}`} />
        },
        {
          id: 'emails',
          label: 'Customers',
          render: row => (row.emails || []).slice(0, 3).join(', ') + ((row.emails || []).length > 3 ? ` +${row.emails.length - 3}` : '')
        },
        {
          id: 'lastAt',
          label: 'Last saved',
          render: row => (row.lastAt ? new Date(row.lastAt).toLocaleString() : '-')
        }
      ]}
      rows={table.rows}
      rowKey={row => row.id}
      total={table.total}
      page={table.page}
      limit={table.limit}
      loading={table.loading}
      emptyText='No wishlist items yet.'
      onPageChange={table.setPage}
      onLimitChange={table.setLimit}
    />
  )
}

export default WishlistManager
