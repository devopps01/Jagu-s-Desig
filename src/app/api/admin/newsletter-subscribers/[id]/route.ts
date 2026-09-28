import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { deleteNewsletterSubscriber } from '@/libs/newsletter'

export async function DELETE(_req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await context.params

    await deleteNewsletterSubscriber(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Could not delete subscriber' },
      { status: 400 }
    )
  }
}
