import { NextResponse } from 'next/server'

import { listRequestsForOrders } from '@/libs/order-requests'
import { canReviewOrder } from '@/libs/order-request-types'
import { trackOrder } from '@/libs/orders'
import { getUserReviewedSlugs } from '@/libs/reviews'
import { getWebSession } from '@/libs/web-auth'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const order = await trackOrder(
      url.searchParams.get('orderNo') || url.searchParams.get('order') || '',
      url.searchParams.get('lookup') || url.searchParams.get('phone') || url.searchParams.get('email') || ''
    )
    const requests = await listRequestsForOrders([order.id])
    const canReview = canReviewOrder(order.status)
    const session = await getWebSession()
    const reviewed =
      session && canReview ? await getUserReviewedSlugs(session.id, order.items.map(item => item.slug)) : new Set<string>()

    return NextResponse.json({
      ...order,
      requests,
      canReview,
      items: order.items.map(item => ({
        ...item,
        canReview,
        reviewed: reviewed.has(item.slug)
      }))
    })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Order not found' }, { status: 404 })
  }
}
