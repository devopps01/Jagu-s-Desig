import Link from 'next/link'

import { imageAttrs } from '@web/lib/image-src'

type BlogPostView = {
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string
  coverImageAlt: string
  author: string
  tags: string[]
  publishedAt: Date | string | null
  createdAt: Date | string
}

const formatDate = (value: Date | string | null) => {
  if (!value) return ''

  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })
}

const BlogPostPage = ({ post }: { post: BlogPostView }) => {
  const paragraphs = post.content.split(/\n\n+/).map(item => item.trim()).filter(Boolean)

  return (
    <article className='vn-section vn-policy vn-blog vn-blog-article'>
      <div className='vn-page-hero'>
        <p className='vn-hero-kicker'>Blog</p>
        <h1>{post.title}</h1>
        <div className='vn-rule' />
        <p className='vn-blog-meta'>
          {formatDate(post.publishedAt || post.createdAt)}
          {post.author ? ` · ${post.author}` : ''}
        </p>
        {post.excerpt ? <p>{post.excerpt}</p> : null}
      </div>

      {post.coverImage ? (
        <div className='vn-blog-hero-image'>
          <img {...imageAttrs(post.coverImage, 'full')} alt={post.coverImageAlt} loading='eager' decoding='async' />
        </div>
      ) : null}

      <div className='vn-policy-prose vn-blog-prose'>
        {paragraphs.map(paragraph => (
          <p key={paragraph.slice(0, 48)}>{paragraph}</p>
        ))}
      </div>

      {post.tags?.length ? (
        <div className='vn-blog-tags vn-blog-tags-inline'>
          {post.tags.map(tag => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      <div className='vn-account-actions vn-policy-actions'>
        <Link className='vn-btn vn-btn-outline' href='/blog'>
          All posts
        </Link>
        <Link className='vn-btn vn-btn-solid' href='/collections/all'>
          Shop now
        </Link>
      </div>
    </article>
  )
}

export default BlogPostPage
