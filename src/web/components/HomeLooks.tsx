import Link from 'next/link'

const looks = [
  {
    title: 'Garba nights',
    text: 'Mirror work made to move',
    href: '/collections/festive',
    image: '/images/home/home-navratri.png'
  },
  {
    title: 'Bridal edit',
    text: 'Wine, gold and ceremony',
    href: '/collections/wedding',
    image: '/images/home/home-wedding.png'
  }
]

const HomeLooks = () => (
  <section className='vn-section vn-looks'>
    {looks.map(item => (
      <Link className='vn-look' key={item.title} href={item.href}>
        <img src={item.image} alt={item.title} />
        <div className='vn-look-copy'>
          <p>{item.text}</p>
          <h3>{item.title}</h3>
          <span>Explore</span>
        </div>
      </Link>
    ))}
  </section>
)

export default HomeLooks
