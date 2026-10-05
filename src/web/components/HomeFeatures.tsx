const features = [
  {
    icon: 'tabler-truck',
    title: 'Free Shipping in India',
    text: 'Enjoy swift and secure delivery right to your doorstep — free of charge across India.'
  },
  {
    icon: 'tabler-phone',
    title: 'Customer Care Service',
    text: 'Our support team is always here to help — day or night. Queries, styling advice, or order assistance.'
  },
  {
    icon: 'tabler-shield-check',
    title: 'Safe & Secure Payment',
    text: 'Shop with confidence. Our platform is SSL-protected and supports trusted payment gateways.'
  },
  {
    icon: 'tabler-video',
    title: 'Live Shopping',
    text: 'Get personalized style advice in real time. Connect with our experts via live video.'
  },
  {
    icon: 'tabler-shirt',
    title: 'Stitching Service',
    text: 'From size customization to perfect tailoring, expert stitching so your outfit fits like a dream.'
  }
]

const HomeFeatures = ({ items = features }: { items?: { icon: string; title: string; text: string; showTitle?: boolean; showText?: boolean }[] }) => (
  <section className='vn-features' aria-label='Store services'>
    <div className='vn-features-frame'>
      {items.map(item => (
        <article key={item.title} className='vn-features-item'>
          <i className={item.icon} aria-hidden='true' />
          {item.showTitle !== false ? <h3>{item.title}</h3> : null}
          {item.showText !== false ? <p>{item.text}</p> : null}
        </article>
      ))}
    </div>
  </section>
)

export default HomeFeatures
