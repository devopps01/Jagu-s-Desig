'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { AdminDataTable } from '@admin/components/table'
import { adminApi } from '@admin/libs/adminApi'
import CancelRefundDialog from '@admin/views/CancelRefundDialog'
import { saleOrderBill, saleToBill, type SaleRow } from '@admin/views/saleBill'
import type { RentBill } from '@admin/views/rentBill'
import { rentPayable } from '@admin/views/rentBill'
import { linePayable } from '@/libs/return-fee'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

const rupee = (value: number) => `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`

const SaleStorePage = () => {
  const [sales, setSales] = useState<SaleRow[]>([])
  const [cancelRow, setCancelRow] = useState<SaleRow | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [cancelPage, setCancelPage] = useState(1)
  const [cancelLimit, setCancelLimit] = useState(10)
  const [bill, setBill] = useState<RentBill | null>(null)

  const load = async () => {
    const result = await adminApi<{ data?: SaleRow[] }>('/api/admin/sales', undefined, { silentSuccess: true })

    setSales(Array.isArray(result.data?.data) ? result.data.data : [])
  }

  useEffect(() => {
    void load()
  }, [])

  const matched = useMemo(() => {
    const query = search.trim().toLowerCase()

    return sales.filter(row => {
      const text = `${row.productName} ${row.size} ${row.customerName} ${row.customerPhone}`.toLowerCase()

      return !query || text.includes(query)
    })
  }, [sales, search])
  const active = matched.filter(row => row.status !== 'cancelled')
  const cancelled = matched.filter(row => row.status === 'cancelled')
  const rows = active.slice((page - 1) * limit, page * limit)
  const cancelledRows = cancelled.slice((cancelPage - 1) * cancelLimit, cancelPage * cancelLimit)
  const activeBill = (row: SaleRow) => {
    const lines = row.orderKey ? active.filter(item => item.orderKey === row.orderKey) : [row]

    return saleOrderBill(lines.length ? lines : [row])
  }

  return (
    <>
      <AdminDataTable
        title='Sale store'
        subtitle='Each outfit on a bill can be cancelled on its own. Cancelled outfits leave this list and go back into selling stock.'
        search={search}
        searchPlaceholder='Outfit, size or mobile...'
        onSearchChange={value => {
          setPage(1)
          setCancelPage(1)
          setSearch(value)
        }}
        onRefresh={() => void load()}
        columns={[
          {
            id: 'outfit',
            label: 'Outfit',
            render: row => (
              <div>
                <Typography fontWeight={600}>{row.productName}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {row.size} · Qty {row.quantity}
                </Typography>
              </div>
            )
          },
          { id: 'customer', label: 'Customer', render: row => row.customerName },
          { id: 'phone', label: 'Mobile', render: row => row.customerPhone },
          {
            id: 'total',
            label: 'Total',
            render: row => `₹${rentPayable(saleToBill(row)).toLocaleString('en-IN')}`
          },
          {
            id: 'date',
            label: 'Date',
            render: row => new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          },
          {
            id: 'bill',
            label: 'Bill',
            render: row => (
              <IconButton size='small' color='primary' aria-label='Bill' title='Bill' onClick={() => setBill(activeBill(row))}>
                <i className='tabler-receipt' />
              </IconButton>
            )
          },
          {
            id: 'delete',
            label: '',
            render: row => (
              <IconButton size='small' color='error' aria-label='Cancel' title='Cancel' onClick={() => setCancelRow(row)}>
                <i className='tabler-circle-x' />
              </IconButton>
            )
          }
        ]}
        rows={rows}
        rowKey={row => row.id}
        total={active.length}
        page={page}
        limit={limit}
        emptyText='No sales yet. Sell an outfit to see it here.'
        onPageChange={setPage}
        onLimitChange={value => {
          setLimit(value)
          setPage(1)
        }}
      />
      <div className='mbs-6' />
      <AdminDataTable
        title='Cancelled sales'
        subtitle='Each cancelled outfit shows the return fee kept and the amount given back.'
        search={search}
        hideSearch
        onSearchChange={() => undefined}
        onRefresh={() => void load()}
        columns={[
          {
            id: 'outfit',
            label: 'Outfit',
            render: row => (
              <div>
                <Typography fontWeight={600}>{row.productName}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {row.size} · Qty {row.quantity}
                </Typography>
              </div>
            )
          },
          { id: 'customer', label: 'Customer', render: row => row.customerName },
          { id: 'phone', label: 'Mobile', render: row => row.customerPhone },
          { id: 'total', label: 'Bill', render: row => rupee(linePayable(row)) },
          { id: 'paid', label: 'Paid', render: row => rupee(row.paidAmount) },
          { id: 'fee', label: 'Return fee', render: row => rupee(row.returnFee || 0) },
          { id: 'refund', label: 'Returned', render: row => rupee(row.refundAmount || 0) },
          {
            id: 'date',
            label: 'Cancelled',
            render: row => new Date(row.cancelledAt || row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          }
        ]}
        rows={cancelledRows}
        rowKey={row => row.id}
        total={cancelled.length}
        page={cancelPage}
        limit={cancelLimit}
        emptyText='No cancelled outfits.'
        onPageChange={setCancelPage}
        onLimitChange={value => {
          setCancelLimit(value)
          setCancelPage(1)
        }}
      />
      <CancelRefundDialog
        open={Boolean(cancelRow)}
        outfit={cancelRow ? `${cancelRow.productName}, size ${cancelRow.size}` : ''}
        detail='Only this outfit leaves the bill. Its quantity goes back to selling stock.'
        payable={cancelRow ? linePayable(cancelRow) : 0}
        paid={cancelRow?.paidAmount || 0}
        onClose={() => setCancelRow(null)}
        onConfirm={async returnFee => {
          if (!cancelRow) return

          const result = await adminApi(
            `/api/admin/sales/${cancelRow.id}`,
            { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', returnFee }) },
            { successMessage: 'Outfit cancelled' }
          )

          if (!result.ok) return

          setCancelRow(null)
          await load()
        }}
      />
      <RentBillDialog open={Boolean(bill)} bill={bill} onClose={() => setBill(null)} />
    </>
  )
}

export default SaleStorePage
