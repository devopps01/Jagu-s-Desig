import { Suspense } from 'react'

import RentBookPage from '@admin/views/RentBookPage'

const Page = () => (
  <Suspense>
    <RentBookPage />
  </Suspense>
)

export default Page
