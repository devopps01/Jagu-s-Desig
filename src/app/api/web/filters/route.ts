import { NextResponse } from 'next/server'

import { resolveCollectionFilters } from '@/libs/filters'

export async function GET(req: Request) {
  const slug = new URL(req.url).searchParams.get('slug') || ''

  return NextResponse.json(await resolveCollectionFilters(slug))
}
