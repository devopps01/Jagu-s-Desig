import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getHomePageSettings, saveHomePageSettings } from '@/libs/home-page'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getHomePageSettings())
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await saveHomePageSettings(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save home page' }, { status: 400 })
  }
}
