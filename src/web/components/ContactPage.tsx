'use client'

import { useMemo, useState } from 'react'

import { storeTelHref, storeWhatsAppHref, type ContactSettings } from '@/libs/contact-types'

const subjects = [
  'Custom order',
  'Rental inquiry',
  'Store visit',
  'Styling help',
  'Quality issue',
  'Return & exchange',
  'Order support',
  'Wholesale',
  'Other'
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: subjects[0],
  message: '',
  website: ''
}

const helpCards = [
  { icon: 'tabler-brand-whatsapp', title: 'WhatsApp styling', copy: 'Share a photo or occasion. We reply with pieces, sizes and timelines.' },
  { icon: 'tabler-video', title: 'Video shopping', copy: 'Book a private call to see embroidery, colour and drape before you buy or rent.' },
  { icon: 'tabler-building-store', title: 'Store visit', copy: 'Visit the Surat atelier. Try a chaniya choli and leave with a confirmed fit.' },
  { icon: 'tabler-needle', title: 'Custom & rental', copy: 'Ask for a made-to-measure piece, a Navratri rental, or a sister referral offer.' }
]

const topics = [
  {
    icon: 'tabler-sparkles',
    title: 'Quality you can feel',
    points: [
      'Every chaniya choli is checked for stitch, lining, zip and embroidery before dispatch.',
      'Mirror, thread and sequin work is packed so it travels without crush.',
      'If a piece arrives damaged, we exchange it. Send photos on WhatsApp.',
      'Hand work varies slightly from piece to piece — that is the craft, not a fault.'
    ]
  },
  {
    icon: 'tabler-shield-lock',
    title: 'Secure shopping',
    points: [
      'Website login uses a one-time email OTP. We never ask for your password.',
      'Orders and addresses stay on your account. We do not sell customer data.',
      'Pay online or choose cash on delivery. Card details never pass through our staff chat.',
      'Write only on this form, WhatsApp or the listed phones so you reach the real atelier.'
    ]
  },
  {
    icon: 'tabler-headset',
    title: 'Support that stays with you',
    points: [
      'Most inquiries get a first reply the same working day.',
      'We help with size, colour matching, rental dates and store appointments.',
      'Dispatch is usually 2–4 working days after confirmation, with tracking on WhatsApp.',
      'Easy exchange if the fit or quality is not right. Keep tags and packing till you decide.'
    ]
  }
]

const faqs = [
  {
    q: 'How soon will someone reply?',
    a: 'On working days we aim to reply within a few hours on WhatsApp or email. After 8:00 PM or on Sunday, the first reply usually comes the next morning.'
  },
  {
    q: 'Can I visit without an appointment?',
    a: 'Yes during atelier hours. For a custom trial or a busy Navratri week, message us first so a stylist and the pieces you want are ready.'
  },
  {
    q: 'How do rentals work?',
    a: 'Tell us the occasion dates and your size. We hold the piece once the booking is confirmed, share pickup or courier details, and check the garment when it returns.'
  },
  {
    q: 'What if the embroidery or fit is not right?',
    a: 'Photograph the issue in good light and write to us. Quality faults are exchanged. For fit, we guide an alteration or a swap while tags and packing are still with you.'
  },
  {
    q: 'Is my payment and personal data safe?',
    a: 'Yes. Login is OTP-only, checkout uses trusted payment rails or COD, and we keep addresses for your orders only. We will never ask you to share an OTP with a caller.'
  },
  {
    q: 'Do you ship outside India?',
    a: 'Yes, worldwide shipping is available on request. Duties and extra transit time depend on the destination. We share a tracking link once the parcel leaves Surat.'
  },
  {
    q: 'Can you make a custom size or colour?',
    a: 'Yes. Send your measurements, a reference photo and the occasion date. We confirm fabric, embroidery and a timeline before work begins.'
  },
  {
    q: 'How do I track an order?',
    a: 'Use Track Order in the footer, or message us your order ID. We also send dispatch updates on WhatsApp when the courier is assigned.'
  }
]

const mapSrc = (query: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=en&output=embed`

const directionsHref = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const ContactPage = ({ settings }: { settings: ContactSettings }) => {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [place, setPlace] = useState<'surat' | 'bangalore'>('surat')
  const [openFaq, setOpenFaq] = useState(0)

  const whatsappHref = useMemo(
    () => storeWhatsAppHref('Hello Jagu’s Designing, I would like to enquire.', settings.whatsapp),
    [settings.whatsapp]
  )
  const phoneHref = storeTelHref(settings.phone)
  const mailHref = settings.email ? `mailto:${settings.email}` : ''
  const hasBangalore = Boolean(settings.bangaloreAddress)
  const suratQuery = settings.suratMapQuery || settings.suratAddress
  const bangaloreQuery = settings.bangaloreMapQuery || settings.bangaloreAddress
  const activePlace = hasBangalore && place === 'bangalore' ? 'bangalore' : 'surat'
  const activeQuery = activePlace === 'bangalore' ? bangaloreQuery : suratQuery
  const activeTitle = activePlace === 'bangalore' ? settings.bangaloreTitle : settings.suratTitle
  const activeAddress = activePlace === 'bangalore' ? settings.bangaloreAddress : settings.suratAddress

  const submit = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/web/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.message || 'Could not send message')

      return
    }

    setDone(true)
    setForm(emptyForm)
  }

  return (
    <section className='vn-section vn-contact'>
      <div className='vn-page-hero'>
        <p className='vn-hero-kicker'>Contact & support</p>
        <h1>{settings.headline}</h1>
        <div className='vn-rule' />
        <p>{settings.intro}</p>
      </div>

      <div className='vn-contact-block vn-contact-block-top'>
        <div className='vn-section-head'>
          <p className='vn-section-note'>How we help</p>
          <h2>Proper support, from first message to dispatch</h2>
        </div>
        <div className='vn-contact-help'>
          {helpCards.map(card => (
            <article key={card.title}>
              <i className={card.icon} />
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div className='vn-contact-block'>
        <div className='vn-section-head'>
          <p className='vn-section-note'>Quality · Security · Care</p>
          <h2>What you can expect from Jagu’s Designing</h2>
        </div>
        <div className='vn-contact-topics'>
          {topics.map(topic => (
            <article key={topic.title}>
              <h3>
                <i className={topic.icon} />
                {topic.title}
              </h3>
              <ul>
                {topic.points.map(point => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>

      <div className='vn-contact-grid'>
        <aside className='vn-contact-aside'>
          <article className='vn-contact-card'>
            <i className='tabler-building-store' />
            <div>
              <h3>{settings.suratTitle}</h3>
              <p>{settings.suratAddress}</p>
              {settings.phone ? <a href={phoneHref}>{settings.phone}</a> : null}
              {settings.whatsapp ? (
                <a href={whatsappHref} target='_blank' rel='noreferrer'>
                  WhatsApp {settings.phone}
                </a>
              ) : null}
            </div>
          </article>
          {hasBangalore ? (
            <article className='vn-contact-card'>
              <i className='tabler-map-pin' />
              <div>
                <h3>{settings.bangaloreTitle}</h3>
                <p>{settings.bangaloreAddress}</p>
                {settings.bangalorePhone ? <a href={`tel:${settings.bangalorePhone.replace(/[^\d+]/g, '')}`}>{settings.bangalorePhone}</a> : null}
              </div>
            </article>
          ) : null}
          <article className='vn-contact-card'>
            <i className='tabler-clock' />
            <div>
              <h3>Atelier hours</h3>
              <p>{settings.hours}</p>
              <p>Sunday by appointment for trials and pickups.</p>
            </div>
          </article>
          <article className='vn-contact-card'>
            <i className='tabler-message-2' />
            <div>
              <h3>How we reply</h3>
              <p>WhatsApp and this form are checked through the day. Share your occasion date, city and size so we can help in one reply.</p>
            </div>
          </article>
          <div className='vn-contact-actions'>
            {whatsappHref ? (
              <a className='vn-btn vn-btn-solid' href={whatsappHref} target='_blank' rel='noreferrer'>
                WhatsApp the atelier
              </a>
            ) : null}
            {mailHref ? (
              <a className='vn-btn vn-btn-outline' href={mailHref}>
                Email us
              </a>
            ) : null}
            <a className='vn-btn vn-btn-outline' href='/video'>
              Video shopping
            </a>
          </div>
        </aside>

        <div className='vn-contact-panel'>
          <p className='vn-hero-kicker'>Write to us</p>
          <h2 className='vn-contact-panel-title'>Tell us what you need</h2>
          {done ? (
            <div className='vn-contact-ok'>
              <i className='tabler-checks' />
              <h3>Message received</h3>
              <p>Thank you. Our team will reply on email or WhatsApp shortly.</p>
              <button className='vn-btn vn-btn-outline' type='button' onClick={() => setDone(false)}>
                Send another message
              </button>
            </div>
          ) : (
            <form
              className='vn-form vn-contact-form'
              onSubmit={event => {
                event.preventDefault()
                void submit()
              }}
            >
              <div className='vn-field-row'>
                <label className='vn-field'>
                  <span>Your name</span>
                  <input
                    placeholder='Full name'
                    required
                    value={form.name}
                    onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
                  />
                </label>
                <label className='vn-field'>
                  <span>Email</span>
                  <input
                    type='email'
                    placeholder='name@email.com'
                    required
                    value={form.email}
                    onChange={event => setForm(current => ({ ...current, email: event.target.value }))}
                  />
                </label>
              </div>
              <div className='vn-field-row'>
                <label className='vn-field'>
                  <span>Phone</span>
                  <input
                    placeholder='Optional'
                    value={form.phone}
                    onChange={event => setForm(current => ({ ...current, phone: event.target.value }))}
                  />
                </label>
                <label className='vn-field'>
                  <span>Topic</span>
                  <select
                    value={form.subject}
                    onChange={event => setForm(current => ({ ...current, subject: event.target.value }))}
                  >
                    {subjects.map(item => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className='vn-field'>
                <span>Message</span>
                <textarea
                  rows={6}
                  placeholder='Occasion, dates, city, size or the help you need'
                  required
                  value={form.message}
                  onChange={event => setForm(current => ({ ...current, message: event.target.value }))}
                />
              </label>
              <input
                className='vn-hp'
                tabIndex={-1}
                autoComplete='off'
                value={form.website}
                onChange={event => setForm(current => ({ ...current, website: event.target.value }))}
              />
              {error ? <p className='vn-contact-error'>{error}</p> : null}
              <button className='vn-btn vn-btn-solid' type='submit' disabled={loading}>
                {loading ? 'Sending…' : 'Send message'}
              </button>
              <p className='vn-contact-note'>We never share this form with anyone outside the atelier.</p>
            </form>
          )}
        </div>
      </div>

      <div className='vn-contact-block'>
        <div className='vn-section-head'>
          <p className='vn-section-note'>Visit us</p>
          <h2>Live map & directions</h2>
        </div>
        {hasBangalore ? (
          <div className='vn-contact-map-tabs' role='tablist' aria-label='Store locations'>
            <button type='button' className={activePlace === 'surat' ? 'is-on' : ''} onClick={() => setPlace('surat')}>
              {settings.suratTitle}
            </button>
            <button type='button' className={activePlace === 'bangalore' ? 'is-on' : ''} onClick={() => setPlace('bangalore')}>
              {settings.bangaloreTitle}
            </button>
          </div>
        ) : null}
        <div className='vn-contact-map'>
          <iframe
            title={`${activeTitle} live map`}
            src={mapSrc(activeQuery)}
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            allowFullScreen
          />
          <div className='vn-contact-map-card'>
            <h3>{activeTitle}</h3>
            <p>{activeAddress}</p>
            <p>{settings.hours}</p>
            <a className='vn-btn vn-btn-solid' href={directionsHref(activeQuery)} target='_blank' rel='noreferrer'>
              Open in Google Maps
            </a>
          </div>
        </div>
      </div>

      <div className='vn-contact-block vn-contact-faq-wrap'>
        <div className='vn-section-head'>
          <p className='vn-section-note'>Questions</p>
          <h2>Before you write</h2>
        </div>
        <div className='vn-contact-faq'>
          {faqs.map((item, index) => {
            const open = openFaq === index

            return (
              <article key={item.q} className={open ? 'is-open' : ''}>
                <button type='button' aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : index)}>
                  <span>{item.q}</span>
                  <i className={open ? 'tabler-minus' : 'tabler-plus'} />
                </button>
                {open ? <p>{item.a}</p> : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ContactPage
