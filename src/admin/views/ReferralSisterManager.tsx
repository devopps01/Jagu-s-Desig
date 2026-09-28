'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import { formatPrice } from '@web/data/catalog'
import type { OfferType } from '@/libs/offers'

type SisterRow = {
  id: string
  name: string
  code: string
  phone: string
  type: OfferType
  value: number
  status: 'active' | 'inactive'
  orderCount: number
  orderTotal: number
  discountTotal: number
  lastOrderAt: string | Date | null
}

type Stats = {
  sistersTotal: number
  sistersActive: number
  referredOrders: number
  referredSales: number
  sisterDiscount: number
  topSisters: { id: string; name: string; code: string; orders: number; sales: number }[]
}

type SisterOrder = {
  id: string
  orderNo: string
  customerName: string
  phone: string
  total: number
  sisterDiscountAmount: number
  status: string
  createdAt: string | Date
}

const emptyStats: Stats = {
  sistersTotal: 0,
  sistersActive: 0,
  referredOrders: 0,
  referredSales: 0,
  sisterDiscount: 0,
  topSisters: []
}

const emptyForm = {
  id: '',
  name: '',
  code: '',
  phone: '',
  type: 'percent' as OfferType,
  value: '0',
  status: 'active' as 'active' | 'inactive'
}

const offerLabel = (row: { type: OfferType; value: number }) =>
  row.value ? (row.type === 'percent' ? `${row.value}% off` : `${formatPrice(row.value)} off`) : 'Credit only'

const sisterShareUrl = (code: string) => {
  if (typeof window === 'undefined') return `/?sister=${code}`

  return `${window.location.origin}/?sister=${encodeURIComponent(code)}`
}

const ReferralSisterManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<SisterRow>('/api/admin/referral-sisters', { extraParams })
  const [stats, setStats] = useState<Stats>(emptyStats)
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState('')
  const [detail, setDetail] = useState<{ sister: SisterRow; orders: SisterOrder[] } | null>(null)

  const loadStats = async () => {
    const res = await fetch('/api/admin/referral-sisters/stats')
    const json = await res.json()

    if (res.ok) setStats({ ...emptyStats, ...json })
  }

  useEffect(() => {
    void loadStats()
  }, [table.rows])

  const copyLink = async (code: string) => {
    await navigator.clipboard.writeText(sisterShareUrl(code))
    setCopied(code)
    window.setTimeout(() => setCopied(current => (current === code ? '' : current)), 1600)
  }

  const save = async () => {
    setError('')
    setSaving(true)

    const res = await fetch(form.id ? `/api/admin/referral-sisters/${form.id}` : '/api/admin/referral-sisters', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        code: form.code,
        phone: form.phone,
        type: form.type,
        value: Number(form.value) || 0,
        status: form.status
      })
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Save failed')

      return
    }

    setOpen(false)
    setForm(emptyForm)
    await table.reload()
    await loadStats()
  }

  const openOrders = async (id: string) => {
    const res = await fetch(`/api/admin/referral-sisters/${id}`)
    const json = await res.json()

    if (res.ok) setDetail(json)
  }

  const cards = [
    { label: 'Sisters', value: stats.sistersTotal, icon: 'tabler-users-group' },
    { label: 'Active codes', value: stats.sistersActive, icon: 'tabler-check' },
    { label: 'Referred orders', value: stats.referredOrders, icon: 'tabler-shopping-bag' },
    { label: 'Referred sales', value: formatPrice(stats.referredSales), icon: 'tabler-currency-rupee' }
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

      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-2'>
              How sister referrals work
            </Typography>
            <Typography color='text.secondary' className='mbe-4'>
              Add a sister, share her unique code, and checkout credits every order that uses it. Optional percent or
              amount off is for the customer; the sister still gets the order count.
            </Typography>
            <Grid container spacing={4}>
              {[
                { step: '1', title: 'Add the sister', copy: 'Name, phone and a short code. Leave code blank to generate from the name.' },
                { step: '2', title: 'Share the code', copy: 'WhatsApp or copy /?sister=CODE. The site remembers it until checkout.' },
                { step: '3', title: 'Customer applies it', copy: 'On checkout they enter the sister code. The order is tagged to her.' },
                { step: '4', title: 'Track here', copy: 'Open a sister to see credited orders, sales and any sister offer given.' }
              ].map(item => (
                <Grid key={item.step} size={{ xs: 12, sm: 6 }}>
                  <Typography className='font-medium'>
                    {item.step}. {item.title}
                  </Typography>
                  <Typography color='text.secondary' variant='body2'>
                    {item.copy}
                  </Typography>
                </Grid>
              ))}
            </Grid>
            {stats.sisterDiscount ? (
              <Typography color='text.secondary' className='mbs-4'>
                Sister offers given so far: {formatPrice(stats.sisterDiscount)}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-4'>
              Top sisters
            </Typography>
            {stats.topSisters.length ? (
              <div className='flex flex-col gap-4'>
                {stats.topSisters.map(item => (
                  <div key={item.id} className='flex items-start justify-between gap-3'>
                    <div>
                      <Typography className='font-medium'>{item.name}</Typography>
                      <Typography color='text.secondary' variant='body2'>
                        {item.code || '—'} · {item.orders} {item.orders === 1 ? 'order' : 'orders'}
                      </Typography>
                    </div>
                    <Typography className='font-medium'>{formatPrice(item.sales)}</Typography>
                  </div>
                ))}
              </div>
            ) : (
              <Typography color='text.secondary'>No referred orders yet. Add a sister and share her code.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <AdminDataTable
          title='Referral sisters'
          subtitle='Sisters appear by code on checkout. Set a percent or amount if the referred order should get extra off.'
          search={table.search}
          searchPlaceholder='Search sisters...'
          onSearchChange={table.setSearch}
          onRefresh={() => void table.reload()}
          actions={
            <>
              <TextField
                select
                size='small'
                label='Status'
                value={statusFilter}
                onChange={event => {
                  table.setPage(1)
                  setStatusFilter(event.target.value)
                }}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value=''>All</MenuItem>
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </TextField>
              <Button
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => {
                  setError('')
                  setForm(emptyForm)
                  setOpen(true)
                }}
              >
                Add sister
              </Button>
            </>
          }
          columns={[
            {
              id: 'name',
              label: 'Sister',
              render: row => (
                <div>
                  <div>{row.name}</div>
                  {row.phone ? (
                    <Typography variant='caption' color='text.secondary'>
                      {row.phone}
                    </Typography>
                  ) : null}
                </div>
              )
            },
            {
              id: 'code',
              label: 'Code',
              render: row => (
                <div className='flex items-center gap-1'>
                  <strong>{row.code}</strong>
                  <IconButton size='small' aria-label='Copy share link' onClick={() => void copyLink(row.code)}>
                    <i className={copied === row.code ? 'tabler-check' : 'tabler-copy'} />
                  </IconButton>
                </div>
              )
            },
            {
              id: 'offer',
              label: 'Checkout offer',
              render: row => offerLabel(row)
            },
            {
              id: 'orders',
              label: 'Orders',
              render: row => (
                <Button size='small' variant='text' onClick={() => void openOrders(row.id)}>
                  {row.orderCount || 0} · {formatPrice(row.orderTotal || 0)}
                </Button>
              )
            },
            {
              id: 'status',
              label: 'Active',
              render: row => (
                <Switch
                  size='small'
                  checked={row.status === 'active'}
                  onChange={() =>
                    void fetch(`/api/admin/referral-sisters/${row.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: row.status === 'active' ? 'inactive' : 'active' })
                    }).then(() => {
                      void table.reload()
                      void loadStats()
                    })
                  }
                />
              )
            },
            {
              id: 'actions',
              label: '',
              render: row => (
                <>
                  <IconButton size='small' aria-label='View orders' onClick={() => void openOrders(row.id)}>
                    <i className='tabler-list' />
                  </IconButton>
                  <IconButton
                    size='small'
                    aria-label='Share on WhatsApp'
                    href={`https://wa.me/${row.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Shop Jagu’s Designing with sister code ${row.code}: ${sisterShareUrl(row.code)}`)}`}
                    target='_blank'
                    rel='noreferrer'
                  >
                    <i className='tabler-brand-whatsapp' />
                  </IconButton>
                  <IconButton
                    size='small'
                    aria-label='Edit sister'
                    onClick={() => {
                      setError('')
                      setForm({
                        id: row.id,
                        name: row.name,
                        code: row.code,
                        phone: row.phone || '',
                        type: row.type,
                        value: String(row.value || 0),
                        status: row.status
                      })
                      setOpen(true)
                    }}
                  >
                    <i className='tabler-edit' />
                  </IconButton>
                  <IconButton
                    size='small'
                    aria-label='Delete sister'
                    onClick={() =>
                      void fetch(`/api/admin/referral-sisters/${row.id}`, { method: 'DELETE' }).then(() => {
                        void table.reload()
                        void loadStats()
                      })
                    }
                  >
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
          emptyText='No referral sisters yet. Add the first sister to start sharing codes.'
          onPageChange={table.setPage}
          onLimitChange={table.setLimit}
        />
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{form.id ? 'Edit sister' : 'Add referral sister'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          <TextField label='Sister name' value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
          <TextField
            label='Code'
            value={form.code}
            onChange={event => setForm(current => ({ ...current, code: event.target.value }))}
            helperText='Leave blank to generate from the name. Customer types this at checkout.'
          />
          <TextField label='Phone' value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} helperText='Used for WhatsApp share from this page.' />
          <TextField select label='Offer type' value={form.type} onChange={event => setForm(current => ({ ...current, type: event.target.value as OfferType }))}>
            <MenuItem value='percent'>Percent off</MenuItem>
            <MenuItem value='fixed'>Fixed amount off</MenuItem>
          </TextField>
          <TextField
            label={form.type === 'percent' ? 'Percent (0 if credit only)' : 'Amount ₹ (0 if credit only)'}
            type='number'
            value={form.value}
            onChange={event => setForm(current => ({ ...current, value: event.target.value }))}
          />
          <TextField select label='Status' value={form.status} onChange={event => setForm(current => ({ ...current, status: event.target.value as 'active' | 'inactive' }))}>
            <MenuItem value='active'>Active</MenuItem>
            <MenuItem value='inactive'>Inactive</MenuItem>
          </TextField>
          {error ? (
            <Typography color='error' variant='body2'>
              {error}
            </Typography>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} fullWidth maxWidth='md'>
        <DialogTitle>
          {detail?.sister.name} · {detail?.sister.code}
        </DialogTitle>
        {detail ? (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
            <Typography color='text.secondary'>
              {offerLabel(detail.sister)} · {detail.sister.orderCount} credited {detail.sister.orderCount === 1 ? 'order' : 'orders'} · {formatPrice(detail.sister.orderTotal)}
            </Typography>
            <div className='flex flex-wrap gap-2'>
              <Chip size='small' label={sisterShareUrl(detail.sister.code)} />
              <Button size='small' onClick={() => void copyLink(detail.sister.code)}>
                {copied === detail.sister.code ? 'Copied' : 'Copy link'}
              </Button>
            </div>
            {detail.orders.length ? (
              detail.orders.map(order => (
                <div key={order.id} className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <Typography className='font-medium'>{order.orderNo}</Typography>
                    <Typography color='text.secondary' variant='body2'>
                      {order.customerName} {order.phone ? `· ${order.phone}` : ''} · {new Date(order.createdAt).toLocaleString()}
                    </Typography>
                  </div>
                  <div className='text-end'>
                    <Typography className='font-medium'>{formatPrice(order.total)}</Typography>
                    <Typography color='text.secondary' variant='body2'>
                      {order.status}
                      {order.sisterDiscountAmount ? ` · offer − ${formatPrice(order.sisterDiscountAmount)}` : ''}
                    </Typography>
                  </div>
                </div>
              ))
            ) : (
              <Typography color='text.secondary'>No orders have used this code yet.</Typography>
            )}
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={() => setDetail(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

export default ReferralSisterManager
