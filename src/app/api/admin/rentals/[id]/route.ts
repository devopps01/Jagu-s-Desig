import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { deleteRentBooking, updateRentBooking } from '@/libs/rentals'

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
