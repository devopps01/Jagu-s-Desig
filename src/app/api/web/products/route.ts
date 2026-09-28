import { NextResponse } from 'next/server'

import { listStoreProducts, searchStoreProducts } from '@/libs/products'

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const search = (params.get('search') || params.get('q') || '').trim()
  const slug = params.get('slug') || ''
  const limit = Number(params.get('limit') || 8) || 8

  if (search) {
    return NextResponse.json(await searchStoreProducts(search, limit))
  }

  return NextResponse.json(await listStoreProducts(slug || undefined))
}
