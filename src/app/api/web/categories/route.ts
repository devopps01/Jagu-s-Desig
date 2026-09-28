import { NextResponse } from 'next/server'

import { getHeaderCategories } from '@/libs/categories'

export async function GET() {
  return NextResponse.json(await getHeaderCategories())
}
