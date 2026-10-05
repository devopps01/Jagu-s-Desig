import { NextResponse } from 'next/server'

import { getSiteChromeSettings } from '@/libs/site-chrome'

export async function GET() {
  return NextResponse.json(await getSiteChromeSettings())
}
