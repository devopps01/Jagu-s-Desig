'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
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
import { useConfirmDelete } from '@admin/hooks/useConfirmDelete'
import { adminApi, adminMutate } from '@admin/libs/adminApi'
import { printInvoice, type InvoiceOrder } from '@admin/views/orderInvoice'
import { formatPrice } from '@web/data/catalog'
import type { OrderStatus, PaymentStatus } from '@/libs/orders'

type OrderRow = InvoiceOrder

const flow: { id: OrderStatus | ''; label: string; hint: string; icon: string }[] = [
  { id: '', label: 'All', hint: 'Every order', icon: 'tabler-list' },
  { id: 'pending', label: 'New', hint: 'Awaiting confirm', icon: 'tabler-clock' },
  { id: 'confirmed', label: 'Confirmed', hint: 'Ready to pack', icon: 'tabler-circle-check' },
  { id: 'packed', label: 'Packed', hint: 'Ready to ship', icon: 'tabler-package' },
  { id: 'shipped', label: 'Shipped', hint: 'On the way', icon: 'tabler-truck' },
  { id: 'delivered', label: 'Delivered', hint: 'Completed', icon: 'tabler-home-check' },
  { id: 'cancelled', label: 'Cancelled', hint: 'Stopped', icon: 'tabler-x' },
  { id: 'returned', label: 'Returned', hint: 'Sent back', icon: 'tabler-truck-return' }
]

const nextStatus: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: 'confirmed',
  confirmed: 'packed',
  packed: 'shipped',
  shipped: 'delivered'
}

const statusLabel = (status: string) => flow.find(item => item.id === status)?.label || status

const canCancel = (status: string) => ['pending', 'confirmed', 'packed', 'shipped'].includes(status)

const statusColor = (status: string) => {
  if (status === 'delivered') return 'success'
  if (status === 'cancelled' || status === 'returned') return 'default'
  if (status === 'shipped' || status === 'packed') return 'info'
  if (status === 'confirmed') return 'warning'

  return 'secondary'
}

type FlowStepProps = {
  item: (typeof flow)[number]
  count: number
  active: boolean
  onSelect: () => void
}

const OrderFlowStep = ({ item, count, active, onSelect }: FlowStepProps) => (
  <Box
    component='button'
    type='button'
    onClick={onSelect}
    title={item.hint}
    sx={{
      flex: '0 0 auto',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 1,
      minWidth: 0,
      px: 1.25,
      py: 0.75,
      border: 1,
      borderColor: active ? 'primary.main' : 'divider',
      borderRadius: 1.5,
      cursor: 'pointer',
      bgcolor: active ? 'primary.main' : 'transparent',
      color: active ? 'primary.contrastText' : 'text.primary',
      transition: theme => theme.transitions.create(['background-color', 'border-color']),
      '&:hover': {
        borderColor: 'primary.main',
        bgcolor: active ? 'primary.dark' : 'action.hover'
      }
    }}
  >
    <i className={`${item.icon} text-base shrink-0`} style={{ opacity: active ? 1 : 0.75 }} />
    <Typography variant='body2' className='font-medium leading-none whitespace-nowrap'>
      {item.label}
    </Typography>
    <Box
      component='span'
      sx={{
        minWidth: 22,
        height: 20,
        px: 0.75,
        borderRadius: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        fontWeight: 700,
        lineHeight: 1,
        bgcolor: active ? 'rgba(255,255,255,0.22)' : 'action.selected',
        color: active ? 'inherit' : 'text.primary'
      }}
    >
      {count}
    </Box>
  </Box>
)

const OrderManager = () => {
  const { askDelete, confirmDialog } = useConfirmDelete()
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter, payment: paymentFilter }), [paymentFilter, statusFilter])
  const table = useServerTable<OrderRow>('/api/admin/orders', { extraParams })
  const [open, setOpen] = useState<OrderRow | null>(null)
  const [counts, setCounts] = useState<Record<string, number>>({ all: 0 })

  const loadCounts = async () => {
    const result = await adminApi<Record<string, number>>('/api/admin/orders?counts=1', undefined, { silentSuccess: true })

    if (result.ok) setCounts(result.data)
  }

  useEffect(() => {
    void loadCounts()
  }, [table.rows])

  const patch = async (id: string, payload: { status?: OrderStatus; payment?: PaymentStatus }) => {
    await adminMutate(
      `/api/admin/orders/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      { successMessage: payload.status === 'cancelled' ? 'Order cancelled' : 'Order updated' }
    )
    await table.reload()
    await loadCounts()
    if (open?.id === id) {
      const result = await adminApi<OrderRow>(`/api/admin/orders/${id}`, undefined, { silentSuccess: true })

      if (result.ok) setOpen(result.data)
    }
  }

  const cancelOrder = (row: OrderRow) => {
    const paid = row.payment === 'paid'

    askDelete({
      title: 'Cancel this order?',
      message: paid
        ? `${row.orderNo} will be cancelled and the payment marked as refunded. Those outfits can be sold again.`
        : `${row.orderNo} will be cancelled. Those outfits can be sold again.`,
      confirmLabel: 'Yes, cancel order',
      cancelLabel: 'Keep order',
      icon: 'tabler-circle-x',
      onConfirm: () => patch(row.id, { status: 'cancelled' })
    })
  }

  const setFilter = (status: string) => {
    table.setPage(1)
    setStatusFilter(status)
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-1'>
              Order flow
            </Typography>
            <Typography color='text.secondary' className='mbe-4'>
              Filter by status. Move an order along New → Confirmed → Packed → Shipped → Delivered.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: 1,
                width: '100%',
                overflowX: 'auto',
                pb: 0.5,
                scrollbarWidth: 'thin'
              }}
            >
              {flow.map(item => {
                const count = item.id ? counts[item.id] || 0 : counts.all || 0
                const active = statusFilter === item.id
                const showDivider = item.id === 'cancelled'

                return (
                  <Fragment key={item.label}>
                    {showDivider ? (
                      <Box
                        aria-hidden
                        sx={{ width: '1px', height: 22, flexShrink: 0, bgcolor: 'divider', mx: 0.25 }}
                      />
                    ) : null}
                    <OrderFlowStep item={item} count={count} active={active} onSelect={() => setFilter(item.id)} />
                  </Fragment>
                )
              })}
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <AdminDataTable
          title='Orders & billing'
          subtitle={`${table.total} ${statusFilter ? statusLabel(statusFilter).toLowerCase() : ''} orders. Update the next step or print the bill.`}
          search={table.search}
          searchPlaceholder='Search order, phone, name...'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          actions={
            <TextField
              select
              size='small'
              label='Payment'
              value={paymentFilter}
              onChange={event => {
                table.setPage(1)
                setPaymentFilter(event.target.value)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=''>All payments</MenuItem>
              <MenuItem value='cod'>COD</MenuItem>
              <MenuItem value='paid'>Paid</MenuItem>
              <MenuItem value='refunded'>Refunded</MenuItem>
            </TextField>
          }
          columns={[
            { id: 'orderNo', label: 'Order', render: row => <strong>{row.orderNo}</strong> },
            { id: 'invoiceNo', label: 'Invoice' },
            {
              id: 'customer',
              label: 'Customer',
              render: row => (
                <div>
                  <div>{row.customer?.name}</div>
                  <Typography variant='caption'>{row.customer?.phone}</Typography>
                </div>
              )
            },
            {
              id: 'total',
              label: 'To pay',
              render: row => (
                <div>
                  <strong>{formatPrice(row.total)}</strong>
                  {row.discountAmount ? (
                    <Typography variant='caption' display='block' sx={{ color: '#1f7a4d' }}>
                      Coupon {row.discountCode || ''} − {formatPrice(row.discountAmount)}
                    </Typography>
                  ) : null}
                </div>
              )
            },
            {
              id: 'status',
              label: 'Status',
              render: row => (
                <div>
                  <Chip size='small' color={statusColor(row.status)} label={statusLabel(row.status)} />
                  {row.cancelRequestStatus === 'requested' ? (
                    <div>
                      <Chip size='small' color='warning' label='Cancel asked' sx={{ mt: 1 }} />
                    </div>
                  ) : null}
                  {row.returnRequestStatus === 'requested' || row.returnRequestStatus === 'approved' ? (
                    <div>
                      <Chip size='small' color='info' label={`Return ${row.returnRequestStatus}`} sx={{ mt: 1 }} />
                    </div>
                  ) : null}
                </div>
              )
            },
            { id: 'payment', label: 'Pay', render: row => `${row.payment === 'paid' ? 'Paid' : row.payment === 'refunded' ? 'Refunded' : 'COD'}${row.paymentMethodTitle ? ` · ${row.paymentMethodTitle}` : ''}` },
            {
              id: 'createdAt',
              label: 'Date',
              render: row => new Date(row.createdAt).toLocaleString()
            },
            {
              id: 'flow',
              label: 'Next',
              render: row => {
                const next = nextStatus[row.status as OrderStatus]

                if (!next) return '—'

                const step = flow.find(item => item.id === next)

                return (
                  <IconButton size='small' color='primary' title={`Mark ${statusLabel(next)}`} aria-label={`Mark ${statusLabel(next)}`} onClick={() => void patch(row.id, { status: next })}>
                    <i className={step?.icon || 'tabler-arrow-right'} />
                  </IconButton>
                )
              }
            },
            {
              id: 'actions',
              label: '',
              render: row => (
                <>
                  <IconButton size='small' onClick={() => setOpen(row)} aria-label='View bill'>
                    <i className='tabler-file-invoice' />
                  </IconButton>
                  <IconButton size='small' onClick={() => printInvoice(row)} aria-label='Print'>
                    <i className='tabler-printer' />
                  </IconButton>
                  {canCancel(row.status) ? (
                    <IconButton size='small' color='error' aria-label='Cancel order' title='Cancel order' onClick={() => cancelOrder(row)}>
                      <i className='tabler-circle-x' />
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
          emptyText='No orders in this status.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>

      <Dialog open={Boolean(open)} onClose={() => setOpen(null)} fullWidth maxWidth='md'>
        <DialogTitle>
          {open?.orderNo} · {open?.invoiceNo}
        </DialogTitle>
        {open ? (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
            <Typography>
              {open.customer.name} · {open.customer.phone}
              <br />
              {[open.customer.address, open.customer.locality, open.customer.city, open.customer.state, open.customer.pincode]
                .filter(Boolean)
                .join(', ')}
            </Typography>
            {open.items.map(item => (
              <Typography key={`${item.title}-${item.qty}-${item.lineTotal}`} variant='body2'>
                {item.title}
                {item.size ? ` · Size ${item.size}` : ''} × {item.qty} — {formatPrice(item.lineTotal)}
              </Typography>
            ))}
            <Box sx={{ display: 'grid', gap: 0.75, maxWidth: 360, ml: 'auto', width: '100%' }}>
              {open.productSavings ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#1f7a4d' }}>
                  <span>Product discount</span>
                  <strong>− {formatPrice(open.productSavings)}</strong>
                </Box>
              ) : null}
              {open.subtotal ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Item total</span>
                  <strong>{formatPrice(open.subtotal)}</strong>
                </Box>
              ) : null}
              {open.discountAmount ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#1f7a4d' }}>
                  <span>Coupon {open.discountCode || ''}</span>
                  <strong>− {formatPrice(open.discountAmount)}</strong>
                </Box>
              ) : null}
              {open.sisterDiscountAmount ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#1f7a4d' }}>
                  <span>Extra offer</span>
                  <strong>− {formatPrice(open.sisterDiscountAmount)}</strong>
                </Box>
              ) : null}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Shipping</span>
                <strong>{open.shipping ? formatPrice(open.shipping) : 'Free'}</strong>
              </Box>
              {open.gstAmount ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {open.gstLabel || 'GST'}
                    {open.gstRate ? ` (${open.gstRate}%)` : ''}
                  </span>
                  <strong>{formatPrice(open.gstAmount)}</strong>
                </Box>
              ) : null}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid', borderColor: 'divider', pt: 1, mt: 0.5 }}>
                <Typography variant='h6'>To pay</Typography>
                <Typography variant='h6'>{formatPrice(open.total)}</Typography>
              </Box>
            </Box>
            <Box className='flex flex-wrap gap-2'>
              {flow
                .filter(item => item.id)
                .map(item => (
                  <Button
                    key={item.id}
                    size='small'
                    variant={open.status === item.id ? 'contained' : 'outlined'}
                    onClick={() => {
                      if (item.id === open.status) return
                      if (item.id === 'cancelled') {
                        if (canCancel(open.status)) cancelOrder(open)

                        return
                      }

                      void patch(open.id, { status: item.id as OrderStatus })
                    }}
                  >
                    {item.label}
                  </Button>
                ))}
            </Box>
            {open.cancelRequestStatus ? <Typography color='text.secondary'>Cancel request: {open.cancelRequestStatus}</Typography> : null}
            {open.returnRequestStatus ? <Typography color='text.secondary'>Return request: {open.returnRequestStatus}</Typography> : null}
            {open.paymentMethodTitle ? (
              <Typography color='text.secondary'>Method: {open.paymentMethodTitle}</Typography>
            ) : null}
            {open.razorpayPaymentId ? (
              <Typography color='text.secondary'>Razorpay payment: {open.razorpayPaymentId}</Typography>
            ) : null}
            {open.razorpayOrderId ? (
              <Typography color='text.secondary'>Razorpay order: {open.razorpayOrderId}</Typography>
            ) : null}
            <TextField
              select
              label='Payment'
              value={open.payment}
              onChange={event => void patch(open.id, { payment: event.target.value as PaymentStatus, status: open.status as OrderStatus })}
            >
              <MenuItem value='cod'>COD</MenuItem>
              <MenuItem value='paid'>Paid</MenuItem>
              <MenuItem value='refunded'>Refunded</MenuItem>
            </TextField>
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={() => open && printInvoice(open, 'slip')}>Print packing slip</Button>
          <Button variant='contained' onClick={() => open && printInvoice(open)}>
            Print bill
          </Button>
        </DialogActions>
      </Dialog>
      {confirmDialog}
    </Grid>
  )
}

export default OrderManager
