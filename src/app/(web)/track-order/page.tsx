import { Suspense } from 'react'

import TrackOrderPage from '@web/components/TrackOrderPage'

export const metadata = {
  title: "Track Order | Jagu's Designing",
  description: 'Track a Jagu’s Designing order, request a cancel before dispatch, or start a return after delivery.'
}

const Page = () => (
  <Suspense fallback={<section className='vn-section'>Loading tracker…</section>}>
    <TrackOrderPage />
  </Suspense>
)

export default Page
