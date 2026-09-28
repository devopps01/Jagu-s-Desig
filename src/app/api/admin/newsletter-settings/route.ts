import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getNewsletterSettings, saveNewsletterSettings } from '@/libs/newsletter'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getNewsletterSettings())
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await saveNewsletterSettings(await req.json()))
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to save newsletter settings' },
      { status: 400 }
    )
  }
}
