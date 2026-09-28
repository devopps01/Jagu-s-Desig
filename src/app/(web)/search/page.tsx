import SearchPage from '@web/components/SearchPage'

const Page = async ({ searchParams }: { searchParams: Promise<{ q?: string; search?: string }> }) => {
  const params = await searchParams
  const query = (params.q || params.search || '').trim()

  return <SearchPage query={query} />
}

export default Page
