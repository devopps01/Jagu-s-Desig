import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { saleDashboard } from '@/libs/channel-dashboard'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await saleDashboard())
}
