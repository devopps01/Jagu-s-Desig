import { NextResponse } from 'next/server'

import { getRentStoreProduct } from '@/libs/products'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params
  const product = await getRentStoreProduct(slug)

  if (!product) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  return NextResponse.json(product)
}
