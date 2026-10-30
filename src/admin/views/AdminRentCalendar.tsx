'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

export type RentCalendarHold = {
  size: string
  startDate: string
  endDate: string
}

const localToday = () => {
  const date = new Date()

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)

  if (!year || !month || !day) return ''

  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

const monthLabel = (year: number, month: number) => new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

const monthOf = (iso: string) => {
  const [year, month] = iso.split('-').map(Number)

  if (year && month) return { year, month: month - 1 }

  const now = new Date()

  return { year: now.getFullYear(), month: now.getMonth() }
}

const monthCells = (year: number, month: number) => {
  const startPad = new Date(year, month, 1).getDay()
  const days = new Date(year, month + 1, 0).getDate()
  const cells: Array<{ iso: string } | null> = Array.from({ length: startPad }, () => null)

  for (let day = 1; day <= days; day += 1) {
    cells.push({
      iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    })
  }

  return cells
}

const overlaps = (startA: string, endA: string, startB: string, endB: string) => startA <= endB && startB <= endA

const AdminRentCalendar = ({
  startDate,
  endDate,
  size,
  stock,
  closed,
  holds,
  error,
  onChange
}: {
  startDate: string
  endDate: string
  size: string
  stock: number
  closed: boolean
  holds: RentCalendarHold[]
  error?: string
  onChange: (start: string, end: string) => void
}) => {
  const today = localToday()
  const pieces = Math.max(1, stock || 1)
  const [cursor, setCursor] = useState(() => monthOf(startDate))
  const [hint, setHint] = useState('')
  const sizeHolds = holds.filter(hold => hold.size === size)
  const cells = monthCells(cursor.year, cursor.month)

  useEffect(() => {
    if (startDate) setCursor(monthOf(startDate))
  }, [startDate])

  const countOn = (iso: string) => sizeHolds.filter(hold => hold.startDate <= iso && iso <= hold.endDate).length
  const chosen = (iso: string) => Boolean(startDate && ((endDate && iso >= startDate && iso <= endDate) || iso === startDate || iso === endDate))
  const rented = (iso: string) => countOn(iso) >= pieces
  const rangeIsRented = Boolean(
    startDate && endDate && sizeHolds.filter(hold => overlaps(startDate, endDate, hold.startDate, hold.endDate)).length >= pieces
  )

  const dayState = (iso: string) => {
    if (rented(iso)) return 'booked'
    if (iso < today) return 'past'
    if (chosen(iso)) return 'picked'
    if (countOn(iso) > 0) return 'partial'

    return 'open'
  }

  const pickDay = (iso: string) => {
    if (closed || iso < today) return

    if (!startDate || (startDate && endDate) || iso < startDate) {
      setHint(rented(iso) ? `Size ${size} is already rented on this day.` : 'Now pick the return day.')
      onChange(iso, '')

      return
    }

    const hitsRented = sizeHolds.filter(hold => overlaps(startDate, iso, hold.startDate, hold.endDate)).length >= pieces

    setHint(hitsRented ? `Size ${size} is already rented on these dates.` : '')
    onChange(startDate, iso)
  }

  const shift = (step: number) => {
    setCursor(current => {
      const next = new Date(current.year, current.month + step, 1)

      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  const range =
    startDate && endDate
      ? `${formatDay(startDate)} – ${formatDay(endDate)}`
      : startDate
        ? `${formatDay(startDate)} · pick the return day`
        : 'Pick a start day, then a return day'

  const note = closed
    ? `Size ${size} is out of stock.`
    : error || hint || (rangeIsRented ? `Size ${size} is already rented on these dates.` : 'Pick a start day, then the return day.')

  return (
    <Box sx={{ display: 'grid', gap: 1, width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography variant='subtitle2'>Rental dates</Typography>
        <Typography variant='caption' color='text.secondary' sx={{ textAlign: 'right' }}>
          {range}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gap: 1,
          width: '100%',
          p: { xs: 1.25, sm: 1.5 },
          border: '1px solid',
          borderColor: error || rangeIsRented ? 'error.main' : 'divider',
          borderRadius: 2
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr 32px', alignItems: 'center' }}>
          <IconButton type='button' size='small' aria-label='Previous month' onClick={() => shift(-1)}>
            <i className='tabler-chevron-left' />
          </IconButton>
          <Typography align='center' variant='body2' sx={{ fontWeight: 600 }}>
            {monthLabel(cursor.year, cursor.month)}
          </Typography>
          <IconButton type='button' size='small' aria-label='Next month' onClick={() => shift(1)}>
            <i className='tabler-chevron-right' />
          </IconButton>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(label => (
            <Typography key={label} variant='caption' align='center' color='text.secondary'>
              {label}
            </Typography>
          ))}
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5 }}>
          {cells.map((cell, index) =>
            cell ? (
              <Box
                key={cell.iso}
                component='button'
                type='button'
                aria-label={formatDay(cell.iso)}
                aria-pressed={chosen(cell.iso)}
                aria-disabled={closed || cell.iso < today}
                onClick={() => pickDay(cell.iso)}
                sx={{
                  width: '100%',
                  height: { xs: 44, sm: 52 },
                  p: 0,
                  borderRadius: 1,
                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor:
                    dayState(cell.iso) === 'partial' ? 'warning.main' : dayState(cell.iso) === 'booked' ? 'error.main' : 'transparent',
                  cursor: closed || cell.iso < today ? 'not-allowed' : 'pointer',
                  bgcolor:
                    dayState(cell.iso) === 'booked'
                      ? 'error.main'
                      : dayState(cell.iso) === 'picked'
                        ? 'primary.main'
                        : dayState(cell.iso) === 'partial'
                          ? 'var(--mui-palette-warning-lightOpacity)'
                          : 'action.hover',
                  color:
                    dayState(cell.iso) === 'booked' || dayState(cell.iso) === 'picked'
                      ? 'common.white'
                      : dayState(cell.iso) === 'past'
                        ? 'text.disabled'
                        : 'text.primary',
                  textDecoration: dayState(cell.iso) === 'booked' ? 'line-through' : 'none',
                  boxShadow: chosen(cell.iso) && dayState(cell.iso) === 'booked' ? 'inset 0 0 0 2px #fff' : 'none'
                }}
              >
                {Number(cell.iso.slice(-2))}
              </Box>
            ) : (
              <span key={`pad-${index}`} />
            )
          )}
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1, sm: 1.5 } }}>
          {[
            { label: 'Selected', color: 'primary.main' },
            { label: 'Rented', color: 'error.main' },
            { label: 'Free piece', color: 'warning.main' }
          ].map(item => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
              <Typography variant='caption' color='text.secondary'>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
        <Typography variant='caption' color={closed || hint || error || rangeIsRented ? 'error.main' : 'text.secondary'}>
          {note}
        </Typography>
      </Box>
    </Box>
  )
}

export default AdminRentCalendar
