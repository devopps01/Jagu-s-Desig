import Link from 'next/link'

import { imageAttrs } from '@web/lib/image-src'
import type { BlogPostPublic } from '@/libs/blog-posts'

const formatDate = (value: Date | string | null) => {
  if (!value) return ''

  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const BlogIndex = ({ posts }: { posts: BlogPostPublic[] }) => (
  <section className='vn-section vn-policy vn-blog'>
    <div className='vn-page-hero'>
      <p className='vn-hero-kicker'>Journal</p>
      <h1>Blog</h1>
      <div className='vn-rule' />
      <p>Craft stories, styling notes, and behind-the-scenes from Jagu&apos;s Designing.</p>
    </div>

    {posts.length ? (
      <div className='vn-blog-grid'>
        {posts.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`} className='vn-blog-card'>
            <div className='vn-blog-card-media'>
              {post.coverImage ? (
                <img {...imageAttrs(post.coverImage, 'card')} alt={post.coverImageAlt} loading='lazy' decoding='async' />
              ) : (
                <div className='vn-blog-card-placeholder' aria-hidden>
                  <i className='tabler-article' />
                </div>
              )}
            </div>
            <div className='vn-blog-card-body'>
              <p className='vn-blog-meta'>
                {formatDate(post.publishedAt || post.createdAt)}
                {post.author ? ` · ${post.author}` : ''}
              </p>
              <h2>{post.title}</h2>
              {post.excerpt ? <p>{post.excerpt}</p> : null}
              {post.tags?.length ? (
                <div className='vn-blog-tags'>
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    ) : (
      <div className='vn-drawer-empty'>
        <p>No stories published yet</p>
        <span>Check back soon for craft notes and collection highlights.</span>
        <Link className='vn-btn vn-btn-solid' href='/collections/all'>
          Shop collections
        </Link>
      </div>
    )}
  </section>
)

export default BlogIndex
