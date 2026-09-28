'use client'

import { useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'

type TokenRow = {
  id: string
  deviceId: string
  token: string
  email: string
  platform: string
  permission: string
  lastSeenAt: string
  createdAt: string
}

const shortToken = (token: string) => (token ? `${token.slice(0, 18)}…${token.slice(-8)}` : 'No FCM token')

const DeviceTokenManager = () => {
  const [audience, setAudience] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ listingType: audience, status: statusFilter }), [audience, statusFilter])
  const table = useServerTable<TokenRow>('/api/admin/device-tokens', { extraParams })

  return (
    <AdminDataTable
      title='FCM device tokens'
      subtitle='Tokens collected after customers allow browser notifications. Use these in Firebase push campaigns.'
      search={table.search}
      searchPlaceholder='Search email, platform or token...'
      onSearchChange={table.setSearch}
      onRefresh={() => void table.reload()}
      actions={
        <>
          <TextField
            select
            size='small'
            label='Audience'
            value={audience}
            onChange={event => {
              table.setPage(1)
              setAudience(event.target.value)
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value=''>All devices</MenuItem>
            <MenuItem value='users'>Logged-in</MenuItem>
            <MenuItem value='guests'>Guests</MenuItem>
          </TextField>
          <TextField
            select
            size='small'
            label='Permission'
            value={statusFilter}
            onChange={event => {
              table.setPage(1)
              setStatusFilter(event.target.value)
            }}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='granted'>Granted</MenuItem>
            <MenuItem value='denied'>Denied</MenuItem>
            <MenuItem value='default'>Not asked</MenuItem>
          </TextField>
        </>
      }
      columns={[
        {
          id: 'email',
          label: 'User',
          render: row => row.email || <Typography color='text.secondary'>Guest</Typography>
        },
        { id: 'platform', label: 'Device' },
        {
          id: 'permission',
          label: 'Permission',
          render: row => (
            <Chip
              size='small'
              color={row.permission === 'granted' ? 'success' : row.permission === 'denied' ? 'default' : 'warning'}
              label={row.permission}
            />
          )
        },
        {
          id: 'token',
          label: 'FCM token',
          render: row => (
            <Typography variant='caption' sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {shortToken(row.token)}
            </Typography>
          )
        },
        {
          id: 'lastSeenAt',
          label: 'Last seen',
          render: row => new Date(row.lastSeenAt).toLocaleString()
        },
        {
          id: 'copy',
          label: '',
          render: row =>
            row.token ? (
              <IconButton size='small' aria-label='Copy token' onClick={() => void navigator.clipboard.writeText(row.token)}>
                <i className='tabler-copy' />
              </IconButton>
            ) : null
        }
      ]}
      rows={table.rows}
      rowKey={row => row.id}
      total={table.total}
      page={table.page}
      limit={table.limit}
      loading={table.loading}
      emptyText='No device tokens yet. Open the website and allow notifications.'
      onPageChange={table.setPage}
      onLimitChange={table.setLimit}
    />
  )
}

export default DeviceTokenManager
