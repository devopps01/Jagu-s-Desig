'use client'

import { useEffect, useMemo, useState } from 'react'

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
import { formatPrice } from '@web/data/catalog'
import { cancelReasons, returnReasons, type OrderRequestStatus, type OrderRequestType } from '@/libs/order-request-types'

type RequestRow = {
  id: string
  type: OrderRequestType
  status: OrderRequestStatus
  orderId: string
  orderNo: string
  userEmail: string
  customerName: string
  customerPhone: string
  items: { title: string; qty: number; size?: string }[]
  reason: string
  note: string
  refundAmount: number
  adminNote: string
  createdAt: string
}

const reasonLabel = (type: OrderRequestType, reason: string) =>
  [...cancelReasons, ...returnReasons].find(item => item.id === reason)?.label || reason

const statusColor = (status: OrderRequestStatus) => {
  if (status === 'completed' || status === 'approved') return 'success'
  if (status === 'rejected') return 'default'
  return 'warning'
}

const OrderRequestManager = () => {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('requested')
  const extraParams = useMemo(() => ({ type: typeFilter, status: statusFilter }), [statusFilter, typeFilter])
  const table = useServerTable<RequestRow>('/api/admin/order-requests', { extraParams })
  const [counts, setCounts] = useState({ all: 0, requested: 0, cancel: 0, return: 0 })
  const [open, setOpen] = useState<RequestRow | null>(null)
  const [adminNote, setAdminNote] = useState('')

  const loadCounts = async () => {
    const res = await fetch('/api/admin/order-requests?counts=1')
    const json = await res.json()

    if (res.ok) setCounts(json)
  }

  useEffect(() => {
    void loadCounts()
  }, [table.rows])

  const patch = async (id: string, status: OrderRequestStatus) => {
    await fetch(`/api/admin/order-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote })
    })
    setOpen(null)
    await table.reload()
    await loadCounts()
  }

  const cards = [
    { label: 'Open requests', value: counts.requested, icon: 'tabler-clock' },
    { label: 'Cancel', value: counts.cancel, icon: 'tabler-x' },
    { label: 'Return', value: counts.return, icon: 'tabler-truck-return' },
    { label: 'All', value: counts.all, icon: 'tabler-inbox' }
  ]

  return (
    <Grid container spacing={6}>
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
          title='Cancel & returns'
          subtitle='Approve a cancel before dispatch. Complete a return after the piece comes back.'
          search={table.search}
          searchPlaceholder='Search order, phone or reason...'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          actions={
            <>
              <TextField
                select
                size='small'
                label='Type'
                value={typeFilter}
                onChange={event => {
                  table.setPage(1)
                  setTypeFilter(event.target.value)
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='cancel'>Cancel</MenuItem>
                <MenuItem value='return'>Return</MenuItem>
              </TextField>
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
                <MenuItem value='requested'>Requested</MenuItem>
                <MenuItem value='approved'>Approved</MenuItem>
                <MenuItem value='rejected'>Rejected</MenuItem>
                <MenuItem value='completed'>Completed</MenuItem>
              </TextField>
            </>
          }
          columns={[
            { id: 'orderNo', label: 'Order', render: row => <strong>{row.orderNo}</strong> },
            {
              id: 'type',
              label: 'Type',
              render: row => <Chip size='small' color={row.type === 'cancel' ? 'secondary' : 'info'} label={row.type} className='capitalize' />
            },
            {
              id: 'customer',
              label: 'Customer',
              render: row => (
                <div>
                  {row.customerName}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{row.customerPhone || row.userEmail}</div>
                </div>
              )
            },
            { id: 'reason', label: 'Reason', render: row => reasonLabel(row.type, row.reason) },
            {
              id: 'status',
              label: 'Status',
              render: row => <Chip size='small' color={statusColor(row.status)} label={row.status} className='capitalize' />
            },
            { id: 'refundAmount', label: 'Refund', render: row => (row.refundAmount ? formatPrice(row.refundAmount) : '—') },
            { id: 'createdAt', label: 'Asked', render: row => new Date(row.createdAt).toLocaleString() },
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
                      setAdminNote(row.adminNote || '')
                    }}
                  >
                    <i className='tabler-eye' />
                  </IconButton>
                  {row.status === 'requested' ? (
                    <IconButton size='small' title='Approve' onClick={() => void patch(row.id, row.type === 'cancel' ? 'approved' : 'approved')}>
                      <i className='tabler-check' />
                    </IconButton>
                  ) : null}
                  {row.type === 'return' && row.status === 'approved' ? (
                    <IconButton size='small' title='Mark returned' onClick={() => void patch(row.id, 'completed')}>
                      <i className='tabler-checks' />
                    </IconButton>
                  ) : null}
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
          emptyText='No cancel or return requests yet.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} fullWidth maxWidth='sm'>
        <DialogTitle>
          {open?.type === 'cancel' ? 'Cancel' : 'Return'} · {open?.orderNo}
        </DialogTitle>
        <DialogContent className='flex flex-col gap-3'>
          <Typography>
            {open?.customerName} · {open?.customerPhone}
          </Typography>
          <Typography color='text.secondary'>{open ? reasonLabel(open.type, open.reason) : ''}</Typography>
          {open?.note ? <Typography sx={{ whiteSpace: 'pre-wrap' }}>{open.note}</Typography> : null}
          {open?.items.map(item => (
            <Typography key={item.title} variant='body2'>
              {item.title}
              {item.size ? ` · ${item.size}` : ''} × {item.qty}
            </Typography>
          ))}
          <TextField label='Admin note' value={adminNote} onChange={event => setAdminNote(event.target.value)} multiline minRows={2} />
        </DialogContent>
        <DialogActions>
          {open?.status === 'requested' ? (
            <>
              <Button color='inherit' onClick={() => open && void patch(open.id, 'rejected')}>
                Reject
              </Button>
              <Button variant='contained' onClick={() => open && void patch(open.id, 'approved')}>
                Approve
              </Button>
            </>
          ) : null}
          {open?.type === 'return' && open.status === 'approved' ? (
            <Button variant='contained' onClick={() => void patch(open.id, 'completed')}>
              Mark returned
            </Button>
          ) : null}
          <Button onClick={() => setOpen(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default OrderRequestManager
