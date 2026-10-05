'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  paragraphsToList,
  storeTelHref,
  storeWhatsAppHref,
  type ContactSettings
} from '@/libs/contact-types'

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  website: ''
}

const mapSrc = (query: string) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=15&hl=en&output=embed`

const directionsHref = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

const ContactPage = ({ settings: initialSettings }: { settings: ContactSettings }) => {
  const [settings, setSettings] = useState(initialSettings)
  const subjects = useMemo(() => paragraphsToList(settings.subjects), [settings.subjects])
  const [form, setForm] = useState({ ...emptyForm, subject: subjects[0] || 'Other' })
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [place, setPlace] = useState<'surat' | 'bangalore'>('surat')
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    setSettings(initialSettings)
  }, [initialSettings])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'jagu-contact-draft' && event.data.settings) {
        setSettings(event.data.settings)
      }
      if (event.data?.type === 'jagu-contact-ready-ping') {
        window.parent.postMessage({ type: 'jagu-contact-ready' }, window.location.origin)
      }
      if (event.data?.type === 'jagu-contact-scroll' && event.data.id) {
        const target = document.getElementById(`contact-${event.data.id}`)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    window.addEventListener('message', onMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'jagu-contact-ready' }, window.location.origin)
    }

    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!subjects.length) return
    setForm(current => (subjects.includes(current.subject) ? current : { ...current, subject: subjects[0] }))
  }, [subjects])

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

  const helpCards = settings.helpCards.filter(card => card.enabled !== false)
  const topics = settings.topics.filter(topic => topic.enabled !== false)
  const faqs = settings.faqs.filter(faq => faq.enabled !== false)

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
    setForm({ ...emptyForm, subject: subjects[0] || 'Other' })
  }

  return (
    <section className='vn-section vn-contact'>
      <div id='contact-copy' className='vn-page-hero'>
        {settings.kicker ? <p className='vn-hero-kicker'>{settings.kicker}</p> : null}
        <h1>{settings.headline}</h1>
        <div className='vn-rule' />
        {settings.intro ? <p>{settings.intro}</p> : null}
      </div>

      <div id='contact-help' className='vn-contact-block vn-contact-block-top'>
        <div className='vn-section-head'>
          {settings.helpNote ? <p className='vn-section-note'>{settings.helpNote}</p> : null}
          {settings.helpTitle ? <h2>{settings.helpTitle}</h2> : null}
        </div>
        <div className='vn-contact-help'>
          {helpCards.map(card => (
            <article key={card.id}>
              <i className={card.icon} />
              <h3>{card.title}</h3>
              <p>{card.copy}</p>
            </article>
          ))}
        </div>
      </div>

      <div id='contact-topics' className='vn-contact-block'>
        <div className='vn-section-head'>
          {settings.topicsNote ? <p className='vn-section-note'>{settings.topicsNote}</p> : null}
          {settings.topicsTitle ? <h2>{settings.topicsTitle}</h2> : null}
        </div>
        <div className='vn-contact-topics'>
          {topics.map(topic => {
            const points = paragraphsToList(topic.points)

            return (
              <article key={topic.id}>
                <h3>
                  <i className={topic.icon} />
                  {topic.title}
                </h3>
                {points.length ? (
                  <ul>
                    {points.map(point => (
                      <li key={point}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })}
        </div>
      </div>

      <div className='vn-contact-grid'>
        <aside id='contact-reach' className='vn-contact-aside'>
          <article id='contact-surat' className='vn-contact-card'>
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
            <article id='contact-bangalore' className='vn-contact-card'>
              <i className='tabler-map-pin' />
              <div>
                <h3>{settings.bangaloreTitle}</h3>
                <p>{settings.bangaloreAddress}</p>
                {settings.bangalorePhone ? <a href={`tel:${settings.bangalorePhone.replace(/[^\d+]/g, '')}`}>{settings.bangalorePhone}</a> : null}
              </div>
            </article>
          ) : (
            <div id='contact-bangalore' hidden aria-hidden />
          )}
          <article className='vn-contact-card'>
            <i className='tabler-clock' />
            <div>
              <h3>{settings.hoursTitle}</h3>
              <p>{settings.hours}</p>
              {settings.hoursNote ? <p>{settings.hoursNote}</p> : null}
            </div>
          </article>
          <article className='vn-contact-card'>
            <i className='tabler-message-2' />
            <div>
              <h3>{settings.replyTitle}</h3>
              <p>{settings.replyText}</p>
            </div>
          </article>
          <div className='vn-contact-actions'>
            {whatsappHref && settings.whatsappButtonLabel ? (
              <a className='vn-btn vn-btn-solid' href={whatsappHref} target='_blank' rel='noreferrer'>
                {settings.whatsappButtonLabel}
              </a>
            ) : null}
            {mailHref && settings.emailButtonLabel ? (
              <a className='vn-btn vn-btn-outline' href={mailHref}>
                {settings.emailButtonLabel}
              </a>
            ) : null}
            {settings.videoButtonLabel ? (
              <a className='vn-btn vn-btn-outline' href={settings.videoButtonHref || '/video'}>
                {settings.videoButtonLabel}
              </a>
            ) : null}
          </div>
        </aside>

        <div id='contact-form' className='vn-contact-panel'>
          {settings.formKicker ? <p className='vn-hero-kicker'>{settings.formKicker}</p> : null}
          <h2 className='vn-contact-panel-title'>{settings.formTitle}</h2>
          {done ? (
            <div className='vn-contact-ok'>
              <i className='tabler-checks' />
              <h3>{settings.formSuccessTitle}</h3>
              <p>{settings.formSuccessText}</p>
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
                  <select value={form.subject} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))}>
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
                {loading ? 'Sending…' : settings.formSubmitLabel}
              </button>
              {settings.formNote ? <p className='vn-contact-note'>{settings.formNote}</p> : null}
            </form>
          )}
        </div>
      </div>

      <div id='contact-map' className='vn-contact-block'>
        <div className='vn-section-head'>
          {settings.mapNote ? <p className='vn-section-note'>{settings.mapNote}</p> : null}
          {settings.mapTitle ? <h2>{settings.mapTitle}</h2> : null}
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

      <div id='contact-faq' className='vn-contact-block vn-contact-faq-wrap'>
        <div className='vn-section-head'>
          {settings.faqNote ? <p className='vn-section-note'>{settings.faqNote}</p> : null}
          {settings.faqTitle ? <h2>{settings.faqTitle}</h2> : null}
        </div>
        <div className='vn-contact-faq'>
          {faqs.map((item, index) => {
            const open = openFaq === index

            return (
              <article key={item.id} className={open ? 'is-open' : ''}>
                <button type='button' aria-expanded={open} onClick={() => setOpenFaq(open ? -1 : index)}>
                  <span>{item.question}</span>
                  <i className={open ? 'tabler-minus' : 'tabler-plus'} />
                </button>
                {open ? <p>{item.answer}</p> : null}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default ContactPage
