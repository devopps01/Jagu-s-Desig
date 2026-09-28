import CollectionPage from '@web/components/CollectionPage'
import { withoutSareeWord } from '@/libs/public-label'
import { collectionTitles } from '@web/data/catalog'

const headingFor = (slug: string) => withoutSareeWord(collectionTitles[slug] || slug.replace(/-/g, ' '))

export const generateMetadata = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const title = headingFor(slug)

  return {
    title: `${title} | Jagu's Designing`,
    description: `Shop ${title.toLowerCase()} from Jagu’s Designing.`
  }
}

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params

  return <CollectionPage slug={slug} />
}

export default Page
