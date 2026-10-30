'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'

import { AdminDataTable } from '@admin/components/table'
import { adminApi } from '@admin/libs/adminApi'
import { customerKey } from '@admin/views/customerKey'
import { rentCustomers } from '@admin/views/rentCustomers'
import type { RentBooking } from '@/libs/rentals'

const RentCustomersPage = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const [bookings, setBookings] = useState<RentBooking[]>([])
  const [nameQuery, setNameQuery] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const load = async () => {
    const result = await adminApi<{ data?: RentBooking[] }>('/api/admin/rentals?all=1', undefined, { silentSuccess: true })

    setBookings(Array.isArray(result.data?.data) ? result.data.data : [])
  }

  useEffect(() => {
    void load()
  }, [])

  const customers = useMemo(() => {
    const phone = phoneQuery.replace(/\D/g, '')

    return rentCustomers(bookings.filter(row => row.status !== 'cancelled')).filter(item => {
      if (nameQuery.trim() && !item.name.toLowerCase().includes(nameQuery.trim().toLowerCase())) return false

      if (phone && !item.phone.replace(/\D/g, '').includes(phone)) return false

      return true
    })
  }, [bookings, nameQuery, phoneQuery])
  const rows = customers.slice((page - 1) * limit, page * limit)

  return (
    <>
      <AdminDataTable
        title='Rent customers'
        subtitle='Open a customer to see every rental and every sale on one page.'
        search=''
        hideSearch
        onSearchChange={() => undefined}
        onRefresh={() => void load()}
        actions={
          <>
            <TextField
              size='small'
              label='Customer name'
              placeholder='Name'
              value={nameQuery}
              onChange={event => {
                setPage(1)
                setNameQuery(event.target.value)
              }}
              sx={{ minWidth: 180 }}
            />
            <TextField
              size='small'
              label='Mobile number'
              placeholder='Mobile number'
              value={phoneQuery}
              onChange={event => {
                setPage(1)
                setPhoneQuery(event.target.value)
              }}
              sx={{ minWidth: 180 }}
            />
          </>
        }
        columns={[
          {
            id: 'name',
            label: 'Customer',
            render: row => (
              <Button
                component={Link}
                href={`/${lang}/store/sales/customers/${encodeURIComponent(customerKey(row.phone, row.name))}`}
                color='primary'
                sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {row.name}
              </Button>
            )
          },
          { id: 'phone', label: 'Mobile', render: row => row.phone },
          { id: 'orders', label: 'Bills', render: row => row.orders.length },
          { id: 'outfits', label: 'Outfits', render: row => row.outfitCount },
          { id: 'total', label: 'Total', render: row => `₹${row.total.toLocaleString('en-IN')}` },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <IconButton
                component={Link}
                href={`/${lang}/store/sales/customers/${encodeURIComponent(customerKey(row.phone, row.name))}`}
                size='small'
                color='primary'
                aria-label='History'
                title='History'
              >
                <i className='tabler-history' />
              </IconButton>
            )
          }
        ]}
        rows={rows}
        rowKey={row => row.key}
        total={customers.length}
        page={page}
        limit={limit}
        emptyText='No rent customers match this filter.'
        onPageChange={setPage}
        onLimitChange={value => {
          setLimit(value)
          setPage(1)
        }}
      />
    </>
  )
}

export default RentCustomersPage
