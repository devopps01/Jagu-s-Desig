import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getSiteChromeSettings, saveSiteChromeSettings } from '@/libs/site-chrome'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getSiteChromeSettings())
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await saveSiteChromeSettings(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save header/footer' }, { status: 400 })
  }
}
