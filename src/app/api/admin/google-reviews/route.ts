import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { getGoogleReviewSettings, refreshGoogleReviews, saveGoogleReviewSettings } from '@/libs/google-reviews'

export async function GET() {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await getGoogleReviewSettings())
}

export async function PUT(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await saveGoogleReviewSettings(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save Google reviews' }, { status: 400 })
  }
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))

    if (body && typeof body === 'object' && ('placeId' in body || 'apiKey' in body || 'enabled' in body)) {
      await saveGoogleReviewSettings(body)
    }

    return NextResponse.json(await refreshGoogleReviews(true))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not fetch Google reviews' }, { status: 400 })
  }
}
