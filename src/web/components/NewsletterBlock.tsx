'use client'

import { useEffect, useState, type FormEvent } from 'react'

import { defaultNewsletterSettings, type NewsletterSettings } from '@/libs/newsletter-types'

const NewsletterBlock = () => {
  const [settings, setSettings] = useState<NewsletterSettings>(defaultNewsletterSettings)
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/web/newsletter')
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (json) setSettings({ ...defaultNewsletterSettings, ...json })
      })
      .catch(() => null)
  }, [])

  if (!settings.enabled) return null

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/web/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website, source: 'home' })
      })
      const json = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(json.message || 'Could not subscribe')

        return
      }

      setStatus('ok')
      setMessage(json.message || settings.successMessage)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Could not subscribe. Please try again.')
    }
  }

  return (
    <section className='vn-newsletter' aria-label='Newsletter signup'>
      <div
        className='vn-newsletter-banner'
        style={{ backgroundImage: `url(${settings.backgroundImage || defaultNewsletterSettings.backgroundImage})` }}
      >
        <div className='vn-newsletter-card'>
          <h2>{settings.headline}</h2>
          <p className='vn-newsletter-sub'>{settings.subtext}</p>
          <form className='vn-newsletter-form' onSubmit={event => void onSubmit(event)}>
            <input
              type='text'
              name='website'
              value={website}
              onChange={event => setWebsite(event.target.value)}
              tabIndex={-1}
              autoComplete='off'
              aria-hidden='true'
              className='vn-newsletter-honeypot'
            />
            <label className='vn-sr-only' htmlFor='vn-newsletter-email'>
              Email
            </label>
            <input
              id='vn-newsletter-email'
              type='email'
              name='email'
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder={settings.placeholder}
              disabled={status === 'loading'}
            />
            <button
              type='submit'
              disabled={status === 'loading'}
              style={{ backgroundColor: settings.buttonColor || defaultNewsletterSettings.buttonColor }}
            >
              {status === 'loading' ? '…' : settings.buttonLabel}
            </button>
          </form>
          {message ? (
            <p className={`vn-newsletter-msg${status === 'error' ? ' is-error' : ' is-ok'}`} role='status'>
              {message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default NewsletterBlock
