import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listRentAvailability } from '@/libs/rent-availability'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)

  return NextResponse.json(
    await listRentAvailability({
      start: url.searchParams.get('start') || '',
      end: url.searchParams.get('end') || '',
      category: url.searchParams.get('category') || '',
      size: url.searchParams.get('size') || '',
      search: url.searchParams.get('search') || '',
      availableOnly: url.searchParams.get('available') === '1'
    })
  )
}
