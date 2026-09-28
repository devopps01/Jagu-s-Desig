import { NextResponse } from 'next/server'

import { getWebSession } from '@/libs/web-auth'
import { listUserWishlist, mergeWishlist, setWishlistState } from '@/libs/wishlists'

export async function GET() {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listUserWishlist(session.id))
}

export async function POST(req: Request) {
  const session = await getWebSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()

    if (Array.isArray(body.products)) {
      return NextResponse.json(await mergeWishlist(session.id, session.email, body.products))
    }

    await setWishlistState(session.id, session.email, body.product, Boolean(body.wished))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save wishlist' }, { status: 400 })
  }
}
