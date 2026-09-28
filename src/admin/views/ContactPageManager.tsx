'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { defaultContactSettings, type ContactSettings } from '@/libs/contact-types'

const field = (
  settings: ContactSettings,
  setSettings: (next: ContactSettings | ((current: ContactSettings) => ContactSettings)) => void,
  key: keyof ContactSettings,
  label: string,
  extra?: { multiline?: boolean; helper?: string; type?: string }
) => (
  <TextField
    fullWidth
    label={label}
    type={extra?.type || 'text'}
    multiline={Boolean(extra?.multiline)}
    minRows={extra?.multiline ? 3 : undefined}
    helperText={extra?.helper}
    value={settings[key]}
    onChange={event => setSettings(current => ({ ...current, [key]: event.target.value }))}
  />
)

const ContactPageManager = () => {
  const params = useParams()
  const lang = String(params?.lang || 'en')
  const [settings, setSettings] = useState<ContactSettings>(defaultContactSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/contact-settings')
    const json = await res.json()

    if (res.ok) setSettings({ ...defaultContactSettings, ...json })
  }

  useEffect(() => {
    void load()
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
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent className='flex flex-col gap-3'>
            <Typography color='text.secondary'>Website preview</Typography>
            <Typography variant='h5'>{settings.headline || 'Contact headline'}</Typography>
            <Typography color='text.secondary'>{settings.intro || 'Intro copy for the Contact Us page.'}</Typography>
            <Divider />
            <Typography>
              <strong>Hours</strong>
              <br />
              {settings.hours || '—'}
            </Typography>
            <Typography>
              <strong>WhatsApp</strong>
              <br />
              {settings.whatsapp || '—'}
            </Typography>
            <Typography>
              <strong>Surat</strong>
              <br />
              {settings.suratAddress || '—'}
            </Typography>
            {settings.bangaloreAddress ? (
              <Typography>
                <strong>{settings.bangaloreTitle || 'Second store'}</strong>
                <br />
                {settings.bangaloreAddress}
              </Typography>
            ) : null}
            <div className='flex flex-wrap gap-3 mbs-2'>
              <Button href='/contact' target='_blank' rel='noreferrer' variant='outlined'>
                Open Contact Us
              </Button>
              <Button href={`/${lang}/store/contact`} variant='text'>
                View inquiries
              </Button>
            </div>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant='h5' className='mbe-1'>
                  Page copy
                </Typography>
                <Typography color='text.secondary' className='mbe-6'>
                  Headline and intro shown at the top of the Contact Us page.
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 7 }}>{field(settings, setSettings, 'headline', 'Headline')}</Grid>
                  <Grid size={{ xs: 12, md: 5 }}>{field(settings, setSettings, 'hours', 'Store hours')}</Grid>
                  <Grid size={{ xs: 12 }}>
                    {field(settings, setSettings, 'intro', 'Intro', { multiline: true })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant='h5' className='mbe-1'>
                  Reach us
                </Typography>
                <Typography color='text.secondary' className='mbe-6'>
                  Email, phone and WhatsApp used in the header, footer and contact form.
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 4 }}>{field(settings, setSettings, 'email', 'Email')}</Grid>
                  <Grid size={{ xs: 12, md: 4 }}>{field(settings, setSettings, 'phone', 'Surat phone')}</Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    {field(settings, setSettings, 'whatsapp', 'WhatsApp number', {
                      helper: 'Digits only with country code, e.g. 918154000063'
                    })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card className='h-full'>
              <CardContent>
                <Typography variant='h5' className='mbe-1'>
                  Surat atelier
                </Typography>
                <Typography color='text.secondary' className='mbe-6'>
                  Main store address and the Google Maps pin.
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>{field(settings, setSettings, 'suratTitle', 'Title')}</Grid>
                  <Grid size={{ xs: 12 }}>
                    {field(settings, setSettings, 'suratAddress', 'Address', { multiline: true })}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    {field(settings, setSettings, 'suratMapQuery', 'Map search', {
                      helper: 'Address Google uses to drop the pin on Contact Us.'
                    })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card className='h-full'>
              <CardContent>
                <Typography variant='h5' className='mbe-1'>
                  Second store
                </Typography>
                <Typography color='text.secondary' className='mbe-6'>
                  Leave blank to hide Bangalore from the website.
                </Typography>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12 }}>{field(settings, setSettings, 'bangaloreTitle', 'Title')}</Grid>
                  <Grid size={{ xs: 12 }}>{field(settings, setSettings, 'bangalorePhone', 'Phone')}</Grid>
                  <Grid size={{ xs: 12 }}>
                    {field(settings, setSettings, 'bangaloreAddress', 'Address', { multiline: true })}
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    {field(settings, setSettings, 'bangaloreMapQuery', 'Map search', {
                      helper: 'Optional. Used only if an address is saved.'
                    })}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent className='flex flex-wrap items-center gap-4'>
                <Button variant='contained' disabled={saving} onClick={() => void save()}>
                  {saving ? 'Saving…' : 'Save contact page'}
                </Button>
                {message ? <Alert severity='success'>{message}</Alert> : null}
                {error ? <Alert severity='error'>{error}</Alert> : null}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default ContactPageManager
