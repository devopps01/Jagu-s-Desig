'use client'

import { useMemo, useState } from 'react'

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
import { formatPrice } from '@web/data/catalog'
import type { OfferType } from '@/libs/offers'

type DiscountRow = {
  id: string
  code: string
  type: OfferType
  value: number
  minSubtotal: number
  note: string
  status: 'active' | 'inactive'
}

const emptyForm = {
  id: '',
  code: '',
  type: 'percent' as OfferType,
  value: '10',
  minSubtotal: '0',
  note: '',
  status: 'active' as 'active' | 'inactive'
}

const DiscountManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<DiscountRow>('/api/admin/discounts', { extraParams })
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  const save = async () => {
    setError('')
    const payload = {
      code: form.code,
      type: form.type,
      value: Number(form.value) || 0,
      minSubtotal: Number(form.minSubtotal) || 0,
      note: form.note,
      status: form.status
    }
    const res = await fetch(form.id ? `/api/admin/discounts/${form.id}` : '/api/admin/discounts', {
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
      <AdminDataTable
        title='Discounts'
        subtitle='Create coupon codes that customers can apply on checkout.'
        search={table.search}
        searchPlaceholder='Search discount codes...'
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
                setForm(emptyForm)
                setOpen(true)
              }}
            >
              Add discount
            </Button>
          </>
        }
        columns={[
          { id: 'code', label: 'Code', render: row => <strong>{row.code}</strong> },
          {
            id: 'offer',
            label: 'Offer',
            render: row => (row.type === 'percent' ? `${row.value}% off` : `${formatPrice(row.value)} off`)
          },
          {
            id: 'min',
            label: 'Min. bag',
            render: row => (row.minSubtotal ? formatPrice(row.minSubtotal) : 'No minimum')
          },
          { id: 'note', label: 'Note' },
          {
            id: 'status',
            label: 'Active',
            render: row => (
              <Switch
                size='small'
                checked={row.status === 'active'}
                onChange={() =>
                  void fetch(`/api/admin/discounts/${row.id}`, {
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
                      code: row.code,
                      type: row.type,
                      value: String(row.value),
                      minSubtotal: String(row.minSubtotal || 0),
                      note: row.note || '',
                      status: row.status
                    })
                    setOpen(true)
                  }}
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton size='small' onClick={() => void fetch(`/api/admin/discounts/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}>
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
        emptyText='No discount codes yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{form.id ? 'Edit discount' : 'Add discount'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          <TextField label='Code' value={form.code} onChange={event => setForm(current => ({ ...current, code: event.target.value }))} helperText='Example: NAVRATRI10' />
          <TextField select label='Type' value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as OfferType }))}>
            <MenuItem value='percent'>Percent off</MenuItem>
            <MenuItem value='fixed'>Fixed amount off</MenuItem>
          </TextField>
          <TextField label={form.type === 'percent' ? 'Percent' : 'Amount (₹)'} type='number' value={form.value} onChange={event => setForm(current => ({ ...current, value: event.target.value }))} />
          <TextField label='Minimum bag total (₹)' type='number' value={form.minSubtotal} onChange={event => setForm(current => ({ ...current, minSubtotal: event.target.value }))} />
          <TextField label='Note' value={form.note} onChange={event => setForm(current => ({ ...current, note: event.target.value }))} />
          <TextField select label='Status' value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
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

export default DiscountManager
