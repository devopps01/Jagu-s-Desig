import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "Terms and Conditions | Jagu's Designing",
  description: 'Terms for shopping, renting and visiting Jagu’s Designing online and in store.'
}

const Page = () => (
  <InfoPage
    kicker='Policy'
    title='Terms and conditions'
    intro='These terms cover the website, WhatsApp orders, store visits and rentals. By placing an order you agree to them.'
    blocks={[
      {
        title: 'The atelier and the site',
        paragraphs: [
          'Jagu’s Designing Collections, 93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101, India, is the seller of the pieces shown on this website. Prices, stock and embroidery can change as a piece is finished. What you see on a product page is a guide. Hand work will not be identical on every choli.',
          'We may refuse or cancel an order if stock is gone, the address cannot be served, or the request looks unsafe or fraudulent. If we cancel after you have paid, we mark the payment refunded.'
        ]
      },
      {
        title: 'Orders and payment',
        paragraphs: [
          'Checkout on the site is cash on delivery unless we have agreed another method with you. The total you see at checkout is the amount due on delivery, after discounts and sister offers.',
          'A placed order is a request. It becomes firm when we confirm it. You can ask to cancel while the order is New, Confirmed or Packed. After it is Shipped, use the return path once it is delivered.'
        ],
        list: [
          'You must give a reachable phone number',
          'The delivery name should match the person who will receive the parcel',
          'Wrong pin code or a refused COD parcel may be charged on a new send',
          'Referral and coupon codes cannot be added after the order is packed'
        ]
      },
      {
        title: 'Product, size and custom work',
        paragraphs: [
          'Size charts are a guide. Fabric, lining and embroidery change how a piece sits. If you are between sizes, write to us before you order.',
          'Custom colour or measurements start only after we confirm them. Once embroidery has begun, a custom piece cannot be cancelled unless we made an error. We will say so in writing.'
        ]
      },
      {
        title: 'Rentals',
        paragraphs: [
          'A rental holds a piece for your dates once the booking is confirmed. You must return it in the same condition, on time, with tags and packing if we asked for them. Late returns, stains or missing work may be charged.',
          'Rental dates are not a sale. You do not own the piece. Damage beyond normal wear is billed after we inspect it.'
        ]
      },
      {
        title: 'Store visits and photographs',
        paragraphs: [
          'A visit to the Surat atelier does not reserve a piece until we confirm it on the bill. Trying a garment does not transfer ownership.',
          'You may photograph a piece you are considering. Do not film the full rail or staff without asking. Product images on the site remain ours even if you screenshot them.'
        ]
      },
      {
        title: 'Website use',
        paragraphs: [
          'Login uses a one-time email OTP. Do not share that OTP with anyone, including a caller who claims to be from the atelier.',
          'Images, text and product names on this site belong to Jagu’s Designing. Do not copy them for another shop. We may update these terms. The version on this page is the one that applies.'
        ]
      },
      {
        title: 'If something goes wrong',
        paragraphs: [
          'Our duty is to send the piece we confirmed, packed as described, to the address you gave. We are not responsible for a function date missed because a courier delayed after the parcel left Surat, or because measurements sent to us were incomplete.',
          'These terms are governed by the laws of India. Disputes are heard in Surat, Gujarat, unless a consumer law says otherwise.'
        ]
      }
    ]}
    actions={
      <>
        <Link className='vn-btn vn-btn-solid' href='/returns'>
          Cancel & return
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/privacy'>
          Privacy
        </Link>
      </>
    }
  />
)

export default Page
