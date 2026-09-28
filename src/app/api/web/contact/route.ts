import { NextResponse } from 'next/server'

import { createContactSubmission, getContactSettings } from '@/libs/contact'
import { sendContactNotify } from '@/libs/mailer'
import { getWebSession } from '@/libs/web-auth'

export async function GET() {
  return NextResponse.json(await getContactSettings())
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const session = await getWebSession()
    const submission = await createContactSubmission({
      name: body.name,
      email: body.email,
      phone: body.phone,
      subject: body.subject,
      message: body.message,
      website: body.website,
      userId: session?.id
    })

    try {
      await sendContactNotify(submission)
    } catch {
      // Inquiry is already saved; email is optional.
    }

    return NextResponse.json({ ok: true, message: 'Thank you. We have received your message.' })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Could not send message' }, { status: 400 })
  }
}
