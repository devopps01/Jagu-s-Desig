import Link from 'next/link'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'

const HomeVideoBanner = ({
  eyebrow = 'Private atelier · Live styling',
  showEyebrow = true,
  lineOne = 'Shop Via',
  lineTwo = 'Video Call',
  showTitle = true,
  text = 'Experience the luxury of our bespoke services for any occasion',
  showText = true,
  buttonLabel = 'Book a session',
  showButton = true,
  href = '/video',
  image = '/images/home/home-video.png',
  imageMobile = ''
}: {
  eyebrow?: string
  showEyebrow?: boolean
  lineOne?: string
  lineTwo?: string
  showTitle?: boolean
  text?: string
  showText?: boolean
  buttonLabel?: string
  showButton?: boolean
  href?: string
  image?: string
  imageMobile?: string
}) => (
  <section className='vn-section vn-video-shop' aria-label='Shop via video call'>
    <Link href={href || '/video'} className='vn-video-shop-frame'>
      <div className='vn-video-shop-top' aria-hidden='true'>
        <span className='vn-video-shop-top-gem' />
        <span className='vn-video-shop-top-line' />
        <span className='vn-video-shop-top-gem' />
      </div>

      <div className='vn-video-shop-body'>
        <div className='vn-video-shop-copy'>
          {showEyebrow && eyebrow ? <p className='vn-video-shop-eyebrow'>{eyebrow}</p> : null}
          {showTitle ? (
            <h2>
              <span>{lineOne}</span>
              <span className='vn-video-shop-rule' aria-hidden='true' />
              <span>{lineTwo}</span>
            </h2>
          ) : null}
          {showText && text ? <p>{text}</p> : null}
          {showButton && buttonLabel ? <span className='vn-video-shop-cta'>{buttonLabel}</span> : null}
        </div>
        <div className='vn-video-shop-media'>
          <ResponsiveHomeImage image={image} imageMobile={imageMobile} alt='Personal video shopping consultation at Jagu’s Designing' size='banner' />
        </div>
      </div>
    </Link>
  </section>
)

export default HomeVideoBanner
