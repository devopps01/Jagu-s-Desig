import { Suspense } from 'react'

import RentAccount from '@/rent/RentAccount'

export const metadata = {
  title: "My rentals | Jagu's Rent"
}

const Page = () => (
  <Suspense fallback={<p className='vn-section'>Loading your rent account…</p>}>
    <RentAccount />
  </Suspense>
)

export default Page