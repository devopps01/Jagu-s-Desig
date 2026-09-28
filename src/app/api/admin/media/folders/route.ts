import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createPublicFolder, listPublicFolder } from '@/libs/media'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const pathName = new URL(req.url).searchParams.get('path') || ''

  try {
    return NextResponse.json(await listPublicFolder(pathName))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to list folder' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))

  try {
    const created = await createPublicFolder(String(body.path || ''), String(body.name || ''))

    return NextResponse.json({ ok: true, path: created })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to create folder' }, { status: 400 })
  }
}
