import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { cancelRentBooking, deleteRentBooking, markRentReturned, updateRentBooking } from '@/libs/rentals'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await updateRentBooking(id, await req.json())

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update rental' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)

  if (body?.action === 'return') {
    try {
      await markRentReturned(id, body)

      return NextResponse.json({ ok: true })
    } catch (error) {
      return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not mark this outfit returned' }, { status: 400 })
    }
  }

  if (body?.action !== 'cancel') return NextResponse.json({ message: 'Choose what to do with this booking' }, { status: 400 })

  try {
    await cancelRentBooking(id, body.returnFee, body.refundAmount)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not cancel this booking' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteRentBooking(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete rental' }, { status: 400 })
  }
}
