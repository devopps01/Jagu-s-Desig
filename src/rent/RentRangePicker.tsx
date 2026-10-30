'use client'

import DatePicker from 'react-datepicker'

import { dayFullyHeld, holdStillOut, type RentSpan } from '@/libs/rent-span'

import 'react-datepicker/dist/react-datepicker.css'

const TIMES = Array.from({ length: 29 }, (_, index) => {
  const minutes = 8 * 60 + index * 30
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
  const minute = String(minutes % 60).padStart(2, '0')

  return `${hour}:${minute}`
})

const toDate = (iso: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null

  const [year, month, day] = iso.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const toIso = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

const todayIso = () => toIso(new Date())

type Block = RentSpan

const RentRangePicker = ({
  startDate,
  endDate,
  startTime,
  endTime,
  blocked = [],
  allowPast = false,
  onDates,
  onTimes
}: {
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  blocked?: Block[]
  allowPast?: boolean
  onDates: (startDate: string, endDate: string) => void
  onTimes: (startTime: string, endTime: string) => void
}) => {
  const today = todayIso()
  const sameDayClash = Boolean(startDate && startDate === endDate && startTime && endTime && endTime <= startTime)

  return (
    <div className='jr-range'>
      <label>
        Rental dates
        <DatePicker
          selectsRange
          startDate={toDate(startDate)}
          endDate={toDate(endDate)}
          minDate={allowPast ? undefined : toDate(today) || undefined}
          filterDate={date => {
            const iso = toIso(date)

            if (!allowPast && iso < today) return false

            return !blocked.some(hold => holdStillOut(hold) && dayFullyHeld(iso, hold))
          }}
          onChange={range => {
            const [start, end] = range

            onDates(start ? toIso(start) : '', end ? toIso(end) : '')
          }}
          dateFormat='dd-MM-yyyy'
          placeholderText='Select from and to dates'
          className='jr-range-input'
          calendarClassName='jr-range-cal'
          wrapperClassName='jr-range-wrap'
          monthsShown={1}
          required
        />
      </label>
      <div className='jr-dates'>
        <label>
          From time
          <select value={startTime} required onChange={event => onTimes(event.target.value, endTime)}>
            {TIMES.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
        <label>
          To time
          <select value={endTime} required onChange={event => onTimes(startTime, event.target.value)}>
            {TIMES.map(time => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </label>
      </div>
      {sameDayClash ? <p className='jr-note is-bad'>Return time must be after pickup time on the same day.</p> : null}
    </div>
  )
}

export default RentRangePicker
