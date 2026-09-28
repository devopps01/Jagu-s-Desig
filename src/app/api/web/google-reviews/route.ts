import { NextResponse } from 'next/server'

import { getGoogleReviewPublic } from '@/libs/google-reviews'

export async function GET() {
  const data = await getGoogleReviewPublic()

  if (!data.enabled) {
    return NextResponse.json({ enabled: false, reviews: [] })
  }

  return NextResponse.json(data)
}
