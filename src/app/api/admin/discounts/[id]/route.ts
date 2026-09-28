import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { deleteDiscount, updateDiscount, updateDiscountStatus } from '@/libs/discounts'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await updateDiscount(id, await req.json())

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update discount' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()

    await updateDiscountStatus(id, body.status === 'inactive' ? 'inactive' : 'active')

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update status' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteDiscount(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete discount' }, { status: 400 })
  }
}
