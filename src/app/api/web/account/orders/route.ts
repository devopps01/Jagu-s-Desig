import { NextResponse } from 'next/server'

import { latestRequestByType, listRequestsForOrders } from '@/libs/order-requests'
import { canCancelOrder, canReturnOrder, canReviewOrder } from '@/libs/order-request-types'
import { listOrdersForUser } from '@/libs/orders'
import { getUserReviewedSlugs } from '@/libs/reviews'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const orders = await listOrdersForUser(session.email)
  const requests = await listRequestsForOrders(orders.map(order => order.id))
  const slugs = orders.flatMap(order => order.items.map(item => item.slug))
  const reviewed = await getUserReviewedSlugs(session.id, slugs)

  return NextResponse.json(
    orders.map(order => {
      const canReview = canReviewOrder(order.status)

      return {
        ...order,
        canCancel: canCancelOrder(order.status, order.cancelRequestStatus),
        canReturn: canReturnOrder(
          order.status,
          order.deliveredAt instanceof Date || typeof order.deliveredAt === 'string'
            ? order.deliveredAt
            : order.updatedAt instanceof Date || typeof order.updatedAt === 'string'
              ? order.updatedAt
              : undefined,
          order.returnRequestStatus
        ),
        canReview,
        cancelRequest: latestRequestByType(requests, order.id, 'cancel') || null,
        returnRequest: latestRequestByType(requests, order.id, 'return') || null,
        items: order.items.map(item => ({
          ...item,
          canReview,
          reviewed: reviewed.has(item.slug)
        }))
      }
    })
  )
}
