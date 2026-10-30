import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ lang: string }>
}

const Page = async ({ params }: Props) => {
  const { lang } = await params

  redirect(`/${lang}/store/discounts`)
}

export default Page
