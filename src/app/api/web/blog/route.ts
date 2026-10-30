import { NextResponse } from 'next/server'

import { listPublishedBlogPosts } from '@/libs/blog-posts'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || 1) || 1)
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 12) || 12))

  return NextResponse.json(await listPublishedBlogPosts({ page, limit }))
}
