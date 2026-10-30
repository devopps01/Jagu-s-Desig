import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { suggestCustomers } from '@/libs/customer-suggest'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const query = new URL(req.url).searchParams.get('q') || ''

  return NextResponse.json({ data: await suggestCustomers(query) })
}
