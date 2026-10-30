import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listInventory, updateInventoryQuantity, updateSaleInventorySizes } from '@/libs/inventory'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listInventory('sale'))
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const product =
      body.sizes && typeof body.sizes === 'object' && !Array.isArray(body.sizes)
        ? await updateSaleInventorySizes(
            String(body.productId || ''),
            body.sizes as Record<string, number | null>,
            Array.isArray(body.outOfStock) ? body.outOfStock.map((item: unknown) => String(item)) : undefined,
            body.price === undefined ? undefined : { price: body.price, mrp: body.mrp }
          )
        : await updateInventoryQuantity(
            'sale',
            String(body.productId || ''),
            String(body.size || ''),
            body.quantity === null || body.quantity === '' ? null : Number(body.quantity)
          )

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update selling inventory' }, { status: 400 })
  }
}
