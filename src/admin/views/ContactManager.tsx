'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import { type ContactStatus } from '@/libs/contact-types'

type ContactRow = {
  id: string
  name: string
  email: string
  phone: string
  subject: string
  message: string
  status: ContactStatus
  createdAt: string
}

type Stats = {
  total: number
  new: number
  replied: number
  thisWeek: number
}

const emptyStats: Stats = { total: 0, new: 0, replied: 0, thisWeek: 0 }

const statusColor = (status: ContactStatus) => {
  if (status === 'new') return 'warning'
  if (status === 'replied') return 'success'
  if (status === 'archived') return 'default'

  return 'info'
}

const ContactManager = () => {
  const params = useParams()
  const lang = String(params?.lang || 'en')
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<ContactRow>('/api/admin/contacts', { extraParams })
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [open, setOpen] = useState<ContactRow | null>(null)

  const loadExtras = async () => {
    const statsRes = await fetch('/api/admin/contacts/stats')
    const statsJson = await statsRes.json()

    if (statsRes.ok) setStats(statsJson)
  }

  useEffect(() => {
    void loadExtras()
  }, [table.rows])

  const patch = async (id: string, status: ContactStatus) => {
    await fetch(`/api/admin/contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    setOpen(current => (current?.id === id ? { ...current, status } : current))
    await table.reload()
    await loadExtras()
  }

  const cards = [
    { label: 'New inquiries', value: stats.new, icon: 'tabler-mail' },
    { label: 'This week', value: stats.thisWeek, icon: 'tabler-calendar' },
    { label: 'Replied', value: stats.replied, icon: 'tabler-checks' },
    { label: 'Total', value: stats.total, icon: 'tabler-inbox' }
  ]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent className='flex flex-wrap items-center justify-between gap-4'>
            <div>
              <Typography variant='h5'>Contact page</Typography>
              <Typography color='text.secondary'>
                Headline, phone, WhatsApp, hours and store addresses are edited in the Contact page module.
              </Typography>
            </div>
            <Button href={`/${lang}/store/contact-page`} variant='contained'>
              Edit contact page
            </Button>
          </CardContent>
        </Card>
      </Grid>

      {cards.map(card => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent className='flex items-center gap-4'>
              <i className={`${card.icon} text-3xl`} />
              <div>
                <Typography variant='h4'>{card.value}</Typography>
                <Typography color='text.secondary'>{card.label}</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      <Grid size={{ xs: 12 }}>
        <AdminDataTable
          title='Contact inquiries'
          subtitle='Messages sent from the website Contact Us form.'
          search={table.search}
          searchPlaceholder='Search name, email, phone or message...'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          actions={
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={event => {
                table.setPage(1)
                setStatusFilter(event.target.value)
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='new'>New</MenuItem>
              <MenuItem value='read'>Read</MenuItem>
              <MenuItem value='replied'>Replied</MenuItem>
              <MenuItem value='archived'>Archived</MenuItem>
            </TextField>
          }
          columns={[
            { id: 'name', label: 'Name' },
            {
              id: 'contact',
              label: 'Contact',
              render: row => (
                <div>
                  {row.email}
                  {row.phone ? <div style={{ fontSize: 12, opacity: 0.7 }}>{row.phone}</div> : null}
                </div>
              )
            },
            { id: 'subject', label: 'Subject' },
            {
              id: 'message',
              label: 'Message',
              minWidth: 220,
              render: row => (row.message.length > 80 ? `${row.message.slice(0, 80)}…` : row.message)
            },
            {
              id: 'status',
              label: 'Status',
              render: row => <Chip size='small' color={statusColor(row.status)} label={row.status} className='capitalize' />
            },
            {
              id: 'createdAt',
              label: 'Received',
              render: row => new Date(row.createdAt).toLocaleString()
            },
            {
              id: 'actions',
              label: '',
              render: row => (
                <>
                  <IconButton
                    size='small'
                    title='View'
                    onClick={() => {
                      setOpen(row)
                      if (row.status === 'new') void patch(row.id, 'read')
                    }}
                  >
                    <i className='tabler-eye' />
                  </IconButton>
                  {row.status !== 'replied' ? (
                    <IconButton size='small' title='Mark replied' onClick={() => void patch(row.id, 'replied')}>
                      <i className='tabler-checks' />
                    </IconButton>
                  ) : (
                    <IconButton size='small' title='Archive' onClick={() => void patch(row.id, 'archived')}>
                      <i className='tabler-archive' />
                    </IconButton>
                  )}
                  <IconButton
                    size='small'
                    title='Delete'
                    onClick={() => void fetch(`/api/admin/contacts/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </>
              )
            }
          ]}
          rows={table.rows}
          rowKey={row => row.id}
          total={table.total}
          page={table.page}
          limit={table.limit}
          loading={table.loading}
          emptyText='No contact messages yet.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} fullWidth maxWidth='sm'>
        <DialogTitle>{open?.subject || 'Inquiry'}</DialogTitle>
        <DialogContent className='flex flex-col gap-3'>
          <Typography>
            <strong>{open?.name}</strong>
          </Typography>
          <Typography color='text.secondary'>
            {open?.email}
            {open?.phone ? ` · ${open.phone}` : ''}
          </Typography>
          <Typography sx={{ whiteSpace: 'pre-wrap' }}>{open?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => open && void patch(open.id, 'replied')}>Mark replied</Button>
          <Button onClick={() => open && void patch(open.id, 'archived')}>Archive</Button>
          <Button onClick={() => setOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default ContactManager
