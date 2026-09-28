import Link from 'next/link'

import InfoPage from '@web/components/InfoPage'

export const metadata = {
  title: "Video Shopping | Jagu's Designing",
  description: 'Book a private video styling call to see Jagu’s Designing chaniya choli colour, embroidery and drape before you buy or rent.'
}

const Page = () => (
  <>
    <section className='vn-banner' style={{ marginTop: 48 }}>
      <img src='/images/home/home-video.png' alt='Personal video shopping with Jagu’s Designing' />
      <div className='vn-banner-copy'>
        <p className='vn-hero-kicker'>Bespoke service</p>
        <h1>Shop via video call</h1>
        <p>A private styling session. See the embroidery, the colour and the drape before you buy or rent.</p>
        <Link className='vn-btn vn-btn-ghost' href='/contact'>
          Book a call
        </Link>
      </div>
    </section>
    <InfoPage
      kicker='Video shopping'
      title='How a call works'
      intro='You stay at home. We hold the piece to the light, walk the mirror work, and help you choose a size. The same team later packs the order from Surat.'
      blocks={[
        {
          title: 'Who it is for',
          paragraphs: [
            'Video shopping helps when you cannot visit the Surat atelier, when you want to compare two cholis, or when a sister is choosing with you from another city.',
            'It is also useful before a rental. You see the exact piece we will hold for your dates.'
          ]
        },
        {
          title: 'What to send before we call',
          paragraphs: [
            'Write on Contact us or WhatsApp. Share the occasion, the date, a budget if you have one, and a recent blouse size or a photo of a fitted blouse.',
            'If you already liked a piece on the site, send the name or the link. We keep that rail ready so the call stays short.'
          ],
          list: [
            'Occasion and function date',
            'City and whether you need shipping or store pickup',
            'Size or measurements',
            'Two or three pieces you want to see first'
          ]
        },
        {
          title: 'During the call',
          paragraphs: [
            'We show front, back and close embroidery. We move the fabric so you see fall and weight. You can ask us to hold it next to a wall colour or a jewellery tone.',
            'If you decide on the call, we place the order or the rental the same way as the website. You still get an order number and can track it.'
          ]
        },
        {
          title: 'How we call',
          paragraphs: [
            'Most sessions are WhatsApp video. Zoom or Google Meet is fine if you ask. A typical call is 20–30 minutes. We do not record unless you ask us to keep a clip of a drape.',
            'Calls run Monday to Saturday during store hours, India time. Evening slots fill in Navratri week — write two or three day options.'
          ],
          list: [
            'Keep the phone or laptop charged and in good light',
            'One other person can join if you share the link',
            'We will not ask for OTP, card or UPI on the call',
            'If the line drops, we WhatsApp you back the same day'
          ]
        },
        {
          title: 'After the call',
          paragraphs: [
            'We send a short note of what you chose, the size and the timeline. Cancel and return rules are the same as any other order. A call does not lock you in until we confirm the bill.',
            'If you need a day to decide, we can hold a ready piece for a short window. Custom work still starts only after you confirm.'
          ]
        }
      ]}
      actions={
        <>
          <Link className='vn-btn vn-btn-solid' href='/contact'>
            Write to book
          </Link>
          <Link className='vn-btn vn-btn-outline' href='/collections/all'>
            Browse first
          </Link>
        </>
      }
    />
  </>
)

export default Page
