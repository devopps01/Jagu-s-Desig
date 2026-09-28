import { NextResponse } from 'next/server'

import { getFeaturedOffer } from '@/libs/discounts'

export async function GET() {
  return NextResponse.json(await getFeaturedOffer())
}
