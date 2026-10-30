import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { cancelShopSale, deleteShopSale, updateShopSale } from '@/libs/sales'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)

  if (body?.action !== 'cancel') return NextResponse.json({ message: 'Choose what to do with this sale' }, { status: 400 })

  try {
    return NextResponse.json({ data: await cancelShopSale(id, body.returnFee, body.refundAmount) })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not cancel this outfit' }, { status: 400 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    return NextResponse.json({ data: await updateShopSale(id, await req.json()) })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update this sale' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    await deleteShopSale(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete sale' }, { status: 400 })
  }
}
