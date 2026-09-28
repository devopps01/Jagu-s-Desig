import { NextResponse } from 'next/server'

import { checkRentAvailability } from '@/libs/rentals'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const result = await checkRentAvailability({
    productSlug: params.get('slug') || params.get('productSlug') || '',
    size: params.get('size') || '',
    startDate: params.get('startDate') || params.get('start') || '',
    endDate: params.get('endDate') || params.get('end') || '',
    excludeId: params.get('excludeId') || undefined
  })

  return NextResponse.json(result)
}
