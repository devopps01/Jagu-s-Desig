'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'

type SubscriberRow = {
  id: string
  email: string
  source: string
  createdAt: string
}

type Stats = {
  total: number
  thisWeek: number
}

const emptyStats: Stats = { total: 0, thisWeek: 0 }

const NewsletterSubscribersManager = () => {
  const params = useParams()
  const lang = String(params?.lang || 'en')
  const table = useServerTable<SubscriberRow>('/api/admin/newsletter-subscribers')
  const [stats, setStats] = useState<Stats>(emptyStats)

  const loadStats = async () => {
    const res = await fetch('/api/admin/newsletter-subscribers/stats')
    const json = await res.json()

    if (res.ok) setStats(json)
  }

  useEffect(() => {
    void loadStats()
  }, [table.rows])

  const remove = async (id: string) => {
    if (!window.confirm('Remove this subscriber?')) return

    await fetch(`/api/admin/newsletter-subscribers/${id}`, { method: 'DELETE' })
    await table.reload()
    await loadStats()
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <Typography variant='h4'>Newsletter subscribers</Typography>
            <Typography color='text.secondary'>Emails collected from the home-page subscribe banner.</Typography>
          </div>
          <Button href={`/${lang}/store/newsletter`} variant='outlined'>
            Edit banner
          </Button>
        </div>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>Total</Typography>
            <Typography variant='h4'>{stats.total}</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <Card>
          <CardContent>
            <Typography color='text.secondary'>This week</Typography>
            <Typography variant='h4'>{stats.thisWeek}</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <AdminDataTable
          title='Subscribers'
          subtitle='Emails collected from the home-page subscribe banner.'
          search={table.search}
          searchPlaceholder='Search email…'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          columns={[
            { id: 'email', label: 'Email', render: row => row.email },
            { id: 'source', label: 'Source', render: row => row.source || 'home' },
            {
              id: 'createdAt',
              label: 'Subscribed',
              render: row => (row.createdAt ? new Date(row.createdAt).toLocaleString() : '—')
            },
            {
              id: 'actions',
              label: 'Actions',
              render: row => (
                <IconButton size='small' color='error' onClick={() => void remove(row.id)} aria-label='Delete'>
                  <i className='tabler-trash' />
                </IconButton>
              )
            }
          ]}
          rows={table.rows}
          rowKey={row => row.id}
          total={table.total}
          page={table.page}
          limit={table.limit}
          loading={table.loading}
          emptyText='No subscribers yet.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>
    </Grid>
  )
}

export default NewsletterSubscribersManager
