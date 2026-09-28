import Link from 'next/link'

const frames = [
  {
    id: 'outer-left',
    src: '/images/home/home-engagement.png',
    alt: 'Pastel engagement look — side view'
  },
  {
    id: 'inner-left',
    src: '/images/home/home-party.png',
    alt: 'Festive party chaniya choli — full look'
  },
  {
    id: 'center',
    src: '/images/home/home-navratri.png',
    alt: 'Signature festive look — front portrait'
  },
  {
    id: 'inner-right',
    src: '/images/home/home-wedding.png',
    alt: 'Bridal edit — ceremony silhouette'
  },
  {
    id: 'outer-right',
    src: '/images/home/home-craft.png',
    alt: 'Handcrafted embroidery detail look'
  }
] as const

const dandiyaArt = {
  left: '/images/home/fan-dandiya-left.png',
  right: '/images/home/fan-dandiya-right.png'
} as const

const HomeFanLook = () => (
  <section className='vn-section vn-fan-look' aria-label='Most trending Navratri looks'>
    <div className='vn-fan-look-frame'>
      <div className='vn-fan-head-wrap'>
        <div className='vn-section-head vn-fan-head'>
          <p className='vn-section-note'>Current most trending requirement</p>
          <div className='vn-rule' />
          <h2>Navratri Favourites</h2>
        </div>
      </div>

      <img
        className='vn-fan-dandiya is-left'
        src={dandiyaArt.left}
        alt=''
        aria-hidden='true'
        draggable={false}
      />
      <img
        className='vn-fan-dandiya is-right'
        src={dandiyaArt.right}
        alt=''
        aria-hidden='true'
        draggable={false}
      />

      <div className='vn-fan-stack'>
        {frames.map(frame => (
          <Link
            key={frame.id}
            href='/collections/festive'
            className={`vn-fan-card is-${frame.id}`}
            aria-label={frame.alt}
          >
            <img src={frame.src} alt={frame.alt} />
          </Link>
        ))}
      </div>
    </div>
  </section>
)

export default HomeFanLook
