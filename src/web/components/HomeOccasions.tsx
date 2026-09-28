import Link from 'next/link'

import { SectionHeader } from '@web/components/ProductGrid'

const occasions = [
  { title: 'Navratri', href: '/collections/festive', image: '/images/home/home-navratri.png' },
  { title: 'Wedding', href: '/collections/wedding', image: '/images/home/home-wedding.png' },
  { title: 'Engagement', href: '/collections/party', image: '/images/home/home-engagement.png' },
  { title: 'Party', href: '/collections/party', image: '/images/home/home-party.png' }
]

const HomeOccasions = () => (
  <section className='vn-section'>
    <SectionHeader title='Shop by occasion' note='Styled for every celebration' />
    <div className='vn-occasions'>
      {occasions.map(item => (
        <Link className='vn-occasion' key={item.title} href={item.href}>
          <img src={item.image} alt={`${item.title} chaniya choli`} />
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  </section>
)

export default HomeOccasions
