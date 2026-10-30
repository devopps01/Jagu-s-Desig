import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listDressCare, updateDressCare } from '@/libs/rentals'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({ data: await listDressCare() })
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)

  try {
    const saved = await updateDressCare(String(body?.id || ''), body || {})

    return NextResponse.json({ data: saved })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update dress care' }, { status: 400 })
  }
}
