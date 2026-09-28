import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { updateFilter } from '@/libs/filters'

type Params = { params: Promise<{ key: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { key } = await params

  try {
    await updateFilter(key, await req.json())

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update filter' }, { status: 400 })
  }
}
