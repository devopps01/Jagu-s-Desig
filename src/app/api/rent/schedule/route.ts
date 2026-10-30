import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { getRentStoreProduct } from '@/libs/products'
import { listPublicRentHolds } from '@/libs/rentals'

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') || ''
  const product = slug ? await getRentStoreProduct(slug) : null

  if (!product) return NextResponse.json({ message: 'Outfit not found' }, { status: 404 })

  const holds = await listPublicRentHolds(slug)
  const today = new Date()
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const current = holds.filter(hold => hold.startDate <= iso && hold.endDate >= iso)

  return NextResponse.json({
    today: iso,
    rentedNow: current.length > 0,
    current,
    holds
  })
}
