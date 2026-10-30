'use client'

import { forwardRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useClientTable } from '@admin/components/table'
import { adminApi } from '@admin/libs/adminApi'
import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import type { AvailabilityBooking, AvailabilityRow } from '@/libs/rent-availability'

type AvailabilityData = {
  start: string
  end: string
  categories: string[]
  sizes: string[]
  rows: AvailabilityRow[]
  history: AvailabilityBooking[]
  summary: { total: number; available: number; booked: number }
}

const pad = (value: number) => String(value).padStart(2, '0')

const todayIso = () => {
  const date = new Date()

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const plusDays = (iso: string, days: number) => {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, (month || 1) - 1, day || 1)

  date.setDate(date.getDate() + days)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const parseDate = (value: string) => {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

const toDateValue = (date: Date | null) => (date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '')

const DateInput = forwardRef(({ label, ...props }: { label: string; value?: string }, ref) => (
  <CustomTextField
    {...props}
    inputRef={ref}
    fullWidth
    label={label}
    slotProps={{
      input: {
        readOnly: true,
        endAdornment: (
          <InputAdornment position='end'>
            <i className='tabler-calendar-event' />
          </InputAdornment>
        )
      }
    }}
  />
))

DateInput.displayName = 'DateInput'

const formatDay = (value: string) => {
  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return value

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const dayCount = (start: string, end: string) => {
  const from = parseDate(start)
  const to = parseDate(end)

  if (!from || !to) return 0

  return Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1)
}

const historyColor = (status: string) => {
  if (status === 'ongoing') return 'warning'
  if (status === 'returned') return 'success'
  if (status === 'cancelled') return 'default'

  return 'info'
}

const RentAvailability = () => {
  const params = useParams()
  const lang = String(params.lang || 'en')
  const [start, setStart] = useState(todayIso())
  const [end, setEnd] = useState(plusDays(todayIso(), 2))
  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const [search, setSearch] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [sizes, setSizes] = useState<string[]>([])
  const [rows, setRows] = useState<AvailabilityRow[]>([])
  const [history, setHistory] = useState<AvailabilityBooking[]>([])
  const [summary, setSummary] = useState({ total: 0, available: 0, booked: 0 })
  const [loading, setLoading] = useState(true)
  const [historyRow, setHistoryRow] = useState<AvailabilityRow | null>(null)
  const table = useClientTable(rows, { searchKeys: ['name', 'category', 'size'] })

  const load = async (next?: { start?: string; end?: string; category?: string; size?: string; search?: string; availableOnly?: boolean }) => {
    const pickup = next?.start ?? start
    const drop = next?.end ?? end

    setLoading(true)
    const query = new URLSearchParams({
      start: pickup,
      end: drop,
      category: next?.category ?? category,
      size: next?.size ?? size,
      search: next?.search ?? search,
      available: (next?.availableOnly ?? availableOnly) ? '1' : '0'
    })
    const result = await adminApi<AvailabilityData>(`/api/admin/rent/availability?${query.toString()}`, undefined, { silentSuccess: true })

    if (result.ok && result.data) {
      setRows(result.data.rows || [])
      setHistory(result.data.history || [])
      setCategories(result.data.categories || [])
      setSizes(result.data.sizes || [])
      setSummary(result.data.summary || { total: 0, available: 0, booked: 0 })
      if (result.data.start) setStart(result.data.start)
      if (result.data.end) setEnd(result.data.end)
    }

    setLoading(false)
  }

  useEffect(() => {
    void load()
    // First check uses today's dates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const historyFor = history.filter(item => historyRow && item.productSlug === historyRow.slug && item.size === historyRow.size)

  return (
    <>
      <Card className='mbe-6'>
        <CardContent className='flex flex-col gap-4'>
          <div className='flex items-center justify-between gap-3 flex-wrap'>
            <div>
              <Typography variant='h4'>Availability</Typography>
              <Typography color='text.secondary'>Choose pickup and return dates, then check which outfits are free.</Typography>
            </div>
            <Button component={Link} href={`/${lang}/store/rentals/book`} variant='contained' startIcon={<i className='tabler-plus' />}>
              Book rent
            </Button>
          </div>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 3 }}>
              <AppReactDatepicker
                selected={parseDate(start)}
                dateFormat='dd-MM-yyyy'
                onChange={(date: Date | null) => {
                  const next = toDateValue(date)

                  setStart(next)
                  if (end && next && end < next) setEnd(next)
                }}
                customInput={<DateInput label='Pickup date' />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <AppReactDatepicker
                selected={parseDate(end)}
                minDate={parseDate(start) || undefined}
                dateFormat='dd-MM-yyyy'
                onChange={(date: Date | null) => setEnd(toDateValue(date))}
                customInput={<DateInput label='Return date' />}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <CustomTextField select fullWidth label='Category' value={category} onChange={event => setCategory(event.target.value)}>
                <MenuItem value=''>All categories</MenuItem>
                {categories.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <CustomTextField select fullWidth label='Size' value={size} onChange={event => setSize(event.target.value)}>
                <MenuItem value=''>All sizes</MenuItem>
                {sizes.map(item => (
                  <MenuItem key={item} value={item}>
                    {item}
                  </MenuItem>
                ))}
              </CustomTextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <CustomTextField
                fullWidth
                label='Outfit or product number'
                placeholder='Search by name or number'
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} className='flex items-center'>
              <FormControlLabel control={<Switch checked={availableOnly} onChange={event => setAvailableOnly(event.target.checked)} />} label='Available only' />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} className='flex items-center justify-end'>
              <Button variant='contained' onClick={() => void load()} disabled={loading}>
                {loading ? 'Checking…' : 'Check'}
              </Button>
            </Grid>
          </Grid>
          <div className='flex items-center gap-3 flex-wrap'>
            <Typography color='text.secondary'>
              {start} to {end}
            </Typography>
            <Chip size='small' label={`${summary.total} results`} />
            <Chip size='small' color='success' label={`${summary.available} available`} />
            <Chip size='small' color='error' label={`${summary.booked} not free`} />
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        title='Outfits for these dates'
        subtitle='Search uses the product number given automatically when a product is added.'
        search={table.search}
        searchPlaceholder='Search these results'
        onSearchChange={table.setSearch}
        onRefresh={() => void load()}
        columns={[
          {
            id: 'image',
            label: 'Image',
            render: row =>
              row.imageUrl ? <img src={row.imageUrl} alt='' width={48} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} /> : '-'
          },
          { id: 'productNo', label: 'No.', render: row => (row.productNo ? `#${row.productNo}` : '-') },
          { id: 'name', label: 'Outfit', minWidth: 200 },
          { id: 'category', label: 'Category' },
          { id: 'size', label: 'Size' },
          { id: 'total', label: 'Total', align: 'right' },
          { id: 'booked', label: 'Booked', align: 'right' },
          { id: 'available', label: 'Available', align: 'right' },
          {
            id: 'status',
            label: 'Status',
            render: row =>
              row.status === 'available' ? (
                <Chip size='small' color='success' label='Available' />
              ) : row.status === 'out' ? (
                <Chip size='small' color='error' label='Out of stock' />
              ) : (
                <Chip size='small' color='warning' label='Fully booked' />
              )
          },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <div className='flex gap-2'>
                <IconButton
                  size='small'
                  color='primary'
                  component={Link}
                  disabled={row.available <= 0}
                  href={`/${lang}/store/rentals/book?slug=${encodeURIComponent(row.slug)}&size=${encodeURIComponent(row.size)}&start=${start}&end=${end}`}
                  aria-label='Book'
                  title='Book'
                >
                  <i className='tabler-calendar-plus' />
                </IconButton>
                <IconButton size='small' aria-label='History' title='History' onClick={() => setHistoryRow(row)}>
                  <i className='tabler-history' />
                </IconButton>
              </div>
            )
          }
        ]}
        rows={table.rows}
        rowKey={row => row.id}
        total={table.total}
        page={table.page}
        limit={table.limit}
        loading={loading}
        emptyText='No outfits match these dates and filters.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={Boolean(historyRow)} onClose={() => setHistoryRow(null)} fullWidth maxWidth='sm'>
        <DialogContent className='p-0'>
          {historyRow ? (
            <>
              <div className='relative'>
                {historyRow.imageUrl ? (
                  <img src={historyRow.imageUrl} alt={historyRow.name} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div className='flex items-center justify-center bg-actionHover' style={{ height: 160 }}>
                    <i className='tabler-shirt text-4xl' />
                  </div>
                )}
                <IconButton onClick={() => setHistoryRow(null)} className='absolute' aria-label='Close' sx={{ top: 12, right: 12, bgcolor: 'background.paper' }}>
                  <i className='tabler-x' />
                </IconButton>
              </div>
              <div className='flex flex-col gap-4 p-6'>
                <div>
                  <div className='flex items-center gap-2 mbe-2'>
                    {historyRow.productNo ? <Chip size='small' color='primary' variant='tonal' label={`#${historyRow.productNo}`} /> : null}
                    <Chip size='small' variant='tonal' label={`Size ${historyRow.size}`} />
                    <Chip size='small' variant='tonal' label={historyRow.category} />
                  </div>
                  <Typography variant='h5'>{historyRow.name}</Typography>
                  <Typography color='text.secondary' className='mts-1'>
                    {historyFor.length ? `${historyFor.length} ${historyFor.length === 1 ? 'booking' : 'bookings'} for this size` : 'No bookings for this size yet'}
                  </Typography>
                </div>
                {historyFor.length ? (
                  <div className='flex flex-col gap-3'>
                    {historyFor.map(item => (
                      <div key={item.id} className='flex flex-col gap-3 rounded p-4' style={{ background: 'var(--mui-palette-action-hover)' }}>
                        <div className='flex items-start justify-between gap-3'>
                          <div className='flex items-start gap-3'>
                            <i className='tabler-calendar-event text-xl mts-1' />
                            <div>
                              <Typography className='font-medium'>
                                {formatDay(item.startDate)} – {formatDay(item.endDate)}
                              </Typography>
                              <Typography variant='body2' color='text.secondary'>
                                {dayCount(item.startDate, item.endDate)} {dayCount(item.startDate, item.endDate) === 1 ? 'day' : 'days'}
                              </Typography>
                            </div>
                          </div>
                          <Chip size='small' color={historyColor(item.status)} label={item.status} sx={{ textTransform: 'capitalize' }} />
                        </div>
                        <div className='flex items-center gap-2'>
                          <i className='tabler-user text-lg' />
                          <Typography>{item.customerName || 'Customer'}</Typography>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col items-center gap-2 rounded p-8 text-center' style={{ background: 'var(--mui-palette-action-hover)' }}>
                    <i className='tabler-calendar-off text-3xl' />
                    <Typography>This size has not been booked yet.</Typography>
                  </div>
                )}
                <div className='flex justify-end'>
                  <Button variant='tonal' color='secondary' onClick={() => setHistoryRow(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default RentAvailability
