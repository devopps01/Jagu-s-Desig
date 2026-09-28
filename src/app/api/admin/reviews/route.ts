import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listReviewsTable } from '@/libs/reviews'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listReviewsTable(parseTableQuery(new URL(req.url))))
}
