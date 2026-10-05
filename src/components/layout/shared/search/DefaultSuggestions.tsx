// Next Imports
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Locale } from '@configs/i18n'

// Util Imports
import { getLocalizedUrl } from '@/utils/i18n'

type DefaultSuggestionsType = {
  sectionLabel: string
  items: {
    label: string
    href: string
    icon?: string
  }[]
}

const defaultSuggestions: DefaultSuggestionsType[] = [
  {
    sectionLabel: 'Catalog',
    items: [
      { label: 'Products', href: '/store/products', icon: 'tabler-shirt' },
      { label: 'Categories', href: '/store/categories', icon: 'tabler-category' },
      { label: 'Image Upload', href: '/store/media', icon: 'tabler-photo' },
      { label: 'Collection Filters', href: '/store/filters', icon: 'tabler-filter' }
    ]
  },
  {
    sectionLabel: 'Orders & offers',
    items: [
      { label: 'Orders & billing', href: '/store/orders', icon: 'tabler-file-invoice' },
      { label: 'Rent bookings', href: '/store/rentals', icon: 'tabler-calendar' },
      { label: 'Discounts', href: '/store/discounts', icon: 'tabler-discount' },
      { label: 'Payment methods', href: '/store/payments', icon: 'tabler-credit-card' }
    ]
  },
  {
    sectionLabel: 'Website',
    items: [
      { label: 'Website editor', href: '/store/home-page', icon: 'tabler-world' },
      { label: 'Contact inquiries', href: '/store/contact', icon: 'tabler-mail' },
      { label: 'Reviews & ratings', href: '/store/reviews', icon: 'tabler-star' },
      { label: 'Google reviews', href: '/store/google-reviews', icon: 'tabler-brand-google' }
    ]
  },
  {
    sectionLabel: 'Customers',
    items: [
      { label: 'Website Users', href: '/store/users', icon: 'tabler-users' },
      { label: 'Wishlists', href: '/store/wishlists', icon: 'tabler-heart' },
      { label: 'Newsletter subscribers', href: '/store/newsletter-subscribers', icon: 'tabler-mail-opened' },
      { label: 'Push campaigns', href: '/store/push-campaigns', icon: 'tabler-bell' }
    ]
  }
]

const DefaultSuggestions = ({ setOpen }: { setOpen: (value: boolean) => void }) => {
  const { lang: locale } = useParams()

  return (
    <div className='flex grow flex-wrap gap-x-[48px] gap-y-8 plb-14 pli-16 overflow-y-auto overflow-x-hidden bs-full'>
      {defaultSuggestions.map((section, index) => (
        <div
          key={index}
          className='flex flex-col justify-center overflow-x-hidden gap-4 basis-full sm:basis-[calc((100%-3rem)/2)]'
        >
          <p className='text-xs leading-[1.16667] uppercase text-textDisabled tracking-[0.8px]'>
            {section.sectionLabel}
          </p>
          <ul className='flex flex-col gap-4'>
            {section.items.map((item, i) => (
              <li key={i} className='flex'>
                <Link
                  href={getLocalizedUrl(item.href, locale as Locale)}
                  className='flex items-center overflow-x-hidden cursor-pointer gap-2 hover:text-primary focus-visible:text-primary focus-visible:outline-0'
                  onClick={() => setOpen(false)}
                >
                  {item.icon && <i className={classnames(item.icon, 'flex text-xl shrink-0')} />}
                  <p className='text-[15px] leading-[1.4667] truncate'>{item.label}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export default DefaultSuggestions
