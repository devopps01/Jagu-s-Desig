'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import CustomAvatar from '@core/components/mui/Avatar'
import { adminApi } from '@admin/libs/adminApi'
import type { ChannelPoint, MainDashboard } from '@/libs/main-dashboard'

const rupees = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`
const counted = (value: number, one: string, many: string) => `${value} ${value === 1 ? one : many}`

const emptyDashboard = (): MainDashboard => ({
  profit: 0,
  returnFees: 0,
  collected: 0,
  due: 0,
  rent: { bills: 0, pieces: 0, total: 0, collected: 0, due: 0, currentPieces: 0, currentAmount: 0, outToday: 0, overdue: 0, ahead: 0 },
  store: { bills: 0, pieces: 0, total: 0, collected: 0, due: 0 },
  online: { bills: 0, pieces: 0, total: 0, collected: 0, due: 0 },
  daily: [],
  monthly: []
})

const SERIES = [
  { key: 'rent' as const, label: 'Rent' },
  { key: 'store' as const, label: 'In store' },
  { key: 'online' as const, label: 'Online' }
]

const TrendChart = ({ points, colors }: { points: ChannelPoint[]; colors: Record<'rent' | 'store' | 'online', string> }) => {
  const width = 640
  const height = 220
  const padX = 12
  const padY = 16
  const max = Math.max(1, ...points.flatMap(point => [point.rent, point.store, point.online]))
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0

  return (
    <Box>
      <svg viewBox={`0 0 ${width} ${height}`} width='100%' height='220' role='img' aria-label='Rent, in-store, and online amounts'>
        {SERIES.map(series => {
          const line = points
            .map((point, index) => {
              const x = padX + index * step
              const y = height - padY - (point[series.key] / max) * (height - padY * 2)

              return `${x},${y}`
            })
            .join(' ')

          return <polyline key={series.key} points={line} fill='none' stroke={colors[series.key]} strokeWidth='3' strokeLinejoin='round' strokeLinecap='round' />
        })}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        {points.map((point, index) => (
          <Typography key={`${point.label}-${index}`} variant='caption' color='text.secondary' sx={{ visibility: index % 2 ? 'hidden' : 'visible', flex: 1, textAlign: 'center' }}>
            {point.label}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
        {SERIES.map(series => (
          <Box key={series.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 18, height: 3, borderRadius: 2, bgcolor: colors[series.key] }} />
            <Typography variant='body2'>{series.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const MonthBars = ({ points, colors }: { points: ChannelPoint[]; colors: Record<'rent' | 'store' | 'online', string> }) => {
  const max = Math.max(1, ...points.flatMap(point => [point.rent, point.store, point.online]))

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: 220 }}>
        {points.map(point => (
          <Box key={point.label} sx={{ flex: 1, minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 180, width: '100%', justifyContent: 'center' }}>
              {SERIES.map(series => (
                <Box
                  key={series.key}
                  title={`${series.label}: ${rupees(point[series.key])}`}
                  sx={{
                    width: '22%',
                    maxWidth: 16,
                    height: `${Math.max(point[series.key] ? 6 : 2, (point[series.key] / max) * 180)}px`,
                    borderRadius: 1,
                    bgcolor: point[series.key] ? colors[series.key] : 'action.hover'
                  }}
                />
              ))}
            </Box>
            <Typography variant='caption' color='text.secondary'>
              {point.label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
        {SERIES.map(series => (
          <Box key={series.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: colors[series.key] }} />
            <Typography variant='body2'>{series.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const Donut = ({ slices, center, format }: { slices: { label: string; value: number; color: string }[]; center: string; format?: (value: number) => string }) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  let cursor = 0
  const stops = slices
    .map(slice => {
      const start = cursor
      const sweep = total ? (slice.value / total) * 100 : 0

      cursor += sweep

      return `${slice.color} ${start}% ${cursor}%`
    })
    .join(', ')

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 180,
          height: 180,
          borderRadius: '50%',
          background: total ? `conic-gradient(${stops})` : 'var(--mui-palette-action-hover)',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        <Box sx={{ width: 112, height: 112, borderRadius: '50%', bgcolor: 'background.paper', display: 'grid', placeItems: 'center', px: 1 }}>
          <Typography variant='h5' sx={{ textAlign: 'center', lineHeight: 1.1 }}>
            {center}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>
        {slices.map(slice => (
          <Box key={slice.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
              <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: slice.color, flexShrink: 0 }} />
              <Typography variant='body2'>{slice.label}</Typography>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>
              {format ? format(slice.value) : slice.value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const MainDashboardPage = () => {
  const theme = useTheme()
  const params = useParams()
  const lang = String(params.lang || 'en')
  const [data, setData] = useState<MainDashboard>(emptyDashboard)
  const [loading, setLoading] = useState(true)
  const colors = {
    rent: theme.palette.info.main,
    store: theme.palette.primary.main,
    online: theme.palette.success.main
  }
  const pieces = data.rent.pieces + data.store.pieces + data.online.pieces
  const pieceSlices = [
    { label: 'Rent', value: data.rent.pieces, color: colors.rent },
    { label: 'In store', value: data.store.pieces, color: colors.store },
    { label: 'Online', value: data.online.pieces, color: colors.online }
  ]
  const moneySlices = [
    { label: 'Rent', value: data.rent.collected, color: colors.rent },
    { label: 'In store', value: data.store.collected, color: colors.store },
    { label: 'Online', value: data.online.collected, color: colors.online }
  ].filter(slice => slice.value > 0)

  const load = async () => {
    setLoading(true)
    const result = await adminApi<MainDashboard>('/api/admin/dashboard/main', undefined, { silentSuccess: true })

    if (result.ok && result.data && typeof result.data.profit === 'number') setData(result.data)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const cards = [
    {
      label: 'Profit',
      value: rupees(data.profit),
      hint: data.returnFees > 0 ? `Collected ${rupees(data.collected)} plus ${rupees(data.returnFees)} kept as return fees` : 'Money already collected',
      icon: 'tabler-chart-line',
      color: 'success' as const
    },
    {
      label: 'Total rent',
      value: rupees(data.rent.total),
      hint: `${counted(data.rent.pieces, 'outfit', 'outfits')} · ${counted(data.rent.bills, 'bill', 'bills')}`,
      icon: 'tabler-calendar-check',
      color: 'info' as const
    },
    {
      label: 'Current rent',
      value: String(data.rent.currentPieces),
      hint: `${data.rent.outToday} out today · ${data.rent.overdue} past return · ${data.rent.ahead} booked ahead`,
      icon: 'tabler-calendar-event',
      color: 'warning' as const
    },
    {
      label: 'In-store sales',
      value: String(data.store.pieces),
      hint: `${rupees(data.store.collected)} collected · ${counted(data.store.bills, 'bill', 'bills')}`,
      icon: 'tabler-building-store',
      color: 'primary' as const
    },
    {
      label: 'Online sales',
      value: String(data.online.pieces),
      hint: `${rupees(data.online.collected)} collected · ${counted(data.online.bills, 'order', 'orders')}`,
      icon: 'tabler-world',
      color: 'success' as const
    },
    {
      label: 'Left to collect',
      value: rupees(data.due),
      hint: `Rent ${rupees(data.rent.due)} · Store ${rupees(data.store.due)} · Online ${rupees(data.online.due)}`,
      icon: 'tabler-clock',
      color: 'error' as const
    }
  ]

  const rows = [
    { label: 'Rent', pieces: data.rent.pieces, bills: data.rent.bills, total: data.rent.total, collected: data.rent.collected, due: data.rent.due },
    { label: 'In store', pieces: data.store.pieces, bills: data.store.bills, total: data.store.total, collected: data.store.collected, due: data.store.due },
    { label: 'Online', pieces: data.online.pieces, bills: data.online.bills, total: data.online.total, collected: data.online.collected, due: data.online.due }
  ]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <Typography variant='h4'>Main dashboard</Typography>
          <Typography color='text.secondary'>Profit, rent that is out now, in-store sales, and website orders.</Typography>
        </div>
        <Button variant='tonal' onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
          {[
            { label: 'Rent store', href: '/store/rentals', icon: 'tabler-building-store' },
            { label: 'Sale store', href: '/store/sales', icon: 'tabler-shopping-bag' },
            { label: 'Online orders', href: '/store/orders', icon: 'tabler-file-invoice' }
          ].map(item => (
            <Button
              key={item.href}
              component={Link}
              href={`/${lang}${item.href}`}
              variant='tonal'
              color='secondary'
              fullWidth
              startIcon={<i className={item.icon} />}
              sx={{ justifyContent: 'center', minHeight: 48 }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' } }}>
          {cards.map(card => (
            <Card key={card.label}>
              <CardContent className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' skin='light' color={card.color}>
                  <i className={card.icon} />
                </CustomAvatar>
                <div style={{ minWidth: 0 }}>
                  <Typography variant='h5'>{card.value}</Typography>
                  <Typography>{card.label}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {card.hint}
                  </Typography>
                </div>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Grid>

      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>Last 14 days</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              Bill amount for rent, in-store sales, and online orders.
            </Typography>
            {data.daily.length ? <TrendChart points={data.daily} colors={colors} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No bills in the last 14 days.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>How outfits moved</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              Pieces rented, sold in the shop, and sold online.
            </Typography>
            {pieces || !loading ? <Donut slices={pieceSlices} center={String(pieces)} /> : <Typography color='text.secondary'>Loading the chart...</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>Last 6 months</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              Each month shows rent, the shop, and the website side by side.
            </Typography>
            {data.monthly.length ? <MonthBars points={data.monthly} colors={colors} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No bills in the last 6 months.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>Collected</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              {rupees(data.collected)} already in hand. {rupees(data.due)} is still left.
            </Typography>
            {moneySlices.length ? <Donut slices={moneySlices} center={rupees(data.collected)} format={rupees} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No money has been collected yet.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Report
            </Typography>
            <Box sx={{ overflowX: 'auto' }}>
              <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
                <Box component='thead'>
                  <Box component='tr'>
                    {['', 'Outfits', 'Bills', 'Bill amount', 'Collected', 'Left'].map(heading => (
                      <Box component='th' key={heading || 'channel'} sx={{ textAlign: heading ? 'right' : 'left', py: 1.5, px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Typography variant='body2' color='text.secondary'>
                          {heading}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component='tbody'>
                  {rows.map(row => (
                    <Box component='tr' key={row.label}>
                      {[row.label, String(row.pieces), String(row.bills), rupees(row.total), rupees(row.collected), rupees(row.due)].map((cell, index) => (
                        <Box component='td' key={`${row.label}-${index}`} sx={{ textAlign: index ? 'right' : 'left', py: 1.75, px: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                          <Typography variant={index ? 'body2' : 'body1'}>{cell}</Typography>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 3 }}>
              Current rent is {data.rent.currentPieces} outfit{data.rent.currentPieces === 1 ? '' : 's'} still with customers, billed at {rupees(data.rent.currentAmount)}. Cancelled bills are left out. Profit is money collected, plus any return fee that was kept. Outfit purchase cost is not subtracted.
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default MainDashboardPage
