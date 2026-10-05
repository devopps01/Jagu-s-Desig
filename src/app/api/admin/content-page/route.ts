import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getContentPageSettings, saveContentPageSettings } from '@/libs/content-page'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const page = new URL(req.url).searchParams.get('page') || 'about'

  return NextResponse.json(await getContentPageSettings(page))
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const page = String(body?.page || new URL(req.url).searchParams.get('page') || 'about')

    return NextResponse.json(await saveContentPageSettings(page, body))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save page' }, { status: 400 })
  }
}
