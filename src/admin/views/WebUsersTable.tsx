'use client'

import { AdminDataTable, useServerTable } from '@admin/components/table'

type WebUserRow = {
  id: string
  email: string
  createdAt: string
  lastLoginAt: string | null
}

const WebUsersTable = () => {
  const table = useServerTable<WebUserRow>('/api/admin/users')

  return (
    <AdminDataTable
      title='Website Users'
      subtitle='Users who logged in with email OTP'
      search={table.search}
      searchPlaceholder='Search users...'
      onSearchChange={table.setSearch}
      onRefresh={() => void table.reload()}
      columns={[
        { id: 'email', label: 'Email' },
        { id: 'referralCode', label: 'Referral' },
        {
          id: 'createdAt',
          label: 'First login',
          render: row => new Date(row.createdAt).toLocaleString()
        },
        {
          id: 'lastLoginAt',
          label: 'Last login',
          render: row => (row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : '-')
        }
      ]}
      rows={table.rows}
      rowKey={row => row.id}
      total={table.total}
      page={table.page}
      limit={table.limit}
      loading={table.loading}
      emptyText='No website users yet.'
      onPageChange={table.setPage}
      onLimitChange={table.setLimit}
    />
  )
}

export default WebUsersTable
