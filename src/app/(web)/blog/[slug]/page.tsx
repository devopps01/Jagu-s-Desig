import { notFound } from 'next/navigation'

import BlogPostPage from '@web/components/BlogPostPage'
import { getPublishedBlogPostBySlug } from '@/libs/blog-posts'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)

  if (!post) return { title: "Blog | Jagu's Designing" }

  return {
    title: `${post.title} | Jagu's Designing`,
    description: post.excerpt || post.title
  }
}

const Page = async ({ params }: Props) => {
  const { slug } = await params
  const post = await getPublishedBlogPostBySlug(slug)

  if (!post) notFound()

  return <BlogPostPage post={post} />
}

export default Page
