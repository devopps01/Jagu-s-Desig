import CollectionPage from '@web/components/CollectionPage'

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params
  const title = slug.replace(/-/g, ' ')

  return <CollectionPage slug='handpicked' title={title} />
}

export default Page
