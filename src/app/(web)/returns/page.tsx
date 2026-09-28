import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "Return & Exchange Policy | Jagu's Designing",
  description: 'Cancel before dispatch or return a Jagu’s Designing piece within 7 days of delivery.'
}

const Page = () => (
  <InfoPage
    kicker='Policy'
    title='Return & exchange'
    intro='Cancel while we still have the piece. Return within 7 days of delivery if the fit or quality is not right. Use the buttons on My orders or Track order so the request stays on your bill.'
    blocks={[
      {
        title: 'Cancel an order',
        paragraphs: [
          'You can cancel while the order is New, Confirmed or Packed. Open My account → Orders, or Track order with your order number and the phone used at checkout. Choose a reason and send the request.',
          'Once the order is Shipped, cancel is closed. Wait for delivery and use Return. The atelier reviews the request the same working day when we can.'
        ],
        list: [
          'COD cancels do not need a refund',
          'If you already paid online, we mark the order refunded after we approve',
          'A second cancel request is not needed if one is already open',
          'Custom work that has started cannot be cancelled unless we made an error'
        ]
      },
      {
        title: 'Return or exchange',
        paragraphs: [
          'Returns are open for 7 days after the piece is marked Delivered. Keep tags and packing till you decide. Photograph a quality or damage issue in good light and write it on the request.',
          'Our team reviews the request, then arranges a pickup or a drop at the Surat atelier. Quality faults are exchanged. Fit issues may be swapped or refunded after we see the piece.'
        ],
        list: [
          'Use Return for size, quality, damage, or if the piece is not as shown',
          'The piece should be unused, unwashed and unaltered',
          'We may refuse a return that smells of perfume, has stain, or is missing work you caused',
          'Refunds, when due, follow the same path as the original payment'
        ]
      },
      {
        title: 'What we cannot take back',
        paragraphs: [
          'Worn, washed or altered garments, except a proven quality fault from our side. Custom-made pieces once embroidery has started, unless we made an error. Rentals after the booking dates, unless the atelier agrees in writing.'
        ]
      },
      {
        title: 'Refunds and exchanges',
        paragraphs: [
          'When a cancel is approved on a paid order, we mark the payment refunded. The bank or wallet can take a few working days after that.',
          'An exchange is our first offer when the fault is quality or a wrong piece. A size swap depends on stock. If we cannot swap, we refund after the piece is back and checked.',
          'COD orders that never left the atelier do not need a refund. A COD return that we accept is refunded by the path we confirm with you on WhatsApp — usually UPI to the number on the bill.'
        ]
      },
      {
        title: 'How to start',
        paragraphs: [
          'Do not send a parcel back without a request. Use Cancel or Return on the order first so the atelier can approve a pickup or a drop at the Surat atelier.',
          'For photos or a store visit you can also write on Contact us or WhatsApp with the order number. A parcel that arrives without a request may be refused or delayed.'
        ]
      }
    ]}
    actions={
      <>
        <Link className='vn-btn vn-btn-solid' href='/track-order'>
          Track order
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/account?tab=orders'>
          My orders
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/shipping'>
          Shipping
        </Link>
      </>
    }
  />
)

export default Page
