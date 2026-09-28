'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControlLabel from '@mui/material/FormControlLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import GlobalStyles from '@mui/material/GlobalStyles'
import { useMediaQuery } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import type { Theme } from '@mui/material/styles'
import type { CalendarOptions } from '@fullcalendar/core'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import classnames from 'classnames'
import 'bootstrap-icons/font/bootstrap-icons.css'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import type { ThemeColor } from '@core/types'
import type { RentBooking, RentStatus } from '@/libs/rentals'

const STATUS_COLORS: Record<RentStatus, ThemeColor> = {
  booked: 'primary',
  ongoing: 'warning',
  returned: 'success',
  cancelled: 'secondary'
}

const ALL_STATUSES: RentStatus[] = ['booked', 'ongoing', 'returned', 'cancelled']

const pad = (value: number) => String(value).padStart(2, '0')

const localDate = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const localTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const addDays = (value: string, amount: number) => {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  date.setDate(date.getDate() + amount)

  return localDate(date)
}

const formatSlot = (value?: string) => {
  if (!value) return ''

  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()

  date.setHours(hours, minutes || 0, 0, 0)

  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

const toEvents = (row: RentBooking) => {
  const sameDay = row.startDate === row.endDate
  const label = `${row.productName} · ${row.size}`

  return [
    {
      id: `${row.id}__span`,
      title: label,
      start: row.startDate,
      end: addDays(row.endDate, 1),
      allDay: true,
      display: 'background' as const,
      editable: false,
      extendedProps: { calendar: row.status, rental: row, kind: 'span' }
    },
    {
      id: `${row.id}__start`,
      title: sameDay ? `${formatSlot(row.startTime)}–${formatSlot(row.endTime)} · ${label}` : `Start ${formatSlot(row.startTime)} · ${label}`,
      start: row.startDate,
      allDay: true,
      order: -20,
      extendedProps: { calendar: row.status, rental: row, kind: 'start' }
    },
    ...(!sameDay
      ? [
          {
            id: `${row.id}__end`,
            title: `End ${formatSlot(row.endTime)} · ${label}`,
            start: row.endDate,
            allDay: true,
            order: -10,
            extendedProps: { calendar: row.status, rental: row, kind: 'end' }
          }
        ]
      : [])
  ]
}

const RentCalendar = ({
  bookings,
  onAdd,
  onSelect,
  onDatesChange
}: {
  bookings: RentBooking[]
  onAdd: (dates?: { startDate: string; endDate: string }) => void
  onSelect: (row: RentBooking) => void
  onDatesChange: (row: RentBooking) => void
}) => {
  const theme = useTheme()
  const mdAbove = useMediaQuery((muiTheme: Theme) => muiTheme.breakpoints.up('md'))
  const calendarRef = useRef<FullCalendar | null>(null)
  const [calendarApi, setCalendarApi] = useState<any>(null)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [selected, setSelected] = useState<RentStatus[]>(ALL_STATUSES)
  const [moreAnchor, setMoreAnchor] = useState<HTMLElement | null>(null)
  const [moreDate, setMoreDate] = useState('')
  const [moreBookings, setMoreBookings] = useState<RentBooking[]>([])

  useEffect(() => {
    if (calendarApi === null && calendarRef.current) {
      setCalendarApi(calendarRef.current.getApi())
    }
  }, [calendarApi])

  const events = useMemo(
    () => bookings.filter(item => selected.includes(item.status)).flatMap(toEvents),
    [bookings, selected]
  )

  const calendarOptions: CalendarOptions = {
    events,
    plugins: [interactionPlugin, dayGridPlugin, timeGridPlugin, listPlugin],
    initialView: 'dayGridMonth',
    headerToolbar: {
      start: 'sidebarToggle, prev, next, title',
      end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
    },
    buttonText: {
      today: 'Today',
      month: 'Month',
      week: 'Week',
      day: 'Day',
      list: 'List'
    },
    height: 'auto',
    editable: true,
    eventResizableFromStart: false,
    dragScroll: true,
    dayMaxEvents: 1,
    displayEventTime: false,
    eventOrder: 'order,title',
    moreLinkText: (hidden: number) => `View more (${hidden})`,
    moreLinkHint: 'View all bookings for this day',
    moreLinkClick(info: any) {
      const fromEvent = info.jsEvent?.target as HTMLElement | undefined
      const anchor =
        (info.el instanceof HTMLElement && info.el) ||
        fromEvent?.closest?.('.fc-daygrid-more-link, .fc-more-link, a, button') ||
        fromEvent

      const unique: RentBooking[] = []
      const seen = new Set<string>()

      for (const seg of info.allSegs || []) {
        const rental = seg.event?.extendedProps?.rental as RentBooking | undefined

        if (!rental || seen.has(rental.id)) continue

        seen.add(rental.id)
        unique.push(rental)
      }

      setMoreDate(info.date ? localDate(info.date) : '')
      setMoreBookings(unique)

      if (anchor instanceof HTMLElement && document.body.contains(anchor)) {
        setMoreAnchor(anchor)
      }

      info.jsEvent?.preventDefault?.()
      info.jsEvent?.stopPropagation?.()
    },
    navLinks: true,
    direction: theme.direction,
    eventClassNames({ event: calendarEvent }: any) {
      const colorName = STATUS_COLORS[(calendarEvent._def.extendedProps.calendar as RentStatus) || 'booked']
      const kind = calendarEvent.extendedProps?.kind as string | undefined

      return [`event-bg-${colorName}`, kind ? `rent-event-${kind}` : '']
    },
    eventClick({ event: clickedEvent, jsEvent }: any) {
      jsEvent.preventDefault()
      const rental = clickedEvent.extendedProps?.rental as RentBooking | undefined

      if (rental) onSelect(rental)
    },
    customButtons: {
      sidebarToggle: {
        icon: 'tabler tabler-menu-2',
        click() {
          setLeftSidebarOpen(open => !open)
        }
      }
    },
    dateClick(info: any) {
      if ((info.jsEvent?.target as HTMLElement | undefined)?.closest?.('.fc-daygrid-more-link, .fc-more-link, .fc-daygrid-event')) {
        return
      }

      onAdd({ startDate: localDate(info.date), endDate: localDate(info.date) })
    },
    eventDrop({ event: droppedEvent, revert }: any) {
      const rental = droppedEvent.extendedProps?.rental as RentBooking | undefined
      const kind = droppedEvent.extendedProps?.kind as string | undefined

      if (!rental || !droppedEvent.start || kind === 'span') {
        revert?.()

        return
      }

      const nextDate = localDate(droppedEvent.start)

      if (kind === 'start') {
        if (nextDate > rental.endDate) {
          revert?.()

          return
        }

        onDatesChange({ ...rental, startDate: nextDate, startTime: rental.startTime || localTime(droppedEvent.start) })

        return
      }

      if (kind === 'end') {
        if (nextDate < rental.startDate) {
          revert?.()

          return
        }

        onDatesChange({ ...rental, endDate: nextDate, endTime: rental.endTime || localTime(droppedEvent.start) })
      }
    }
  }

  return (
    <>
      <Drawer
        open={mdAbove ? true : leftSidebarOpen}
        onClose={() => setLeftSidebarOpen(false)}
        variant={mdAbove ? 'permanent' : 'temporary'}
        ModalProps={{
          disablePortal: true,
          disableAutoFocus: true,
          disableScrollLock: true,
          keepMounted: true
        }}
        className={classnames('block', { static: mdAbove, absolute: !mdAbove })}
        slotProps={{
          paper: {
            className: classnames('items-start is-[280px] shadow-none rounded rounded-se-none rounded-ee-none', {
              static: mdAbove,
              absolute: !mdAbove
            })
          }
        }}
        sx={{
          zIndex: 3,
          '& .MuiDrawer-paper': { zIndex: mdAbove ? 2 : 'drawer' },
          '& .MuiBackdrop-root': { borderRadius: 1, position: 'absolute' }
        }}
      >
        <div className='is-full p-6'>
          <Button fullWidth variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => onAdd()}>
            Add Event
          </Button>
        </div>
        <Divider className='is-full' />
        <AppReactDatepicker
          inline
          onChange={date => date && calendarApi?.gotoDate(date)}
          boxProps={{
            className: 'flex justify-center is-full',
            sx: { '& .react-datepicker': { boxShadow: 'none !important', border: 'none !important' } }
          }}
        />
        <Divider className='is-full' />
        <div className='flex flex-col p-6 is-full'>
          <Typography variant='h5' className='mbe-4'>
            Event Filters
          </Typography>
          <FormControlLabel
            className='mbe-1'
            label='View All'
            control={
              <Checkbox
                color='secondary'
                checked={selected.length === ALL_STATUSES.length}
                onChange={event => setSelected(event.target.checked ? ALL_STATUSES : [])}
              />
            }
          />
          {ALL_STATUSES.map(status => (
            <FormControlLabel
              className='mbe-1'
              key={status}
              label={status.charAt(0).toUpperCase() + status.slice(1)}
              control={
                <Checkbox color={STATUS_COLORS[status]} checked={selected.includes(status)} onChange={() => setSelected(current => (current.includes(status) ? current.filter(item => item !== status) : [...current, status]))} />
              }
            />
          ))}
        </div>
      </Drawer>
      <GlobalStyles
        styles={{
          '.rent-booking-calendar .fc-daygrid-more-link, .rent-booking-calendar .fc-more-link': {
            display: 'inline-flex',
            alignItems: 'center',
            marginTop: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: 'var(--mui-palette-action-hover)',
            color: 'var(--mui-palette-primary-main) !important',
            textDecoration: 'none !important'
          },
          '.rent-booking-calendar .fc-bg-event': {
            opacity: 0.16
          }
        }}
      />
      <div className='p-6 pbe-0 grow overflow-visible bg-backgroundPaper rounded rent-booking-calendar'>
        <FullCalendar ref={calendarRef} {...calendarOptions} />
      </div>
      <Menu
        anchorEl={moreAnchor}
        open={Boolean(moreAnchor?.isConnected)}
        onClose={() => setMoreAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            sx: { minWidth: 280, maxWidth: 360, maxHeight: 420 }
          }
        }}
      >
        <Box className='flex items-center justify-between gap-4' sx={{ px: 4, py: 2 }}>
          <Typography variant='subtitle2'>
            {moreDate
              ? new Date(`${moreDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : 'Bookings'}
          </Typography>
          <Chip size='small' variant='tonal' color='primary' label={`${moreBookings.length}`} />
        </Box>
        <Divider />
        {moreBookings.map(row => (
          <MenuItem
            key={row.id}
            onClick={() => {
              setMoreAnchor(null)
              onSelect(row)
            }}
            sx={{ alignItems: 'flex-start', py: 2, whiteSpace: 'normal' }}
          >
            <Box className='flex flex-col gap-1' sx={{ minWidth: 0 }}>
              <Typography variant='body2' className='font-medium'>
                {row.productName}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.size} · {formatSlot(row.startTime)} – {formatSlot(row.endTime)}
                {row.startDate !== row.endDate ? ` · ${row.startDate} → ${row.endDate}` : ''}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        {!moreBookings.length ? (
          <MenuItem disabled>
            <Typography variant='body2' color='text.secondary'>
              No bookings
            </Typography>
          </MenuItem>
        ) : null}
      </Menu>
    </>
  )
}

export default RentCalendar
