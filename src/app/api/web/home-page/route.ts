import { NextResponse } from 'next/server'

import { getHomePageSettings } from '@/libs/home-page'

export async function GET() {
  return NextResponse.json(await getHomePageSettings())
}
