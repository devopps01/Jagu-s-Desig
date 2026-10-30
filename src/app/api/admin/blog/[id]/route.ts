import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { deleteBlogPost, getBlogPostById, updateBlogPost, updateBlogPostStatus } from '@/libs/blog-posts'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    return NextResponse.json(await getBlogPostById(id))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Blog post not found' }, { status: 404 })
  }
}

export async function PUT(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await updateBlogPost(id, await req.json())

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update blog post' }, { status: 400 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    const body = await req.json()

    await updateBlogPostStatus(id, body.status === 'published' ? 'published' : 'draft')

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to update status' }, { status: 400 })
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteBlogPost(id)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to delete blog post' }, { status: 400 })
  }
}
