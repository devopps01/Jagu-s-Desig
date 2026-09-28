import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { updateOrderRequestStatus, type OrderRequestStatus } from '@/libs/order-requests'

type Params = { params: Promise<{ id: string }> }

const statuses: OrderRequestStatus[] = ['requested', 'approved', 'rejected', 'completed']

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const status = statuses.includes(body.status) ? (body.status as OrderRequestStatus) : 'approved'

    await updateOrderRequestStatus(id, status, { adminNote: body.adminNote, refundAmount: body.refundAmount })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update request' }, { status: 400 })
  }
}
