'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import {
  PAYMENT_METHOD_TYPES,
  paymentMethodIcon,
  paymentMethodTypeLabel,
  type PaymentMethod,
  type PaymentMethodStatus,
  type PaymentMethodType
} from '@/libs/payment-methods-types'

const emptyForm = {
  id: '',
  title: '',
  type: 'cod' as PaymentMethodType,
  details: '',
  instructions: '',
  sortOrder: '1',
  status: 'active' as PaymentMethodStatus
}

const PaymentMethodManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<PaymentMethod>('/api/admin/payment-methods', { extraParams })
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [razorpayReady, setRazorpayReady] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/payments/razorpay')
      .then(res => (res.ok ? res.json() : null))
      .then(json => setRazorpayReady(Boolean(json?.enabled)))
      .catch(() => setRazorpayReady(false))
  }, [])

  const save = async () => {
    setError('')

    const payload = {
      title: form.title,
      type: form.type,
      details: form.details,
      instructions: form.instructions,
      sortOrder: Number(form.sortOrder) || 0,
      status: form.status
    }
    const res = await fetch(form.id ? `/api/admin/payment-methods/${form.id}` : '/api/admin/payment-methods', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Save failed')

      return
    }

    setOpen(false)
    setForm(emptyForm)
    await table.reload()
  }

  return (
    <>
      {razorpayReady === false ? (
        <Typography color='error' sx={{ mb: 2 }}>
          Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server, then restart the app. The secret is never sent to the shop.
        </Typography>
      ) : null}
      <AdminDataTable
        title='Payment methods'
        subtitle='Methods shown on checkout. Razorpay opens its own payment window for UPI, cards, netbanking and EMI. The secret key stays on the server.'
        search={table.search}
        searchPlaceholder='Search payment methods...'
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
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </TextField>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                setError('')
                setForm({ ...emptyForm, sortOrder: String((table.rows?.length || 0) + 1) })
                setOpen(true)
              }}
            >
              Add method
            </Button>
          </>
        }
        columns={[
          {
            id: 'title',
            label: 'Method',
            render: row => (
              <span className='flex items-center gap-2'>
                <i className={paymentMethodIcon(row.type)} />
                <strong>{row.title}</strong>
              </span>
            )
          },
          { id: 'type', label: 'Type', render: row => paymentMethodTypeLabel(row.type) },
          { id: 'details', label: 'Pay to / details', render: row => row.details || '—' },
          { id: 'sortOrder', label: 'Order' },
          {
            id: 'status',
            label: 'Checkout',
            render: row => (
              <Switch
                size='small'
                checked={row.status === 'active'}
                onChange={() =>
                  void fetch(`/api/admin/payment-methods/${row.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: row.status === 'active' ? 'inactive' : 'active' })
                  }).then(() => table.reload())
                }
              />
            )
          },
          {
            id: 'actions',
            label: '',
            render: row => (
              <>
                <IconButton
                  size='small'
                  onClick={() => {
                    setError('')
                    setForm({
                      id: row.id,
                      title: row.title,
                      type: row.type,
                      details: row.details || '',
                      instructions: row.instructions || '',
                      sortOrder: String(row.sortOrder || 0),
                      status: row.status
                    })
                    setOpen(true)
                  }}
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton
                  size='small'
                  onClick={() => void fetch(`/api/admin/payment-methods/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}
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
        emptyText='No payment methods yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{form.id ? 'Edit payment method' : 'Add payment method'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          <TextField label='Name on checkout' value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} />
          <TextField
            select
            label='Type'
            value={form.type}
            onChange={event => setForm(current => ({ ...current, type: event.target.value as PaymentMethodType }))}
          >
            {PAYMENT_METHOD_TYPES.map(item => (
              <MenuItem key={item.id} value={item.id}>
                {item.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={form.type === 'upi' ? 'UPI ID' : form.type === 'bank' ? 'Account details' : 'Pay-to details (optional)'}
            value={form.details}
            onChange={event => setForm(current => ({ ...current, details: event.target.value }))}
            helperText={
              form.type === 'razorpay'
                ? 'Checkout opens Razorpay. Enable EMI in your Razorpay dashboard if you want EMI plans.'
                : 'Shown on checkout. Example: jagus@upi or account number.'
            }
          />
          <TextField
            label='Instructions'
            value={form.instructions}
            onChange={event => setForm(current => ({ ...current, instructions: event.target.value }))}
            multiline
            minRows={3}
            helperText='Short note the customer reads before placing the order.'
          />
          <TextField
            label='Sort order'
            type='number'
            value={form.sortOrder}
            onChange={event => setForm(current => ({ ...current, sortOrder: event.target.value }))}
          />
          <TextField
            select
            label='Status'
            value={form.status}
            onChange={event => setForm(current => ({ ...current, status: event.target.value as PaymentMethodStatus }))}
          >
            <MenuItem value='active'>Active on checkout</MenuItem>
            <MenuItem value='inactive'>Hidden</MenuItem>
          </TextField>
          {error ? (
            <Typography color='error' variant='body2'>
              {error}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={() => void save()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PaymentMethodManager
