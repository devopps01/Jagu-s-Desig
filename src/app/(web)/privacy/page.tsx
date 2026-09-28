import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "Privacy Policy | Jagu's Designing",
  description: 'How Jagu’s Designing collects, uses and protects your account, orders and messages.'
}

const Page = () => (
  <InfoPage
    kicker='Policy'
    title='Privacy policy'
    intro='We keep only what we need to take your order, reply to you and improve the atelier. We do not sell customer lists.'
    blocks={[
      {
        title: 'What we collect',
        paragraphs: [
          'When you log in we store your email and a signed session cookie. When you order we store the name, phone and address you typed, the pieces, the total and how you paid.',
          'Contact forms, cancel and return requests, reviews and wishlists stay on your account so we can answer and show you the same data later.'
        ],
        list: [
          'Email for OTP login and order mail',
          'Phone and address for delivery and WhatsApp updates',
          'Order, rental and request history',
          'Device basics such as browser type when you use the site'
        ]
      },
      {
        title: 'How we use it',
        paragraphs: [
          'We use your details to confirm orders, send OTPs, share tracking, handle cancel and return requests, and reply on WhatsApp or email. We may use a first name and city in an internal note so the stylist knows who they are helping.',
          'We do not sell your email or phone to other shops. Couriers and payment partners see only what they need to deliver or collect.'
        ]
      },
      {
        title: 'Login and cards',
        paragraphs: [
          'Website login is OTP-only. We never ask for a password. Do not share the code with a caller.',
          'If you pay online through a gateway, card numbers stay with that gateway. Our staff chat and WhatsApp should never ask for a full card number or OTP.'
        ]
      },
      {
        title: 'How long we keep it',
        paragraphs: [
          'Orders and invoices are kept so we can support returns, rentals and any tax need. You can ask us to close an account. We will remove login access and stop marketing messages. We may keep a bill record where the law asks us to.'
        ]
      },
      {
        title: 'WhatsApp, cookies and partners',
        paragraphs: [
          'If you write on WhatsApp we keep that thread so the stylist can see size, date and the last pieces you liked. You can ask us to stop marketing messages. Order updates may still go out until the bill is closed.',
          'The site uses a session cookie to keep you logged in and a few first-party cookies to remember the cart. We do not run a marketplace of third-party ads on these pages.',
          'Couriers, map embeds and an email OTP provider see only what they need. They are not given your full order history.'
        ]
      },
      {
        title: 'Your choices',
        paragraphs: [
          'You can update a future address at checkout. You can ask to see or correct the email and phone on your account by writing to Jagu’s Designing Collections, 93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101, India, or through Contact us. You can ask us to delete a review or a contact message that is still open.',
          'If you think a message from us is not genuine, do not click a payment link. Open the site yourself or call the numbers on the Contact page. We will never ask for your OTP, full card number or UPI PIN.'
        ]
      }
    ]}
    actions={
      <>
        <Link className='vn-btn vn-btn-solid' href='/contact'>
          Contact us
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/terms'>
          Terms
        </Link>
      </>
    }
  />
)

export default Page
