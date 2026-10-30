'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'

import CustomAvatar from '@core/components/mui/Avatar'
import { adminApi } from '@admin/libs/adminApi'
import { STORE_MENU_GROUPS } from '@/data/navigation/storeMenu'
import type { ChannelDashboard, DashboardPoint, DashboardSlice } from '@/libs/channel-dashboard'

const PAGE_ICONS: Record<string, string> = {
  '/store/rentals/dashboard': 'tabler-layout-dashboard',
  '/store/rentals/availability': 'tabler-calendar-search',
  '/store/rentals/book': 'tabler-calendar-plus',
  '/store/rentals': 'tabler-building-store',
  '/store/rentals/dress-care': 'tabler-hanger',
  '/store/rentals/customers': 'tabler-users',
  '/store/inventory/rent': 'tabler-packages',
  '/store/sales/dashboard': 'tabler-layout-dashboard',
  '/store/sales/book': 'tabler-shopping-bag',
  '/store/sales': 'tabler-building-store',
  '/store/sales/customers': 'tabler-users',
  '/store/inventory/selling': 'tabler-packages'
}

const RentDashboardCalendar = dynamic(() => import('@admin/views/RentDashboardCalendar'), { ssr: false })

const rupees = (value: number) => `₹${Math.round(value || 0).toLocaleString('en-IN')}`

const emptyDashboard = (kind: 'sale' | 'rent'): ChannelDashboard => ({
  kind,
  bills: 0,
  pieces: 0,
  customers: 0,
  collected: 0,
  due: 0,
  total: 0,
  outNow: 0,
  daily: [],
  sizes: [],
  payments: [],
  top: []
})

const AreaChart = ({ points, color }: { points: DashboardPoint[]; color: string }) => {
  const width = 640
  const height = 220
  const padX = 8
  const padY = 16
  const max = Math.max(1, ...points.map(point => point.amount))
  const step = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = padX + index * step
    const y = height - padY - (point.amount / max) * (height - padY * 2)

    return { x, y, ...point }
  })
  const line = coords.map(point => `${point.x},${point.y}`).join(' ')
  const area = coords.length ? `M ${coords[0].x} ${height - padY} ${coords.map(point => `L ${point.x} ${point.y}`).join(' ')} L ${coords[coords.length - 1].x} ${height - padY} Z` : ''

  return (
    <Box>
      <svg viewBox={`0 0 ${width} ${height}`} width='100%' height='220' role='img' aria-label='Amount over 14 days'>
        <path d={area} fill={color} opacity='0.16' />
        <polyline points={line} fill='none' stroke={color} strokeWidth='3' strokeLinejoin='round' strokeLinecap='round' />
        {coords.map(point => (
          <circle key={point.label} cx={point.x} cy={point.y} r={point.amount ? 4 : 2} fill={color}>
            <title>{`${point.label}: ${rupees(point.amount)}`}</title>
          </circle>
        ))}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        {points.map((point, index) => (
          <Typography key={point.label} variant='caption' color='text.secondary' sx={{ visibility: index % 2 ? 'hidden' : 'visible', flex: 1, textAlign: 'center' }}>
            {point.label}
          </Typography>
        ))}
      </Box>
    </Box>
  )
}

const Donut = ({ slices, center }: { slices: DashboardSlice[]; center: string }) => {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const palette = ['#28C76F', '#FF9F43', '#7367F0', '#00CFE8', '#EA5455', '#A8AAAE']
  let cursor = 0
  const stops = slices
    .map((slice, index) => {
      const start = cursor
      const sweep = total ? (slice.value / total) * 100 : 0

      cursor += sweep

      return `${palette[index % palette.length]} ${start}% ${cursor}%`
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
        <Box sx={{ width: 112, height: 112, borderRadius: '50%', bgcolor: 'background.paper', display: 'grid', placeItems: 'center' }}>
          <Typography variant='h5'>{center}</Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 1.5 }}>
        {slices.map((slice, index) => (
          <Box key={slice.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: palette[index % palette.length] }} />
            <Typography variant='body2'>
              {slice.label} · {rupees(slice.value)}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  )
}

const ColumnBars = ({ slices, color }: { slices: DashboardSlice[]; color: string }) => {
  const max = Math.max(1, ...slices.map(slice => slice.value))

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 220 }}>
      {slices.map(slice => (
        <Box key={slice.label} sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, height: '100%', justifyContent: 'flex-end' }}>
          <Typography variant='caption'>{slice.value || ''}</Typography>
          <Box sx={{ width: '70%', maxWidth: 36, height: `${Math.max(slice.value ? 8 : 2, (slice.value / max) * 160)}px`, borderRadius: 1, bgcolor: slice.value ? color : 'action.hover' }} title={`${slice.label}: ${slice.value}`} />
          <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'center', lineHeight: 1.1 }}>
            {slice.label}
          </Typography>
        </Box>
      ))}
    </Box>
  )
}

const RowBars = ({ rows, color }: { rows: { name: string; amount: number; count: number }[]; color: string }) => {
  const max = Math.max(1, ...rows.map(row => row.amount))

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {rows.map(row => (
        <Box key={row.name}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 0.5 }}>
            <Typography variant='body2' sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.name}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>
              {rupees(row.amount)} · {row.count}
            </Typography>
          </Box>
          <Box sx={{ height: 10, borderRadius: 5, bgcolor: 'action.hover' }}>
            <Box sx={{ height: '100%', width: `${Math.max(4, (row.amount / max) * 100)}%`, borderRadius: 5, bgcolor: color }} />
          </Box>
        </Box>
      ))}
    </Box>
  )
}

const ChannelDashboardPage = ({ kind }: { kind: 'sale' | 'rent' }) => {
  const theme = useTheme()
  const params = useParams()
  const pathname = usePathname()
  const lang = String(params.lang || 'en')
  const sale = kind === 'sale'
  const pages = STORE_MENU_GROUPS.find(group => group.label === (sale ? 'Selling' : 'Rent'))?.items || []
  const [data, setData] = useState<ChannelDashboard>(() => emptyDashboard(kind))
  const [loading, setLoading] = useState(true)
  const primary = sale ? theme.palette.primary.main : theme.palette.info.main
  const collectedRate = data.total > 0 ? Math.round((data.collected / data.total) * 100) : 0
  const split = [
    { label: 'Collected', value: data.collected },
    { label: 'Left to collect', value: data.due }
  ].filter(item => item.value > 0)
  const payments = data.payments.filter(item => item.value > 0)

  const load = async () => {
    setLoading(true)
    const result = await adminApi<ChannelDashboard>(sale ? '/api/admin/dashboard/sales' : '/api/admin/dashboard/rentals', undefined, {
      silentSuccess: true
    })

    if (result.ok && result.data && result.data.kind === kind) setData(result.data)
    setLoading(false)
  }

  useEffect(() => {
    void load()
    // kind is fixed for each page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  const cards = sale
    ? [
        { label: 'Bills', value: String(data.bills), icon: 'tabler-receipt', color: 'primary' as const },
        { label: 'Outfits sold', value: String(data.pieces), icon: 'tabler-shirt', color: 'info' as const },
        { label: 'Collected', value: rupees(data.collected), icon: 'tabler-cash', color: 'success' as const },
        { label: 'Left to collect', value: rupees(data.due), icon: 'tabler-clock', color: 'warning' as const },
        { label: 'Customers', value: String(data.customers), icon: 'tabler-users', color: 'secondary' as const }
      ]
    : [
        { label: 'Bookings', value: String(data.bills), icon: 'tabler-calendar-check', color: 'info' as const },
        { label: 'Out now', value: String(data.outNow), icon: 'tabler-calendar-event', color: 'warning' as const },
        { label: 'Collected', value: rupees(data.collected), icon: 'tabler-cash', color: 'success' as const },
        { label: 'Left to collect', value: rupees(data.due), icon: 'tabler-clock', color: 'error' as const },
        { label: 'Customers', value: String(data.customers), icon: 'tabler-users', color: 'secondary' as const }
      ]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <Typography variant='h4'>{sale ? 'Selling dashboard' : 'Rent dashboard'}</Typography>
          <Typography color='text.secondary'>
            {sale ? 'Shop sales, what is collected, and which outfits are selling.' : 'Rent bookings, what is still out, and what is left to collect.'}
          </Typography>
        </div>
        <Button variant='tonal' onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: `repeat(${Math.max(pages.length, 1)}, 1fr)` } }}>
          {pages.map(item => {
            const href = `/${lang}${item.href}`
            const active = pathname === href

            return (
              <Button
                key={item.href}
                component={Link}
                href={href}
                variant={active ? 'contained' : 'tonal'}
                color={active ? 'primary' : 'secondary'}
                fullWidth
                startIcon={<i className={PAGE_ICONS[item.href] || 'tabler-arrow-right'} />}
                sx={{ justifyContent: 'center', px: 2, py: 2, minHeight: 48 }}
              >
                {item.label}
              </Button>
            )
          })}
        </Box>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'grid', gap: 4, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(5, 1fr)' } }}>
          {cards.map(card => (
            <Card key={card.label}>
              <CardContent className='flex items-center gap-4'>
                <CustomAvatar variant='rounded' skin='light' color={card.color}>
                  <i className={card.icon} />
                </CustomAvatar>
                <div>
                  <Typography variant='h5'>{card.value}</Typography>
                  <Typography color='text.secondary'>{card.label}</Typography>
                </div>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Grid>

      {sale ? null : (
        <Grid size={{ xs: 12 }}>
          <RentDashboardCalendar />
        </Grid>
      )}

      <Grid size={{ xs: 12, lg: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>Last 14 days</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              {sale ? 'Bill amount of outfits sold each day.' : 'Bill amount of outfits booked each day.'}
            </Typography>
            {data.daily.length ? <AreaChart points={data.daily} color={primary} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No bills in the last 14 days.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, lg: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>Collected</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              {rupees(data.collected)} received of {rupees(data.total)}
            </Typography>
            {split.length ? <Donut slices={split} center={`${collectedRate}%`} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No bills yet.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Paid by
            </Typography>
            {payments.length ? <Donut slices={payments} center={rupees(data.collected)} /> : <Typography color='text.secondary'>No payment has been received yet.</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant='h5'>By size</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              {sale ? 'Pieces sold in each size.' : 'Pieces booked in each size.'}
            </Typography>
            {data.sizes.length ? <ColumnBars slices={data.sizes} color={theme.palette.warning.main} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : 'No sizes yet.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Card>
          <CardContent>
            <Typography variant='h5'>Top outfits</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-4'>
              Highest bill amount.
            </Typography>
            {data.top.length ? <RowBars rows={data.top} color={primary} /> : <Typography color='text.secondary'>{loading ? 'Loading the chart...' : sale ? 'No outfits have been sold yet.' : 'No outfits have been booked yet.'}</Typography>}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default ChannelDashboardPage
