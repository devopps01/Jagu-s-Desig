import { NextResponse } from 'next/server'

import { getPublishedBlogPostBySlug } from '@/libs/blog-posts'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)

  if (!post) return NextResponse.json({ message: 'Not found' }, { status: 404 })

  return NextResponse.json(post)
}
