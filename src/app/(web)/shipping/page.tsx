import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "Shipping Policy | Jagu's Designing",
  description: 'How Jagu’s Designing packs, ships and delivers chaniya choli across India and abroad.'
}

const Page = () => (
  <InfoPage
    kicker='Policy'
    title='Shipping policy'
    intro='Every order leaves the Surat atelier packed for embroidery and drape. We share tracking on WhatsApp once the courier is assigned.'
    blocks={[
      {
        title: 'Where we ship',
        paragraphs: [
          'We ship across India on every order. Cash on delivery is available at checkout for most Indian pin codes.',
          'Worldwide shipping is available on request. Write the destination city on the contact form or WhatsApp before you pay. Duties, taxes and extra transit time depend on the country and are paid by the receiver unless we agree otherwise in writing.'
        ]
      },
      {
        title: 'When we dispatch',
        paragraphs: [
          'Ready pieces usually leave in 2–4 working days after we confirm the order, size and address. Festival weeks and custom embroidery can take longer. We tell you the date before we pack.',
          'Custom or made-to-measure work starts after we confirm measurements and the occasion date. The dispatch window is shared on WhatsApp so you can plan the function.'
        ],
        list: [
          'Working days are Monday to Saturday',
          'Sunday orders are confirmed the next morning',
          'We do not dispatch until the address and phone are clear',
          'A store pickup in Surat can replace courier if you ask'
        ]
      },
      {
        title: 'Packing and care in transit',
        paragraphs: [
          'Mirror, thread and sequin work is folded and cushioned so it does not crush. Keep the box and tags until you are sure of the fit. If a piece arrives damaged, photograph it in good light and open a return from My orders or Track order.'
        ]
      },
      {
        title: 'Charges and delays',
        paragraphs: [
          'Indian website orders currently ship at no extra line on the bill. Remote pin codes, very heavy pieces or international parcels may need a surcharge. We confirm that before dispatch.',
          'Couriers can be delayed by weather, strikes or local holidays. We follow up with the service and keep you updated. A delay by the courier is not an automatic cancel once the parcel has left Surat.'
        ]
      },
      {
        title: 'Cash on delivery and pickup',
        paragraphs: [
          'Most Indian pin codes can pay on delivery. Keep the exact amount ready. If a COD parcel is refused without a cancel request, a second send may carry a courier charge.',
          'You can ask for pickup in Surat instead of a courier. We mark the order for store collection and message you when it is on the rail. Bring the order number and the phone used at checkout.'
        ]
      },
      {
        title: 'Festival weeks',
        paragraphs: [
          'Navratri, wedding season and the week before a long weekend fill both the atelier and the couriers. Order early. We close new custom work when the date can no longer be met, rather than promise a box that will miss the function.',
          'If your date is close, write the function day on the order note or WhatsApp. We will say yes only when dispatch is realistic.'
        ]
      },
      {
        title: 'Track your parcel',
        paragraphs: [
          'Use Track order with your order number and the phone or email used at checkout. We also send the courier link on WhatsApp when it is ready.',
          'Statuses move from New to Confirmed, Packed, Shipped and Delivered. If the status is still Packed after the promised day, write to us with the order number. Do not refuse a parcel for a small delay without speaking to the atelier first.'
        ]
      }
    ]}
    actions={
      <>
        <Link className='vn-btn vn-btn-solid' href='/track-order'>
          Track order
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/returns'>
          Returns
        </Link>
      </>
    }
  />
)

export default Page
