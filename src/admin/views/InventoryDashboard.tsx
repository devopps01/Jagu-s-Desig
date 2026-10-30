'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
import type { InventoryAlert, InventoryDashboard as DashboardData, InventorySummary } from '@/libs/inventory'

const emptySummary = (): InventorySummary => ({ products: 0, pieces: 0, used: 0, reserved: 0, left: 0, low: 0, unlimited: 0 })

const InventoryDashboard = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const [data, setData] = useState<DashboardData | null>(null)

  const load = async () => {
    const result = await adminApi<DashboardData>('/api/admin/inventory', undefined, { silentSuccess: true })

    if (result.ok && result.data) setData(result.data)
  }

  useEffect(() => {
    void load()
  }, [])

  const sale = data?.sale || emptySummary()
  const rent = data?.rent || emptySummary()

  const saleCards = [
    { label: 'Selling outfits', value: sale.products, icon: 'tabler-shirt' },
    { label: 'Pieces on hand', value: sale.pieces, icon: 'tabler-packages' },
    { label: 'Sold', value: sale.used, icon: 'tabler-shopping-bag' },
    { label: 'Left to sell', value: sale.left, icon: 'tabler-box' },
    { label: 'Low or sold out', value: sale.low, icon: 'tabler-alert-triangle' },
    { label: 'Sizes with no limit', value: sale.unlimited, icon: 'tabler-infinity' }
  ]

  const rentCards = [
    { label: 'Rent outfits', value: rent.products, icon: 'tabler-shirt' },
    { label: 'Pieces in stock', value: rent.pieces, icon: 'tabler-packages' },
    { label: 'Out now', value: rent.used, icon: 'tabler-calendar-event' },
    { label: 'Booked ahead', value: rent.reserved, icon: 'tabler-calendar-plus' },
    { label: 'Free today', value: rent.left, icon: 'tabler-circle-check' },
    { label: 'Out of stock or fully booked', value: rent.low, icon: 'tabler-alert-triangle' }
  ]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <Typography variant='h4'>Inventory</Typography>
          <Typography color='text.secondary'>Selling stock and rent stock are counted separately.</Typography>
        </div>
        <Button variant='tonal' onClick={() => void load()}>
          Refresh
        </Button>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between gap-3 flex-wrap mbe-4'>
          <Typography variant='h5'>Selling inventory</Typography>
          <Button variant='contained' href={`/${lang}/store/inventory/selling`}>
            Open selling inventory
          </Button>
        </div>
        <Grid container spacing={4}>
          {saleCards.map(card => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
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
        </Grid>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <div className='flex items-center justify-between gap-3 flex-wrap mbe-4'>
          <Typography variant='h5'>Rent inventory</Typography>
          <Button variant='contained' href={`/${lang}/store/inventory/rent`}>
            Open rent inventory
          </Button>
        </div>
        <Grid container spacing={4}>
          {rentCards.map(card => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, md: 4 }}>
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
        </Grid>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <AlertCard title='Selling stock to refill' empty='No selling size is low.' rows={data?.saleAlerts || []} kind='sale' />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <AlertCard title='Rent sizes out of stock or fully booked' empty='Every rent size still has a free piece today.' rows={data?.rentAlerts || []} kind='rent' />
      </Grid>
    </Grid>
  )
}

const AlertCard = ({
  title,
  empty,
  rows,
  kind
}: {
  title: string
  empty: string
  rows: InventoryAlert[]
  kind: 'sale' | 'rent'
}) => (
  <Card>
    <CardContent>
      <Typography variant='h5' className='mbe-4'>
        {title}
      </Typography>
      {rows.length ? (
        <div className='flex flex-col gap-3'>
          {rows.map(row => (
            <div key={`${row.productId}-${row.size}`} className='flex items-center justify-between gap-3'>
              <div>
                <Typography className='font-medium'>{row.name}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Size {row.size}
                  {kind === 'sale' ? ` · sold ${row.used}` : ` · out today ${row.used}`}
                </Typography>
              </div>
              <Chip
                size='small'
                color={row.closed || row.left === 0 ? 'error' : 'warning'}
                label={row.closed ? 'Out of stock' : row.left === 0 ? 'None left' : `${row.left} left`}
              />
            </div>
          ))}
        </div>
      ) : (
        <Typography color='text.secondary'>{empty}</Typography>
      )}
    </CardContent>
  </Card>
)

export default InventoryDashboard
