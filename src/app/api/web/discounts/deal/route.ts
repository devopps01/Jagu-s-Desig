import { NextResponse } from 'next/server'

import { getProductDeal } from '@/libs/discounts'

export async function GET() {
  return NextResponse.json(await getProductDeal())
}
