import Link from 'next/link'

const NotFound = () => (
  <section className='vn-section jr-empty'>
    <p className='vn-section-note'>Jagu&apos;s Rent</p>
    <h1>This outfit is not on rent</h1>
    <p>It may be sale-only, or the link is wrong.</p>
    <Link className='vn-btn vn-btn-solid' href='/rent'>
      Back to rent outfits
    </Link>
  </section>
)

export default NotFound
