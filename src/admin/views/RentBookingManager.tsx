'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { AdminDataTable, useServerTable } from '@admin/components/table'
import { useConfirmDelete } from '@admin/hooks/useConfirmDelete'
import { adminApi, adminMutate } from '@admin/libs/adminApi'
import { loadAdminRentProducts, productNumber } from '@admin/views/RentFormDialog'
import { type RentBill } from '@admin/views/rentBill'
import CancelRefundDialog from '@admin/views/CancelRefundDialog'
import MarkRentReturnedDialog, { type RentReturnPayload, type RentReturnSource } from '@admin/views/MarkRentReturnedDialog'
import { linePayable } from '@/libs/return-fee'
import type { RentBooking } from '@/libs/rentals'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

type ProductOption = {
  id: string
  slug: string
  name?: string
  imageUrl?: string
  listingType?: string
}

type RentalRow = RentBooking

const toBill = (row: RentalRow, products: ProductOption[]): RentBill => {
  const outfit = products.find(item => item.slug === row.productSlug || item.id === row.productId)
  const created = row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt || '')

  return {
    id: row.id,
    productName: row.productName,
    productNo: productNumber(outfit || { imageUrl: row.productImage, id: row.productId, slug: row.productSlug }),
    size: row.size,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime || '10:00',
    endTime: row.endTime || '18:00',
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail || '',
    notes: row.notes || '',
    status: row.status,
    productPrice: row.productPrice || 0,
    finalPrice: row.finalPrice || 0,
    paymentOption: row.paymentOption || 'unpaid',
    paymentMethod: row.paymentMethod || 'Cash',
    paymentNote: row.paymentNote || '',
    paidAmount: row.paidAmount || 0,
    balanceAmount: row.balanceAmount || 0,
    gstEnabled: Boolean(row.gstEnabled),
    gstRate: row.gstRate || 0,
    gstAmount: row.gstAmount || 0,
    discountAmount: row.discountAmount || 0,
    payments: row.payments || [],
    createdAt: created
  }
}

const statusColor = (status: RentalRow['status']) => {
  if (status === 'ongoing') return 'warning'
  if (status === 'returned') return 'success'
  if (status === 'cancelled') return 'default'

  return 'info'
}

const RentBookingManager = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const { askDelete, confirmDialog } = useConfirmDelete()
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const [cancelRow, setCancelRow] = useState<RentalRow | null>(null)
  const [returnRow, setReturnRow] = useState<RentalRow | null>(null)
  const table = useServerTable<RentalRow>('/api/admin/rentals', { extraParams })
  const cancelledTable = useServerTable<RentalRow>('/api/admin/rentals', { extraParams: { status: 'cancelled' } })
  const [products, setProducts] = useState<ProductOption[]>([])
  const [bookings, setBookings] = useState<RentalRow[]>([])
  const [bill, setBill] = useState<RentBill | null>(null)
  const [nowQuery, setNowQuery] = useState('')
  const [nowPage, setNowPage] = useState(1)
  const [nowLimit, setNowLimit] = useState(10)
  const today = useMemo(() => {
    const date = new Date()

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }, [])
  const outNow = useMemo(() => {
    const text = nowQuery.trim().toLowerCase()
    const digits = text.replace(/\D/g, '')

    return bookings.filter(row => {
      if (row.status === 'cancelled' || row.status === 'returned') return false
      if (!row.startDate || !row.endDate || row.startDate > today || row.endDate < today) return false

      if (!text) return true

      const blob = `${row.productName} ${row.size} ${row.customerName} ${row.customerPhone}`.toLowerCase()

      if (blob.includes(text)) return true

      return Boolean(digits && row.customerPhone.replace(/\D/g, '').includes(digits))
    })
  }, [bookings, nowQuery, today])
  const outRows = outNow.slice((nowPage - 1) * nowLimit, nowPage * nowLimit)

  const loadBookings = async () => {
    const result = await adminApi<{ data?: RentalRow[] }>('/api/admin/rentals?all=1', undefined, { silentSuccess: true })

    setBookings(Array.isArray(result.data?.data) ? result.data.data : [])
  }

  useEffect(() => {
    void loadAdminRentProducts().then(setProducts)

    void loadBookings()
  }, [])

  const markReturned = async (payload: RentReturnPayload) => {
    if (!returnRow) return

    const result = await adminApi(
      `/api/admin/rentals/${returnRow.id}`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'return', ...payload }) },
      { successMessage: 'Outfit marked returned' }
    )

    if (!result.ok) return

    setReturnRow(null)
    await Promise.all([table.reload(), loadBookings()])
  }

  const removeBooking = async (row: RentalRow) => {
    await adminMutate(
      `/api/admin/rentals/${row.id}`,
      { method: 'DELETE' },
      { successMessage: 'Rental deleted', errorMessage: 'Could not delete rental' },
      async () => {
        await Promise.all([table.reload(), loadBookings()])
      }
    )
  }

  return (
    <>
      <div className='mbe-6'>
      <AdminDataTable
        title='Out on rent now'
        subtitle={outNow.length === 1 ? '1 outfit is with a customer today.' : `${outNow.length} outfits are with customers today.`}
        search={nowQuery}
        searchPlaceholder='Outfit, size or mobile...'
        onSearchChange={value => {
          setNowPage(1)
          setNowQuery(value)
        }}
        onRefresh={() => void loadBookings()}
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
            id: 'period',
            label: 'Period',
            render: row => (
              <span>
                {row.startDate} → {row.endDate}
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
              <IconButton size='small' color='primary' aria-label='Mark returned' title='Mark returned' onClick={() => setReturnRow(row)}>
                <i className='tabler-package-import' />
              </IconButton>
            )
          }
        ]}
        rows={outRows}
        rowKey={row => row.id}
        total={outNow.length}
        page={nowPage}
        limit={nowLimit}
        emptyText='No outfits are out on rent today.'
        onPageChange={setNowPage}
        onLimitChange={value => {
          setNowLimit(value)
          setNowPage(1)
        }}
      />
      </div>
      <AdminDataTable
        title='Rent store'
        subtitle='Cancel one outfit on a bill. That piece is free to book again and moves to the cancelled list.'
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
            </TextField>
            <Button component={Link} href={`/${lang}/store/rentals/book`} variant='contained' startIcon={<i className='tabler-plus' />}>
              Book rent
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
                {row.customerEmail ? (
                  <>
                    <br />
                    {row.customerEmail}
                  </>
                ) : null}
              </span>
            )
          },
          {
            id: 'payment',
            label: 'Payment',
            render: row => {
              const option = row.paymentOption === 'half' ? 'Half' : row.paymentOption === 'full' ? 'Full' : row.paymentOption === 'custom' ? 'Custom' : 'Unpaid'
              const left = Number(row.balanceAmount) || 0

              return `${option}${row.paymentMethod ? ` · ${row.paymentMethod}` : ''} · ${left ? `₹${left.toLocaleString('en-IN')} left` : 'Paid'}`
            }
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
                <IconButton size='small' color='primary' onClick={() => setBill(toBill(row, products))} aria-label={`Bill for ${row.productName}`}>
                  <i className='tabler-receipt' />
                </IconButton>
                <IconButton size='small' component='a' href={`/rent/${row.productSlug}`} target='_blank' aria-label='Open on rent site'>
                  <i className='tabler-external-link' />
                </IconButton>
                <IconButton size='small' component={Link} href={`/${lang}/store/rentals/book?id=${row.id}`} aria-label={`Edit ${row.productName}`}>
                  <i className='tabler-edit' />
                </IconButton>
                {row.status === 'booked' || row.status === 'ongoing' ? (
                  <IconButton size='small' color='primary' aria-label='Mark returned' title='Mark returned' onClick={() => setReturnRow(row)}>
                    <i className='tabler-package-import' />
                  </IconButton>
                ) : null}
                {row.status === 'booked' || row.status === 'ongoing' ? (
                  <IconButton size='small' color='error' aria-label='Cancel' title='Cancel' onClick={() => setCancelRow(row)}>
                    <i className='tabler-circle-x' />
                  </IconButton>
                ) : (
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() =>
                      askDelete({
                        name: `${row.productName} · ${row.customerName}`,
                        onConfirm: () => void removeBooking(row)
                      })
                    }
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                )}
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
      <div className='mbs-6' />
      <AdminDataTable
        title='Cancelled rentals'
        subtitle='Each cancelled booking shows the return fee kept and the amount given back.'
        search={cancelledTable.search}
        searchPlaceholder='Search customer, phone or product...'
        onSearchChange={cancelledTable.setSearch}
        onRefresh={() => void cancelledTable.reload()}
        columns={[
          { id: 'product', label: 'Outfit', render: row => row.productName },
          { id: 'size', label: 'Size' },
          {
            id: 'period',
            label: 'Period',
            render: row => `${row.startDate} → ${row.endDate}`
          },
          { id: 'customer', label: 'Customer', render: row => row.customerName },
          { id: 'phone', label: 'Mobile', render: row => row.customerPhone },
          { id: 'paid', label: 'Paid', render: row => `₹${Math.round(row.paidAmount || 0).toLocaleString('en-IN')}` },
          { id: 'fee', label: 'Return fee', render: row => `₹${Math.round(row.returnFee || 0).toLocaleString('en-IN')}` },
          { id: 'refund', label: 'Returned', render: row => `₹${Math.round(row.refundAmount || 0).toLocaleString('en-IN')}` }
        ]}
        rows={cancelledTable.rows}
        rowKey={row => row.id}
        total={cancelledTable.total}
        page={cancelledTable.page}
        limit={cancelledTable.limit}
        loading={cancelledTable.loading}
        emptyText='No cancelled rentals.'
        onPageChange={cancelledTable.setPage}
        onLimitChange={cancelledTable.setLimit}
      />
      <RentBillDialog open={Boolean(bill)} bill={bill} onClose={() => setBill(null)} />
      <MarkRentReturnedDialog open={Boolean(returnRow)} source={returnRow as RentReturnSource | null} onClose={() => setReturnRow(null)} onConfirm={markReturned} />
      <CancelRefundDialog
        open={Boolean(cancelRow)}
        outfit={cancelRow ? `${cancelRow.productName}, size ${cancelRow.size}` : ''}
        detail='Only this booking is cancelled. That size is free for those dates again.'
        payable={cancelRow ? linePayable(cancelRow) : 0}
        paid={cancelRow?.paidAmount || 0}
        onClose={() => setCancelRow(null)}
        onConfirm={async returnFee => {
          if (!cancelRow) return

          const result = await adminApi(
            `/api/admin/rentals/${cancelRow.id}`,
            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', returnFee }) },
            { successMessage: 'Booking cancelled' }
          )

          if (!result.ok) return

          setCancelRow(null)
          await Promise.all([table.reload(), cancelledTable.reload(), loadBookings()])
        }}
      />
      {confirmDialog}
    </>
  )
}

export default RentBookingManager
