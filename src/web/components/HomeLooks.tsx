import Link from 'next/link'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'

const looks = [
  {
    title: 'Garba nights',
    text: 'Mirror work made to move',
    href: '/collections/festive',
    image: '/images/home/home-navratri.png',
    imageMobile: ''
  },
  {
    title: 'Bridal edit',
    text: 'Wine, gold and ceremony',
    href: '/collections/wedding',
    image: '/images/home/home-wedding.png',
    imageMobile: ''
  }
]

const HomeLooks = ({
  items = looks
}: {
  items?: { title: string; text: string; href: string; image: string; imageMobile?: string; showTitle?: boolean; showText?: boolean }[]
}) => (
  <section className='vn-section vn-looks'>
    {items.map(item => (
      <Link className='vn-look' key={`${item.title}-${item.href}`} href={item.href || '#'}>
        <ResponsiveHomeImage image={item.image} imageMobile={item.imageMobile} alt={item.title} size='card' />
        <div className='vn-look-copy'>
          {item.showText !== false && item.text ? <p>{item.text}</p> : null}
          {item.showTitle !== false ? <h3>{item.title}</h3> : null}
          <span>Explore</span>
        </div>
      </Link>
    ))}
  </section>
)

export default HomeLooks
