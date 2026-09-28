import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "About Us | Jagu's Designing",
  description: 'The Surat atelier behind Jagu’s Designing — handcrafted chaniya choli for Navratri, weddings and celebrations.'
}

const Page = () => (
  <InfoPage
    kicker='Our house'
    title='About Jagu’s Designing'
    intro='A Surat-born atelier of chaniya choli. We cut, embroider and finish each piece so the drape, the mirror work and the colour stay true from the first garba to the last phera.'
    blocks={[
      {
        title: 'Who we are',
        paragraphs: [
          'Jagu’s Designing began in Surat, Gujarat — a city that lives in textile. What started as a workshop for festive wear is now a house women trust for Navratri nights, wedding mandaps, engagements and family celebrations.',
          'We design for women who want tradition with a modern line. The silhouette is familiar. The embroidery, colour and fall are finished so the piece feels light on the floor and sure in a photograph.',
          'The factory and the main atelier sit in Mota Varachha, Surat. You can try a piece by video call, or visit the atelier after you write to us.',
        ]
      },
      {
        title: 'What we make',
        paragraphs: [
          'Our work is chaniya choli first: mirrored, thread-worked and ready for garba. Around that we also dress weddings, engagements and parties with coordinated sets, dupattas and pieces you can rent when you need a look for one night.',
          'Each garment is checked for stitch, lining, zip and embroidery before it leaves the table. Hand work will vary slightly from piece to piece. That is the craft, not a fault.'
        ],
        list: [
          'Navratri and garba edits, made to move',
          'Wedding and engagement sets with heavier work',
          'Ready-to-ship pieces and made-to-measure on request',
          'Rentals when you want a look for a fixed date'
        ]
      },
      {
        title: 'How we work with you',
        paragraphs: [
          'You can shop the site, write on WhatsApp, book a video call, or visit the Surat atelier. Share the occasion, the date and a sense of size. We reply with pieces, timelines and what is in stock.',
          'Orders placed on the website can be tracked, cancelled before dispatch, or returned within seven days of delivery if the fit or quality is not right. The same team that packed the box answers the request.'
        ]
      },
      {
        title: 'Craft, not a factory label',
        paragraphs: [
          'A chaniya choli from this house is cut in Surat and finished by the same bench that set the mirror and the thread. We do not buy a finished garment and put a tag on it.',
          'That is why two pieces in the same colour can sit a little differently. The fall, the weight of the work and the lining are checked by hand. If something is off, we remake the fault before it leaves.'
        ]
      },
      {
        title: 'One atelier',
        paragraphs: [
          'Surat, Mota Varachha, is where we cut, embroider, pack and meet you. WhatsApp, video shopping and the website are the same team.',
          'A message from the site, a visit and a call all sit on one bill so you are not repeating your size and date.'
        ]
      },
      {
        title: 'Visit and write',
        paragraphs: [
          'Surat atelier — Jagu’s Designing Collections, 93, Ambika Nagar Society, Mahadev Chowk, Mota Varachha, Surat, Gujarat 394101, India. Phone (+91) 8154 0000 63.',
          'Hours are Monday to Saturday, 11:00 AM to 8:00 PM. Sunday is by appointment for trials and pickups. For a busy Navratri week, write first so we hold the rail.'
        ]
      }
    ]}
    actions={
      <>
        <Link className='vn-btn vn-btn-solid' href='/collections/all'>
          Shop the collection
        </Link>
        <Link className='vn-btn vn-btn-outline' href='/contact'>
          Contact the atelier
        </Link>
      </>
    }
  />
)

export default Page
