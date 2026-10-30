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
import { saleOrders, saleToBill, type SaleRow } from '@admin/views/saleBill'
import { rentPayable } from '@admin/views/rentBill'

type SaleCustomer = {
  key: string
  name: string
  phone: string
  sales: SaleRow[]
  total: number
}

const SaleCustomersPage = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const [sales, setSales] = useState<SaleRow[]>([])
  const [nameQuery, setNameQuery] = useState('')
  const [phoneQuery, setPhoneQuery] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)

  const load = async () => {
    const result = await adminApi<{ data?: SaleRow[] }>('/api/admin/sales', undefined, { silentSuccess: true })

    setSales(Array.isArray(result.data?.data) ? result.data.data : [])
  }

  useEffect(() => {
    void load()
  }, [])

  const customers = useMemo(() => {
    const grouped = new Map<string, SaleCustomer>()

    for (const sale of sales.filter(row => row.status !== 'cancelled')) {
      const key = customerKey(sale.customerPhone, sale.customerName)
      const current = grouped.get(key)
      const total = rentPayable(saleToBill(sale))

      if (current) {
        current.sales.push(sale)
        current.total += total
        if (!current.name && sale.customerName) current.name = sale.customerName
      } else {
        grouped.set(key, {
          key,
          name: sale.customerName,
          phone: sale.customerPhone,
          sales: [sale],
          total
        })
      }
    }

    const phone = phoneQuery.replace(/\D/g, '')

    return [...grouped.values()].filter(item => {
      if (nameQuery.trim() && !item.name.toLowerCase().includes(nameQuery.trim().toLowerCase())) return false
      if (phone && !item.phone.replace(/\D/g, '').includes(phone)) return false

      return true
    })
  }, [sales, nameQuery, phoneQuery])
  const rows = customers.slice((page - 1) * limit, page * limit)

  return (
    <>
      <AdminDataTable
        title='Sale customers'
        subtitle='Open a customer to see every sale and every rental on one page.'
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
                href={`/${lang}/store/sales/customers/${encodeURIComponent(row.key)}`}
                color='primary'
                sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
              >
                {row.name}
              </Button>
            )
          },
          { id: 'phone', label: 'Mobile', render: row => row.phone },
          { id: 'bills', label: 'Bills', render: row => saleOrders(row.sales).length },
          { id: 'total', label: 'Total', render: row => `₹${row.total.toLocaleString('en-IN')}` },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <IconButton component={Link} href={`/${lang}/store/sales/customers/${encodeURIComponent(row.key)}`} size='small' color='primary' aria-label='History' title='History'>
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
        emptyText='No sale customers match this filter.'
        onPageChange={setPage}
        onLimitChange={value => {
          setLimit(value)
          setPage(1)
        }}
      />
    </>
  )
}

export default SaleCustomersPage
