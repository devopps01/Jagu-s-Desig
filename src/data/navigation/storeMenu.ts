/** Real Jagu’s Designing admin routes — only pages with working /api/admin APIs. */
export type StoreMenuLink = {
  label: string
  href: string
  icon?: string
}

export type StoreMenuGroup = {
  label: string
  icon: string
  href?: string
  items: StoreMenuLink[]
}

export const STORE_MENU_GROUPS: StoreMenuGroup[] = [
  {
    label: 'Dashboard',
    icon: 'tabler-layout-dashboard',
    href: '/store/dashboard',
    items: [{ label: 'Main dashboard', href: '/store/dashboard' }]
  },
  {
    label: 'Rent',
    icon: 'tabler-calendar-check',
    items: [
      { label: 'Dashboard', href: '/store/rentals/dashboard' },
      { label: 'Availability', href: '/store/rentals/availability' },
      { label: 'Book rent', href: '/store/rentals/book' },
      { label: 'Rent store', href: '/store/rentals' },
      { label: 'Dress care', href: '/store/rentals/dress-care' },
      { label: 'Rent customers', href: '/store/rentals/customers' },
      { label: 'Rent inventory', href: '/store/inventory/rent' }
    ]
  },
  {
    label: 'Selling',
    icon: 'tabler-shopping-bag',
    items: [
      { label: 'Dashboard', href: '/store/sales/dashboard' },
      { label: 'Sell outfit', href: '/store/sales/book' },
      { label: 'Sale store', href: '/store/sales' },
      { label: 'Sale customers', href: '/store/sales/customers' },
      { label: 'Selling inventory', href: '/store/inventory/selling' }
    ]
  },
  {
    label: 'Customers',
    icon: 'tabler-users',
    items: [
      { label: 'Website Users', href: '/store/users' },
      { label: 'OTP Logs', href: '/store/otp-logs' },
      { label: 'Wishlists', href: '/store/wishlists' }
    ]
  },
  {
    label: 'Catalog',
    icon: 'tabler-shirt',
    items: [
      { label: 'Products', href: '/store/products' },
      { label: 'Categories', href: '/store/categories' },
      { label: 'Styles', href: '/store/styles' },
      { label: 'Collection Filters', href: '/store/filters' },
      { label: 'Image Upload', href: '/store/media' }
    ]
  },
  {
    label: 'Orders',
    icon: 'tabler-file-invoice',
    items: [
      { label: 'Orders & billing', href: '/store/orders' },
      { label: 'Cancel & returns', href: '/store/order-requests' }
    ]
  },
  {
    label: 'Offers',
    icon: 'tabler-discount',
    items: [
      { label: 'Discounts', href: '/store/discounts' },
      { label: 'Payment methods', href: '/store/payments' },
      { label: 'GST settings', href: '/store/gst' }
    ]
  },
  {
    label: 'Push',
    icon: 'tabler-bell',
    items: [
      { label: 'FCM tokens', href: '/store/device-tokens' },
      { label: 'Push campaigns', href: '/store/push-campaigns' }
    ]
  },
  {
    label: 'Reviews',
    icon: 'tabler-star',
    items: [
      { label: 'Reviews & ratings', href: '/store/reviews' },
      { label: 'Google reviews', href: '/store/google-reviews' }
    ]
  },
  {
    label: 'Website',
    icon: 'tabler-world',
    items: [
      { label: 'Website editor', href: '/store/home-page' },
      { label: 'Blog', href: '/store/blog' },
      { label: 'Contact page', href: '/store/contact-page' },
      { label: 'Contact inquiries', href: '/store/contact' },
      { label: 'Newsletter banner', href: '/store/newsletter' },
      { label: 'Newsletter subscribers', href: '/store/newsletter-subscribers' }
    ]
  }
]

export const STORE_SEARCH_ENTRIES = STORE_MENU_GROUPS.flatMap((group, groupIndex) =>
  group.items.map((item, itemIndex) => ({
    id: `store-${groupIndex + 1}-${itemIndex + 1}`,
    name: item.label,
    url: item.href,
    icon: group.icon,
    section: group.label
  }))
)

export const STORE_HOME_PATH = '/store/dashboard'
