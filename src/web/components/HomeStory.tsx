import Link from 'next/link'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'

const HomeStory = ({
  kicker = 'Our atelier',
  showKicker = true,
  title = 'Craft you can feel in every fold',
  showTitle = true,
  text = 'Jagu’s Designing is a Surat-born house of chaniya choli. Each piece is cut, embroidered and finished so the drape, the mirror work and the colour stay true from the first garba to the last phera.',
  showText = true,
  buttonLabel = 'Know more about us',
  showButton = true,
  href = '/about',
  image = '/images/home/home-craft.png',
  imageMobile = ''
}: {
  kicker?: string
  showKicker?: boolean
  title?: string
  showTitle?: boolean
  text?: string
  showText?: boolean
  buttonLabel?: string
  showButton?: boolean
  href?: string
  image?: string
  imageMobile?: string
}) => (
  <section className='vn-section vn-story'>
    <ResponsiveHomeImage image={image} imageMobile={imageMobile} alt='Mirror work embroidery at the Jagu’s Designing atelier' size='banner' />
    <div className='vn-story-copy'>
      {showKicker && kicker ? <p className='vn-hero-kicker'>{kicker}</p> : null}
      {showTitle && title ? <h2>{title}</h2> : null}
      {showText && text ? <p>{text}</p> : null}
      {showButton && buttonLabel ? (
        <Link className='vn-view-all' href={href || '/about'}>
          {buttonLabel}
        </Link>
      ) : null}
    </div>
  </section>
)

export default HomeStory
