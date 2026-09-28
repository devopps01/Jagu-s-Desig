import Link from 'next/link'

import { SectionHeader } from '@web/components/ProductGrid'

const stories = [
  {
    kicker: 'Garba nights',
    title: 'Chaniya choli made to move',
    image: '/images/home/home-navratri.png',
    alt: 'Navratri garba chaniya choli',
    copy: [
      'Navratri at Jagu’s Designing is cut for the circle. Flared skirts, secure blouses and mirror work that catches every taali.',
      'From the first night to the last, the drape stays light enough to dance and rich enough for the photographs.'
    ],
    href: '/collections/festive',
    cta: 'Shop Navratri'
  },
  {
    kicker: 'The atelier',
    title: 'Hand embroidery, nine nights long',
    image: '/images/home/home-craft.png',
    alt: 'Mirror work embroidery in the Surat atelier',
    copy: [
      'Each piece is embroidered in our Surat atelier — sequins, zari and abhla set by hand so the colour does not fade after a week of garba.',
      'Tell us your night, your colour and your comfort. We finish the blouse, the cancan and the dupatta to match.'
    ],
    href: '/video',
    cta: 'Book a styling call',
    reverse: true
  }
]

const notes = [
  {
    image: '/images/home/home-wedding.png',
    title: 'For the mandap too',
    text: 'The same craft that moves at garba is finished heavier for pheras and portraits.'
  },
  {
    image: '/images/home/home-engagement.png',
    title: 'Pastels for quieter nights',
    text: 'Ivory, peach and champagne when you want glow without the full festive red.'
  },
  {
    image: '/images/home/home-party.png',
    title: 'After the aarti',
    text: 'Emerald and gold silhouettes for receptions, dandiya nights and cocktail hours.'
  }
]

const HomeNavratri = () => (
  <section className='vn-section'>
    <SectionHeader title='Navratri, from the atelier' note='Image, craft and the nine nights' />
    <div className='vn-info-list'>
      {stories.map(item => (
        <article key={item.title} className={`vn-info${item.reverse ? ' is-reverse' : ''}`}>
          <div className='vn-info-media'>
            <img src={item.image} alt={item.alt} />
          </div>
          <div className='vn-info-copy'>
            <p className='vn-hero-kicker'>{item.kicker}</p>
            <h3>{item.title}</h3>
            {item.copy.map(paragraph => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Link className='vn-btn vn-btn-solid' href={item.href}>
              {item.cta}
            </Link>
          </div>
        </article>
      ))}
    </div>
    <div className='vn-info-more'>
      <SectionHeader title='Beyond the garba circle' note='Wedding, engagement and after-aarti looks' />
      <div className='vn-info-notes'>
        {notes.map(item => (
          <article key={item.title}>
            <img src={item.image} alt={item.title} />
            <h4>{item.title}</h4>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
)

export default HomeNavratri
