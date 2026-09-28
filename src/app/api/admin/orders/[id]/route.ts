import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getOrder, updateOrderStatus, type OrderStatus, type PaymentStatus } from '@/libs/orders'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    return NextResponse.json(await getOrder(id))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Order not found' }, { status: 404 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()

    await updateOrderStatus(id, body.status as OrderStatus, body.payment as PaymentStatus | undefined)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update order' }, { status: 400 })
  }
}
