'use client'

import { forwardRef } from 'react'

import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { dayFullyHeld, holdStillOut, type RentSpan } from '@/libs/rent-span'

type Block = RentSpan

const toDate = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null

  const [year, month, day] = iso.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const coverCount = (iso: string, blocked: Block[]) => blocked.filter(hold => holdStillOut(hold) && dayFullyHeld(iso, hold)).length

const isBlocked = (iso: string, blocked: Block[], stock: number) => coverCount(iso, blocked) >= Math.max(1, stock)

const Field = forwardRef<HTMLButtonElement, { label: string; value?: string; onClick?: () => void }>(({ label, value, onClick }, ref) => (
  <label className='jr-date-field'>
    {label}
    <button ref={ref} type='button' className='jr-date-input' onClick={onClick}>
      <span className={value ? undefined : 'is-empty'}>{value || 'dd-mm-yyyy'}</span>
      <i className='tabler-calendar-event' aria-hidden />
    </button>
  </label>
))

Field.displayName = 'RentDateFieldInput'

const RentDateField = ({
  label,
  value,
  min,
  blocked = [],
  stock = 1,
  onChange,
  onClose
}: {
  label: string
  value: string
  min?: string
  blocked?: Block[]
  stock?: number
  onChange: (iso: string) => void
  onClose?: () => void
}) => (
  <AppReactDatepicker
    withPortal
    showPopperArrow={false}
    popperPlacement='bottom-start'
    selected={toDate(value)}
    minDate={toDate(min || '') || undefined}
    filterDate={date => !isBlocked(toIso(date), blocked, stock)}
    dayClassName={date => (isBlocked(toIso(date), blocked, stock) ? 'jr-mui-booked' : '')}
    dateFormat='dd-MM-yyyy'
    placeholderText='dd-mm-yyyy'
    customInput={<Field label={label} />}
    onChange={(date: Date | null) => onChange(date ? toIso(date) : '')}
    onCalendarClose={onClose}
    boxProps={{ className: 'jr-mui-date' }}
  />
)

export default RentDateField
