import { NextResponse } from 'next/server'

import { getSiteThemeSettings } from '@/libs/site-theme'

export async function GET() {
  return NextResponse.json(await getSiteThemeSettings())
}
