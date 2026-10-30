import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createShopSale, createShopSales, listShopSales } from '@/libs/sales'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ data: await listShopSales() })
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()

    if (Array.isArray(body?.items)) return NextResponse.json({ data: await createShopSales(body.items) })

    return NextResponse.json(await createShopSale(body))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save sale' }, { status: 400 })
  }
}
