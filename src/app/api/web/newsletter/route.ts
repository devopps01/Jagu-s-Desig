import { NextResponse } from 'next/server'

import { getNewsletterSettings, subscribeNewsletter } from '@/libs/newsletter'

export async function GET() {
  return NextResponse.json(await getNewsletterSettings())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const settings = await getNewsletterSettings()

    if (!settings.enabled) {
      return NextResponse.json({ message: 'Newsletter signup is currently closed' }, { status: 400 })
    }

    const result = await subscribeNewsletter({
      email: body.email,
      website: body.website,
      source: body.source || 'home'
    })

    return NextResponse.json({
      ok: true,
      already: result.already,
      message: result.already ? 'You are already subscribed.' : settings.successMessage
    })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not subscribe' },
      { status: 400 }
    )
  }
}
