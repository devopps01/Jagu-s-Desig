import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getSiteThemeSettings, saveSiteThemeSettings } from '@/libs/site-theme'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getSiteThemeSettings())
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await saveSiteThemeSettings(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save theme' }, { status: 400 })
  }
}
