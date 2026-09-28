import Link from 'next/link'

const HomeStory = () => (
  <section className='vn-section vn-story'>
    <img src='/images/home/home-craft.png' alt='Mirror work embroidery at the Jagu’s Designing atelier' />
    <div className='vn-story-copy'>
      <p className='vn-hero-kicker'>Our atelier</p>
      <h2>Craft you can feel in every fold</h2>
      <p>
        Jagu’s Designing is a Surat-born house of chaniya choli. Each piece is cut, embroidered and finished so the
        drape, the mirror work and the colour stay true from the first garba to the last phera.
      </p>
      <p>From Navratri nights to wedding mandaps, we design for women who want tradition with a modern line.</p>
      <Link className='vn-view-all' href='/about'>
        Know more about us
      </Link>
    </div>
  </section>
)

export default HomeStory
