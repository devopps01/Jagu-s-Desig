'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import CustomAvatar from '@core/components/mui/Avatar'
import { adminApi } from '@admin/libs/adminApi'
import BillEditDialog from '@admin/views/BillEditDialog'
import { customerKey } from '@admin/views/customerKey'
import { saleToBill, type SaleRow } from '@admin/views/saleBill'
import { rentOrderBill } from '@admin/views/rentCustomers'
import { rentPayable, type RentBill } from '@admin/views/rentBill'
import type { RentBooking } from '@/libs/rentals'
import { linePayable } from '@/libs/return-fee'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

const rupee = (value: number) => `₹${Math.max(0, Math.round(value || 0)).toLocaleString('en-IN')}`

const when = (value: string | Date | null | undefined) => {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const statusColor = (status: string) => {
  if (status === 'ongoing') return 'warning' as const
  if (status === 'returned' || status === 'sold') return 'success' as const
  if (status === 'cancelled') return 'default' as const

  return 'info' as const
}

const CustomerHistoryPage = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const key = decodeURIComponent(String(params.phone || ''))
  const [sales, setSales] = useState<SaleRow[]>([])
  const [bookings, setBookings] = useState<RentBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [bill, setBill] = useState<RentBill | null>(null)
  const [edit, setEdit] = useState<{ kind: 'sale' | 'rent'; ids: string[] } | null>(null)

  const load = async () => {
    setLoading(true)

    const [saleResult, rentResult] = await Promise.all([
      adminApi<{ data?: SaleRow[] }>('/api/admin/sales', undefined, { silentSuccess: true }),
      adminApi<{ data?: RentBooking[] }>('/api/admin/rentals?all=1', undefined, { silentSuccess: true })
    ])

    setSales(Array.isArray(saleResult.data?.data) ? saleResult.data.data : [])
    setBookings(Array.isArray(rentResult.data?.data) ? rentResult.data.data : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const mineSales = useMemo(
    () => sales.filter(row => customerKey(row.customerPhone, row.customerName) === key),
    [sales, key]
  )
  const mineRents = useMemo(
    () => bookings.filter(row => customerKey(row.customerPhone, row.customerName) === key),
    [bookings, key]
  )
  const activeSales = mineSales.filter(row => row.status !== 'cancelled')
  const activeRents = mineRents.filter(row => row.status !== 'cancelled')
  const person = mineSales[0] || mineRents[0]
  const email = [...mineRents, ...mineSales].map(row => ('customerEmail' in row ? row.customerEmail : '') || '').find(Boolean) || ''

  const cards = [
    { label: 'Outfits sold', value: String(activeSales.length), icon: 'tabler-shirt', color: 'primary' as const },
    { label: 'Sale total', value: rupee(activeSales.reduce((sum, row) => sum + linePayable(row), 0)), icon: 'tabler-cash', color: 'success' as const },
    { label: 'Outfits rented', value: String(activeRents.length), icon: 'tabler-calendar-event', color: 'info' as const },
    { label: 'Rent total', value: rupee(activeRents.reduce((sum, row) => sum + rentPayable(row), 0)), icon: 'tabler-calendar', color: 'warning' as const }
  ]

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div>
          <Button component={Link} href={`/${lang}/store/sales/customers`} startIcon={<i className='tabler-arrow-left' />} color='secondary'>
            Sale customers
          </Button>
          <Typography variant='h4' className='mts-2'>
            {person?.customerName || 'Customer'}
          </Typography>
          <Typography color='text.secondary'>
            {person?.customerPhone || key}
            {email ? ` · ${email}` : ''}
          </Typography>
        </div>
      </div>
      <Grid container spacing={4}>
        {cards.map(card => (
          <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent className='flex items-center gap-4'>
                <CustomAvatar skin='light' color={card.color} variant='rounded' size={46}>
                  <i className={card.icon} />
                </CustomAvatar>
                <div>
                  <Typography color='text.secondary'>{card.label}</Typography>
                  <Typography variant='h5'>{loading ? '…' : card.value}</Typography>
                </div>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Card>
        <CardContent>
          <Typography variant='h5' className='mbe-4'>
            Sales
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Outfit</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {mineSales.length ? (
                mineSales.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>{when(row.createdAt)}</TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.size}</TableCell>
                    <TableCell>{row.quantity}</TableCell>
                    <TableCell>{rupee(linePayable(row))}</TableCell>
                    <TableCell>{rupee(row.paidAmount)}</TableCell>
                    <TableCell>
                      <Chip size='small' color={statusColor(row.status || 'sold')} label={row.status === 'cancelled' ? 'Cancelled' : 'Sold'} />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-2'>
                        {row.status === 'cancelled' ? null : (
                          <IconButton
                            size='small'
                            color='primary'
                            aria-label='Edit bill'
                            title='Edit bill'
                            onClick={() =>
                              setEdit({
                                kind: 'sale',
                                ids: row.orderKey ? mineSales.filter(item => item.orderKey === row.orderKey && item.status !== 'cancelled').map(item => item.id) : [row.id]
                              })
                            }
                          >
                            <i className='tabler-edit' />
                          </IconButton>
                        )}
                        <IconButton size='small' color='primary' aria-label='Bill' title='Bill' onClick={() => setBill(saleToBill(row))}>
                          <i className='tabler-receipt' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>{loading ? 'Loading sales…' : 'No sales for this customer.'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant='h5' className='mbe-4'>
            Rentals
          </Typography>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Dates</TableCell>
                <TableCell>Outfit</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Status</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {mineRents.length ? (
                mineRents.map(row => (
                  <TableRow key={row.id}>
                    <TableCell>
                      {row.startDate} → {row.endDate}
                    </TableCell>
                    <TableCell>{row.productName}</TableCell>
                    <TableCell>{row.size}</TableCell>
                    <TableCell>{rupee(rentPayable(row))}</TableCell>
                    <TableCell>{rupee(row.paidAmount)}</TableCell>
                    <TableCell>
                      <Chip size='small' color={statusColor(row.status)} label={row.status} />
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center justify-end gap-2'>
                        {row.status === 'cancelled' ? null : (
                          <IconButton
                            size='small'
                            color='primary'
                            aria-label='Edit bill'
                            title='Edit bill'
                            onClick={() =>
                              setEdit({
                                kind: 'rent',
                                ids: row.orderKey ? mineRents.filter(item => item.orderKey === row.orderKey && item.status !== 'cancelled').map(item => item.id) : [row.id]
                              })
                            }
                          >
                            <i className='tabler-edit' />
                          </IconButton>
                        )}
                        <IconButton size='small' color='primary' aria-label='Bill' title='Bill' onClick={() => setBill(rentOrderBill([row]))}>
                          <i className='tabler-receipt' />
                        </IconButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7}>{loading ? 'Loading rentals…' : 'No rentals for this customer.'}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RentBillDialog open={Boolean(bill)} bill={bill} onClose={() => setBill(null)} />
      <BillEditDialog
        open={Boolean(edit)}
        kind={edit?.kind || 'sale'}
        sales={edit?.kind === 'sale' ? mineSales.filter(row => edit.ids.includes(row.id)) : []}
        rents={edit?.kind === 'rent' ? mineRents.filter(row => edit.ids.includes(row.id)) : []}
        onClose={() => setEdit(null)}
        onSaved={() => void load()}
      />
    </div>
  )
}

export default CustomerHistoryPage
