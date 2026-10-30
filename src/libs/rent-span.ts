export type RentSpan = {
  startDate: string
  endDate: string
  startTime?: string
  endTime?: string
}

const clock = (value: string | undefined, fallback: string) => (/^\d{2}:\d{2}$/.test(value || '') ? value || fallback : fallback)

const stamp = (date: string, time: string) => `${date}T${time}`

/** Two rentals need the same piece when their times cross. The return minute is free for the next pickup. */
export const rentSpansOverlap = (next: RentSpan, hold: RentSpan) => {
  if (!next.startDate || !next.endDate || !hold.startDate || !hold.endDate) return false

  const nextStart = stamp(next.startDate, clock(next.startTime, '00:00'))
  const nextEnd = stamp(next.endDate, clock(next.endTime, '23:59'))
  const holdStart = stamp(hold.startDate, clock(hold.startTime, '00:00'))
  const holdEnd = stamp(hold.endDate, clock(hold.endTime, '23:59'))

  return nextStart < holdEnd && holdStart < nextEnd
}

/** The piece is still out until the booked return time. After that, the dates can be taken again. */
export const holdStillOut = (hold: RentSpan, now = new Date()) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(hold.endDate || '')) return false

  const [year, month, day] = hold.endDate.split('-').map(Number)
  const [hour, minute] = clock(hold.endTime, '23:59').split(':').map(Number)
  const until = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0)

  return now.getTime() < until.getTime()
}

export const calendarDay = (value: Date | string = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))

export const previousDay = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1))

  date.setUTCDate(date.getUTCDate() - 1)

  return date.toISOString().slice(0, 10)
}

/**
 * While dress care is pending, the piece stays blocked.
 * After it is marked done, the done day and every later day are free.
 */
export const dressCareBlock = (row: {
  status?: string
  startDate?: string
  dressCareStatus?: string
  dressCareDoneAt?: Date | string | null
}): { span: RentSpan; ready: string | null } | null => {
  if (row.status !== 'returned' || !row.startDate) return null

  if (row.dressCareStatus === 'done' && row.dressCareDoneAt) {
    const ready = calendarDay(row.dressCareDoneAt)
    const until = previousDay(ready)

    if (until < row.startDate) return null

    return { span: { startDate: row.startDate, endDate: until }, ready }
  }

  return { span: { startDate: row.startDate, endDate: '9999-12-31' }, ready: null }
}

/** A day is closed when the piece is out for that whole day. The return day stays open for a new booking. */
export const dayFullyHeld = (iso: string, hold: RentSpan) => {
  if (!hold.startDate || !hold.endDate || iso < hold.startDate || iso > hold.endDate) return false

  const sameDay = hold.startDate === hold.endDate
  const timed = Boolean(hold.endTime)

  if (!sameDay && timed && iso === hold.endDate) return false

  return true
}
