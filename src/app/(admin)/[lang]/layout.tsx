import type { ChildrenType } from '@core/types'

import AdminRootLayout, { adminMetadata } from '@admin/layouts/AdminRootLayout'

export const metadata = adminMetadata

const RootLayout = async (props: ChildrenType & { params: Promise<{ lang: string }> }) => {
  return <AdminRootLayout {...props} />
}

export default RootLayout
