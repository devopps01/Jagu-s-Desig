import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { deleteContactSubmission, updateContactStatus, type ContactStatus } from '@/libs/contact'

type Params = { params: Promise<{ id: string }> }

const statuses: ContactStatus[] = ['new', 'read', 'replied', 'archived']

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()
    const status = statuses.includes(body.status) ? (body.status as ContactStatus) : 'read'

    await updateContactStatus(id, status)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update inquiry' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteContactSubmission(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete inquiry' }, { status: 400 })
  }
}
