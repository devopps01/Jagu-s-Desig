import BlogIndex from '@web/components/BlogIndex'
import { listPublishedBlogPosts } from '@/libs/blog-posts'

export const metadata = {
  title: "Blog | Jagu's Designing",
  description: 'Craft stories, styling tips, and updates from Jagu’s Designing.'
}

const Page = async () => {
  const { data } = await listPublishedBlogPosts({ limit: 48 })

  return <BlogIndex posts={data} />
}

export default Page
