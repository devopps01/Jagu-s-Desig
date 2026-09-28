import Link from 'next/link'

const HomeVideoBanner = () => (
  <section className='vn-section vn-video-shop' aria-label='Shop via video call'>
    <Link href='/video' className='vn-video-shop-frame'>
      <div className='vn-video-shop-top' aria-hidden='true'>
        <span className='vn-video-shop-top-gem' />
        <span className='vn-video-shop-top-line' />
        <span className='vn-video-shop-top-gem' />
      </div>

      <div className='vn-video-shop-body'>
        <div className='vn-video-shop-copy'>
          <p className='vn-video-shop-eyebrow'>Private atelier · Live styling</p>
          <h2>
            <span>Shop Via</span>
            <span className='vn-video-shop-rule' aria-hidden='true' />
            <span>Video Call</span>
          </h2>
          <p>Experience the luxury of our bespoke services for any occasion</p>
          <span className='vn-video-shop-cta'>Book a session</span>
        </div>
        <div className='vn-video-shop-media'>
          <img src='/images/home/home-video.png' alt='Personal video shopping consultation at Jagu’s Designing' />
        </div>
      </div>
    </Link>
  </section>
)

export default HomeVideoBanner
