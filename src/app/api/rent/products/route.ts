import { NextResponse } from 'next/server'

import { listRentStoreProducts } from '@/libs/products'

export async function GET() {
  return NextResponse.json(await listRentStoreProducts())
}
