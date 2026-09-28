'use client'

import Chip from '@mui/material/Chip'

import { AdminDataTable, useServerTable } from '@admin/components/table'

type OtpRow = {
  id: string
  email: string
  otp: string
  used: boolean
  createdAt: string
  expiresAt: string
}

const OtpLogsTable = () => {
  const table = useServerTable<OtpRow>('/api/admin/otp-logs', { refreshMs: 5000 })

  return (
    <AdminDataTable
      title='OTP Logs'
      subtitle='OTP records stay for 1 minute, then they are removed'
      search={table.search}
      searchPlaceholder='Search OTP logs...'
      onSearchChange={table.setSearch}
      onRefresh={() => void table.reload()}
      columns={[
        { id: 'email', label: 'Email' },
        { id: 'otp', label: 'OTP' },
        {
          id: 'status',
          label: 'Status',
          render: row => {
            const expired = new Date(row.expiresAt).getTime() <= Date.now()

            return (
              <Chip
                size='small'
                label={row.used ? 'Used' : expired ? 'Expired' : 'Active'}
                color={row.used ? 'success' : expired ? 'default' : 'warning'}
              />
            )
          }
        },
        {
          id: 'createdAt',
          label: 'Created',
          render: row => new Date(row.createdAt).toLocaleString()
        },
        {
          id: 'expiresAt',
          label: 'Expires',
          render: row => new Date(row.expiresAt).toLocaleString()
        }
      ]}
      rows={table.rows}
      rowKey={row => row.id}
      total={table.total}
      page={table.page}
      limit={table.limit}
      loading={table.loading}
      emptyText='No active OTP records.'
      onPageChange={table.setPage}
      onLimitChange={table.setLimit}
    />
  )
}

export default OtpLogsTable
