'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import type { ApexOptions } from 'apexcharts'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import type { ReviewStatus } from '@/libs/reviews'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

type ReviewRow = {
  id: string
  productSlug: string
  productTitle: string
  productImage: string
  userEmail: string
  userName: string
  rating: number
  title: string
  body: string
  status: ReviewStatus
  createdAt: string
}

type Stats = {
  total: number
  approved: number
  pending: number
  hidden: number
  average: number
  thisWeek: number
  stars: Record<1 | 2 | 3 | 4 | 5, number>
  daily: { date: string; count: number }[]
  topProducts: { slug: string; title: string; count: number; average: number }[]
}

const emptyStats: Stats = {
  total: 0,
  approved: 0,
  pending: 0,
  hidden: 0,
  average: 0,
  thisWeek: 0,
  stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  daily: [],
  topProducts: []
}

const statusColor = (status: ReviewStatus) => {
  if (status === 'approved') return 'success'
  if (status === 'hidden') return 'default'

  return 'warning'
}

const ReviewManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<ReviewRow>('/api/admin/reviews', { extraParams })
  const [stats, setStats] = useState<Stats>(emptyStats)

  const loadStats = async () => {
    const res = await fetch('/api/admin/reviews/stats')
    const json = await res.json()

    if (res.ok) setStats(json)
  }

  useEffect(() => {
    void loadStats()
  }, [table.rows])

  const patch = async (id: string, status: ReviewStatus) => {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    await table.reload()
    await loadStats()
  }

  const barOptions: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
    colors: ['#7367F0'],
    dataLabels: { enabled: false },
    xaxis: { categories: ['1★', '2★', '3★', '4★', '5★'] },
    grid: { strokeDashArray: 6 }
  }

  const lineOptions: ApexOptions = {
    chart: { parentHeightOffset: 0, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    colors: ['#28C76F'],
    dataLabels: { enabled: false },
    xaxis: {
      categories: stats.daily.map(item => item.date.slice(5))
    },
    grid: { strokeDashArray: 6 }
  }

  const cards = [
    { label: 'Total reviews', value: stats.total, icon: 'tabler-message-2' },
    { label: 'Average rating', value: stats.average ? stats.average.toFixed(1) : '—', icon: 'tabler-star' },
    { label: 'This week', value: stats.thisWeek, icon: 'tabler-calendar' },
    { label: 'Pending', value: stats.pending, icon: 'tabler-clock' }
  ]

  return (
    <Grid container spacing={6}>
      {cards.map(card => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
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

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Rating chart
            </Typography>
            <AppReactApexCharts
              type='bar'
              height={280}
              width='100%'
              options={barOptions}
              series={[{ name: 'Reviews', data: [1, 2, 3, 4, 5].map(star => stats.stars[star as 1 | 2 | 3 | 4 | 5]) }]}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Reviews this fortnight
            </Typography>
            <AppReactApexCharts
              type='area'
              height={280}
              width='100%'
              options={lineOptions}
              series={[{ name: 'Reviews', data: stats.daily.map(item => item.count) }]}
            />
          </CardContent>
        </Card>
      </Grid>

      {stats.topProducts.length ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant='h5' className='mbe-4'>
                Top reviewed products
              </Typography>
              <Grid container spacing={4}>
                {stats.topProducts.map(item => (
                  <Grid key={item.slug} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Typography className='font-medium'>{item.title}</Typography>
                    <Typography color='text.secondary'>
                      {item.average.toFixed(1)} ★ · {item.count} reviews
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ) : null}

      <Grid size={{ xs: 12 }}>
        <AdminDataTable
          title='Customer reviews'
          subtitle='Approve, hide or delete reviews. Live ratings update on the product page.'
          search={table.search}
          searchPlaceholder='Search product, email or review...'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          actions={
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={event => {
                table.setPage(1)
                setStatusFilter(event.target.value)
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='approved'>Approved</MenuItem>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='hidden'>Hidden</MenuItem>
            </TextField>
          }
          columns={[
            {
              id: 'image',
              label: '',
              render: row => <img src={row.productImage} alt='' style={{ width: 44, height: 56, objectFit: 'cover', borderRadius: 6 }} />
            },
            {
              id: 'product',
              label: 'Product',
              render: row => (
                <div>
                  <strong>{row.productTitle}</strong>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{row.productSlug}</div>
                </div>
              )
            },
            {
              id: 'customer',
              label: 'Customer',
              render: row => (
                <div>
                  {row.userName}
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{row.userEmail}</div>
                </div>
              )
            },
            { id: 'rating', label: 'Rating', render: row => `${row.rating} ★` },
            {
              id: 'review',
              label: 'Review',
              minWidth: 220,
              render: row => (
                <div>
                  {row.title ? <strong>{row.title}</strong> : null}
                  <div>{row.body}</div>
                </div>
              )
            },
            {
              id: 'status',
              label: 'Status',
              render: row => <Chip size='small' color={statusColor(row.status)} label={row.status} className='capitalize' />
            },
            {
              id: 'createdAt',
              label: 'Date',
              render: row => new Date(row.createdAt).toLocaleString()
            },
            {
              id: 'actions',
              label: '',
              render: row => (
                <>
                  {row.status !== 'approved' ? (
                    <IconButton size='small' title='Approve' onClick={() => void patch(row.id, 'approved')}>
                      <i className='tabler-check' />
                    </IconButton>
                  ) : (
                    <IconButton size='small' title='Hide' onClick={() => void patch(row.id, 'hidden')}>
                      <i className='tabler-eye-off' />
                    </IconButton>
                  )}
                  <IconButton size='small' title='Delete' onClick={() => void fetch(`/api/admin/reviews/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}>
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
          emptyText='No reviews yet.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>
    </Grid>
  )
}

export default ReviewManager
