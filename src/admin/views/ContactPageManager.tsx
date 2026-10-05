'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import ContactPageEditor from '@admin/views/ContactPageEditor'
import { defaultContactSettings, type ContactSettings } from '@/libs/contact-types'

const ContactPageManager = () => {
  const params = useParams()
  const lang = String(params?.lang || 'en')
  const [settings, setSettings] = useState<ContactSettings>(defaultContactSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/contact-settings')
      .then(res => res.json())
      .then(json => {
        if (json && typeof json === 'object') setSettings({ ...defaultContactSettings, ...json })
      })
      .catch(() => undefined)
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    const res = await fetch('/api/admin/contact-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save contact page')
      return
    }

    setSettings({ ...defaultContactSettings, ...json })
    setMessage('Contact page saved. Header WhatsApp, footer and Contact Us now use these details.')
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 5, lg: 4 }}>
        <Card sx={{ borderRadius: 3, position: 'sticky', top: 88 }}>
          <CardContent className='flex flex-col gap-3'>
            <Typography color='text.secondary'>Quick links</Typography>
            <Typography variant='h6'>{settings.headline || 'Contact headline'}</Typography>
            <Typography color='text.secondary'>{settings.intro || 'Intro copy for the Contact Us page.'}</Typography>
            <div className='flex flex-wrap gap-3 mbs-2'>
              <Button href={`/${lang}/store/home-page`} variant='contained' startIcon={<i className='tabler-layout-dashboard' />}>
                Website editor
              </Button>
              <Button href='/contact' target='_blank' rel='noreferrer' variant='outlined'>
                Open Contact Us
              </Button>
              <Button href={`/${lang}/store/contact`} variant='text'>
                View inquiries
              </Button>
            </div>
            {message ? <Alert severity='success'>{message}</Alert> : null}
            {error ? <Alert severity='error'>{error}</Alert> : null}
            <Button variant='contained' disabled={saving} onClick={() => void save()}>
              {saving ? 'Saving…' : 'Save contact page'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 7, lg: 8 }}>
        <ContactPageEditor settings={settings} onChange={setSettings} />
      </Grid>
    </Grid>
  )
}

export default ContactPageManager
