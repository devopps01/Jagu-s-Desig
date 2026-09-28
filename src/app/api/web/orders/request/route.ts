import { NextResponse } from 'next/server'

import { createOrderRequest } from '@/libs/order-requests'
import { getWebSession } from '@/libs/web-auth'

export async function POST(req: Request) {
  try {
    const session = await getWebSession()
    const body = await req.json()

    return NextResponse.json(
      await createOrderRequest({
        type: body.type === 'return' ? 'return' : 'cancel',
        orderId: body.orderId,
        orderNo: body.orderNo,
        phone: body.phone,
        reason: body.reason,
        note: body.note,
        userEmail: session?.email || body.email,
        userId: session?.id
      })
    )
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not submit request' }, { status: 400 })
  }
}
