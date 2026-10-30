import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { generateBlogDraft } from '@/libs/blog-ai'

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const draft = await generateBlogDraft({
      topic: String(body.topic || ''),
      tone: String(body.tone || ''),
      language: String(body.language || ''),
      keywords: String(body.keywords || ''),
      length: body.length === 'short' || body.length === 'long' ? body.length : 'medium'
    })

    return NextResponse.json(draft)
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to generate blog' },
      { status: 400 }
    )
  }
}
