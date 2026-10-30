import { NextResponse } from 'next/server'

import { cancelOwnRentBooking, updateOwnRentBooking } from '@/libs/rentals'
import { getWebSession } from '@/libs/web-auth'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, context: RouteContext) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Login to change this booking' }, { status: 401 })

  try {
    const { id } = await context.params
    const body = await req.json()
    const booking = await updateOwnRentBooking(id, session.email, {
      size: String(body.size || ''),
      startDate: String(body.startDate || ''),
      endDate: String(body.endDate || ''),
      startTime: String(body.startTime || ''),
      endTime: String(body.endTime || ''),
      customerName: String(body.customerName || ''),
      customerPhone: String(body.customerPhone || ''),
      notes: String(body.notes || '')
    })

    return NextResponse.json({ ok: true, booking, message: 'Booking updated' })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not update this booking' },
      { status: 400 }
    )
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Login to cancel this booking' }, { status: 401 })

  try {
    const { id } = await context.params
    const booking = await cancelOwnRentBooking(id, session.email)

    return NextResponse.json({ ok: true, booking, message: 'Booking cancelled' })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not cancel this booking' },
      { status: 400 }
    )
  }
}
