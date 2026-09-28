import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createRentBooking, listAllRentBookings, listRentBookingsTable } from '@/libs/rentals'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)

  if (url.searchParams.get('all') === '1') {
    return NextResponse.json({ data: await listAllRentBookings() })
  }

  return NextResponse.json(await listRentBookingsTable(parseTableQuery(url)))
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    return NextResponse.json(await createRentBooking(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save rental' }, { status: 400 })
  }
}
