import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { sendPushCampaign } from '@/libs/push-campaigns'

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    return NextResponse.json(await sendPushCampaign(id))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to send campaign' }, { status: 400 })
  }
}
