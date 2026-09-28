'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { toast } from 'react-toastify'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import RentCalendar from '@admin/views/RentCalendar'
import RentPreviewDialog, { type PreviewProduct } from '@admin/views/RentPreviewDialog'
import RentFormDialog, { emptyRentForm, type RentFormValue } from '@admin/views/RentFormDialog'
import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import type { RentBooking } from '@/libs/rentals'

type ProductOption = PreviewProduct & {
  id: string
  listingType: string
}

type RentalRow = RentBooking

const toForm = (row?: Partial<RentalRow> | null, dates?: { startDate: string; endDate: string }): RentFormValue => ({
  ...emptyRentForm,
  ...row,
  id: row?.id || '',
  productId: row?.productId || '',
  productSlug: row?.productSlug || '',
  size: row?.size || 'M',
  startDate: dates?.startDate || row?.startDate || '',
  endDate: dates?.endDate || dates?.startDate || row?.endDate || '',
  startTime: row?.startTime || '10:00',
  endTime: row?.endTime || '18:00',
  customerName: row?.customerName || '',
  customerPhone: row?.customerPhone || '',
  customerEmail: row?.customerEmail || '',
  notes: row?.notes || '',
  status: row?.status || 'booked'
})

const statusColor = (status: RentalRow['status']) => {
  if (status === 'ongoing') return 'warning'
  if (status === 'returned') return 'success'
  if (status === 'cancelled') return 'default'

  return 'info'
}

const RentBookingManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<RentalRow>('/api/admin/rentals', { extraParams })
  const [products, setProducts] = useState<ProductOption[]>([])
  const [form, setForm] = useState<RentFormValue>(emptyRentForm)
  const [open, setOpen] = useState(false)
  const [bookings, setBookings] = useState<RentalRow[]>([])
  const [preview, setPreview] = useState<RentalRow | null>(null)

  const loadBookings = async () => {
    const res = await fetch('/api/admin/rentals?all=1')
    const json = await res.json()

    setBookings(Array.isArray(json.data) ? json.data : [])
  }

  useEffect(() => {
    fetch('/api/admin/products?limit=100')
      .then(res => res.json())
      .then(json => setProducts(json.data || []))
      .catch(() => setProducts([]))

    void loadBookings()
  }, [])

  const save = async (values: RentFormValue) => {
    let res: Response

    try {
      res = await fetch(values.id ? `/api/admin/rentals/${values.id}` : '/api/admin/rentals', {
        method: values.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
    } catch {
      toast.error('Could not save rental. Please try again.')
      throw new Error('Network error')
    }

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(json.message || 'Could not save rental. Please try again.')
      throw new Error(json.message || 'Save failed')
    }

    toast.success(values.id ? 'Rental updated successfully' : 'Rental saved successfully')
    setOpen(false)
    setForm(emptyRentForm)
    await table.reload()
    await loadBookings()
  }

  const openAdd = (dates?: { startDate: string; endDate: string }) => {
    setForm(toForm(null, dates))
    setOpen(true)
  }

  const saveDates = async (row: RentalRow) => {
    const res = await fetch(`/api/admin/rentals/${row.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row)
    })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(json.message || 'Could not update rental dates')
      await loadBookings()

      return
    }

    toast.success('Rental dates updated')
    await table.reload()
    await loadBookings()
  }

  const removeBooking = async (row: RentalRow) => {
    const res = await fetch(`/api/admin/rentals/${row.id}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      toast.error(json.message || 'Could not delete rental')

      return
    }

    toast.success('Rental deleted')
    await Promise.all([table.reload(), loadBookings()])
  }

  return (
    <>
      <Card className='overflow-visible mbe-6'>
        <AppFullCalendar className='app-calendar'>
          <RentCalendar bookings={bookings} onAdd={openAdd} onSelect={row => setPreview(row)} onDatesChange={row => void saveDates(row)} />
        </AppFullCalendar>
      </Card>
      <AdminDataTable
        title='Rent bookings'
        subtitle='Track who rented which outfit, size, dates and time period.'
        search={table.search}
        searchPlaceholder='Search customer, phone or product...'
        onSearchChange={table.setSearch}
        onRefresh={() => {
          void table.reload()
          void loadBookings()
        }}
        actions={
          <>
            <TextField select size='small' label='Status' value={statusFilter} onChange={event => setStatusFilter(event.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='booked'>Booked</MenuItem>
              <MenuItem value='ongoing'>Ongoing</MenuItem>
              <MenuItem value='returned'>Returned</MenuItem>
              <MenuItem value='cancelled'>Cancelled</MenuItem>
            </TextField>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => openAdd()}>
              Add rental
            </Button>
          </>
        }
        columns={[
          {
            id: 'product',
            label: 'Outfit',
            render: row => (
              <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {row.productImage ? <img src={row.productImage} alt='' width={40} height={54} style={{ objectFit: 'cover', borderRadius: 4 }} /> : null}
                {row.productName}
              </span>
            )
          },
          { id: 'size', label: 'Size' },
          {
            id: 'period',
            label: 'Period',
            render: row => (
              <span>
                {row.startDate} {row.startTime || ''} → {row.endDate} {row.endTime || ''}
              </span>
            )
          },
          {
            id: 'customer',
            label: 'Customer',
            render: row => (
              <span>
                {row.customerName}
                <br />
                {row.customerPhone}
              </span>
            )
          },
          {
            id: 'status',
            label: 'Status',
            render: row => <Chip size='small' color={statusColor(row.status)} label={row.status} />
          },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <>
                <IconButton
                  size='small'
                  onClick={() => {
                    setForm(toForm(row))
                    setOpen(true)
                  }}
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton size='small' color='error' onClick={() => void removeBooking(row)}>
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
        emptyText='No rent bookings yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />
      <RentPreviewDialog
        open={Boolean(preview)}
        booking={preview}
        product={products.find(item => item.slug === preview?.productSlug) || { slug: preview?.productSlug || '', imageUrl: preview?.productImage, name: preview?.productName }}
        onClose={() => setPreview(null)}
        onEdit={() => {
          if (!preview) return

          setForm(toForm(preview))
          setPreview(null)
          setOpen(true)
        }}
      />
      <RentFormDialog open={open} initial={form} products={products} availability='' onClose={() => setOpen(false)} onSave={save} />
    </>
  )
}

export default RentBookingManager
