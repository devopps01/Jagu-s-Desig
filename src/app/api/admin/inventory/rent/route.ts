import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { listInventory, updateInventoryQuantity, updateRentInventorySizes } from '@/libs/inventory'
import { markRentReturned } from '@/libs/rentals'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listInventory('rent'))
}

export async function PATCH(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if (body.returnBookingId) {
      await markRentReturned(String(body.returnBookingId), body)

      return NextResponse.json(await listInventory('rent'))
    }

    const product =
      body.sizes && typeof body.sizes === 'object' && !Array.isArray(body.sizes)
        ? await updateRentInventorySizes(
            String(body.productId || ''),
            body.sizes as Record<string, number>,
            Array.isArray(body.outOfStock) ? body.outOfStock.map((item: unknown) => String(item)) : undefined,
            body.price === undefined ? undefined : { price: body.price, mrp: body.mrp }
          )
        : await updateInventoryQuantity('rent', String(body.productId || ''), String(body.size || ''), Number(body.quantity))

    return NextResponse.json({ product })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not update rent inventory' }, { status: 400 })
  }
}
