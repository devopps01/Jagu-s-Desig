import { NextResponse } from 'next/server'

import { getContentPageSettings } from '@/libs/content-page'

export async function GET(req: Request) {
  const page = new URL(req.url).searchParams.get('page') || 'about'

  return NextResponse.json(await getContentPageSettings(page))
}
