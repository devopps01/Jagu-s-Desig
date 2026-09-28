import CollectionPage from '@web/components/CollectionPage'
import { SectionHeader } from '@web/components/ProductGrid'
import Link from 'next/link'

const stylists = ['Sunita Shetty', 'Palak Bhagvati', 'Jhanvi Chauhan', 'Drashti Ghanva', 'Shivani Pandya', 'Sunitha Sharma']

const Page = () => (
  <>
    <section className='vn-section'>
      <SectionHeader title='Popup Shop' />
      <div className='vn-pills'>
        {stylists.map(name => (
          <Link className='vn-pill' key={name} href={`/popup-shop/${name.toLowerCase().replace(/ /g, '-')}`}>
            {name}
          </Link>
        ))}
      </div>
    </section>
    <CollectionPage slug='handpicked' title='Popup edits' />
  </>
)

export default Page
