import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listOtpLogs } from '@/libs/otp'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(await listOtpLogs(parseTableQuery(new URL(req.url))))
}
