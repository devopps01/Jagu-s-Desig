import { NextResponse } from 'next/server'

import { requireAdminSession } from '@/libs/admin-session'
import { createBlogPost, listBlogPostsTable } from '@/libs/blog-posts'
import { parseTableQuery } from '@/libs/table-query'

export async function GET(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(await listBlogPostsTable(parseTableQuery(new URL(req.url))))
}

export async function POST(req: Request) {
  const session = await requireAdminSession()

  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    return NextResponse.json(await createBlogPost(await req.json()))
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'Failed to save blog post' }, { status: 400 })
  }
}
