export type NewsletterSettings = {
  enabled: boolean
  headline: string
  subtext: string
  placeholder: string
  buttonLabel: string
  buttonColor: string
  backgroundImage: string
  successMessage: string
}

export const defaultNewsletterSettings: NewsletterSettings = {
  enabled: true,
  headline: 'Subscribe to our Newsletter',
  subtext: 'Promotions, new products and sales. Directly to your inbox.',
  placeholder: 'Enter Your Email',
  buttonLabel: 'Subscribe',
  buttonColor: '#d82460',
  backgroundImage: '/images/home/home-wedding.png',
  successMessage: 'Thank you for subscribing.'
}

export type NewsletterSubscriber = {
  id: string
  email: string
  source: string
  createdAt: string | Date
}
