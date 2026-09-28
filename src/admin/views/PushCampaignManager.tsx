'use client'

import { useMemo, useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'

type CampaignRow = {
  id: string
  title: string
  body: string
  url: string
  target: 'all' | 'users' | 'guests'
  status: string
  sentCount: number
  failCount: number
  error: string
  createdAt: string
  sentAt: string | null
}

const emptyForm = {
  title: '',
  body: '',
  url: '/',
  imageUrl: '',
  target: 'all' as CampaignRow['target']
}

const PushCampaignManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<CampaignRow>('/api/admin/push-campaigns', { extraParams })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [sending, setSending] = useState('')

  const save = async (sendAfter = false) => {
    setError('')
    const res = await fetch('/api/admin/push-campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Could not save campaign')

      return
    }

    if (sendAfter && json.id) {
      const sendRes = await fetch(`/api/admin/push-campaigns/${json.id}`, { method: 'POST' })
      const sendJson = await sendRes.json()

      if (!sendRes.ok) {
        setError(sendJson.message || 'Saved, but send failed. Add FIREBASE_SERVICE_ACCOUNT in .env.')
        await table.reload()

        return
      }
    }

    setOpen(false)
    setForm(emptyForm)
    await table.reload()
  }

  const sendExisting = async (id: string) => {
    setSending(id)
    const res = await fetch(`/api/admin/push-campaigns/${id}`, { method: 'POST' })
    const json = await res.json()

    setSending('')

    if (!res.ok) {
      setError(json.message || 'Send failed')

      return
    }

    await table.reload()
  }

  return (
    <>
      {error ? (
        <Alert severity='warning' sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      ) : null}
      <AdminDataTable
        title='Push campaigns'
        subtitle='Send Firebase web push to saved FCM tokens. Set NEXT_PUBLIC_FIREBASE_* and FIREBASE_SERVICE_ACCOUNT in .env.'
        search={table.search}
        searchPlaceholder='Search campaigns...'
        onSearchChange={table.setSearch}
        onRefresh={() => void table.reload()}
        actions={
          <>
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={event => {
                table.setPage(1)
                setStatusFilter(event.target.value)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='draft'>Draft</MenuItem>
              <MenuItem value='sent'>Sent</MenuItem>
              <MenuItem value='failed'>Failed</MenuItem>
            </TextField>
            <Button
              variant='contained'
              startIcon={<i className='tabler-bell-plus' />}
              onClick={() => {
                setError('')
                setForm(emptyForm)
                setOpen(true)
              }}
            >
              New campaign
            </Button>
          </>
        }
        columns={[
          { id: 'title', label: 'Title', render: row => <strong>{row.title}</strong> },
          { id: 'target', label: 'Audience' },
          {
            id: 'status',
            label: 'Status',
            render: row => <Chip size='small' color={row.status === 'sent' ? 'success' : row.status === 'failed' ? 'error' : 'default'} label={row.status} />
          },
          {
            id: 'sentCount',
            label: 'Sent',
            render: row => `${row.sentCount} ok / ${row.failCount} fail`
          },
          {
            id: 'createdAt',
            label: 'Created',
            render: row => new Date(row.createdAt).toLocaleString()
          },
          {
            id: 'actions',
            label: '',
            render: row => (
              <IconButton size='small' disabled={sending === row.id} onClick={() => void sendExisting(row.id)} aria-label='Send'>
                <i className='tabler-send' />
              </IconButton>
            )
          }
        ]}
        rows={table.rows}
        rowKey={row => row.id}
        total={table.total}
        page={table.page}
        limit={table.limit}
        loading={table.loading}
        emptyText='No campaigns yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>Firebase push campaign</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          <TextField label='Title' value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
          <TextField
            label='Message'
            multiline
            minRows={3}
            value={form.body}
            onChange={event => setForm(current => ({ ...current, body: event.target.value }))}
          />
          <TextField
            label='Open URL'
            value={form.url}
            onChange={event => setForm(current => ({ ...current, url: event.target.value }))}
            helperText='Example: /collections/all'
          />
          <TextField label='Image URL (optional)' value={form.imageUrl} onChange={event => setForm(current => ({ ...current, imageUrl: event.target.value }))} />
          <TextField
            select
            label='Audience'
            value={form.target}
            onChange={event => setForm(current => ({ ...current, target: event.target.value as CampaignRow['target'] }))}
          >
            <MenuItem value='all'>All devices with FCM token</MenuItem>
            <MenuItem value='users'>Logged-in users</MenuItem>
            <MenuItem value='guests'>Guests</MenuItem>
          </TextField>
          {error ? (
            <Typography color='error' variant='body2'>
              {error}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void save(false)}>Save draft</Button>
          <Button variant='contained' onClick={() => void save(true)}>
            Save & send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PushCampaignManager
