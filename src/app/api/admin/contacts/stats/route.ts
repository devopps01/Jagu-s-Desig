import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getContactStats } from '@/libs/contact'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getContactStats())
}
