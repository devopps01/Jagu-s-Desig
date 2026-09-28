import CollectionShop from '@web/components/CollectionShop'
import { withoutSareeWord } from '@/libs/public-label'
import { collectionTitles } from '@web/data/catalog'

const CollectionPage = ({ slug, title }: { slug: string; title?: string }) => {
  const heading = withoutSareeWord(title || collectionTitles[slug] || slug.replace(/-/g, ' '))

  return <CollectionShop slug={slug} title={heading} />
}

export default CollectionPage
