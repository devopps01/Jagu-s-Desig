import { NextResponse } from 'next/server'

import { getGstSettings } from '@/libs/gst'

export async function GET() {
  return NextResponse.json(await getGstSettings())
}
