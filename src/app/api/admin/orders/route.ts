import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getOrderStatusCounts, listOrdersTable } from '@/libs/orders'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)

  if (url.searchParams.get('counts') === '1') {
    return NextResponse.json(await getOrderStatusCounts())
  }

  return NextResponse.json(await listOrdersTable(parseTableQuery(url)))
}
