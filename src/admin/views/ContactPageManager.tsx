'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
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
    void adminApi<ContactSettings>('/api/admin/contact-settings', undefined, { silentSuccess: true }).then(result => {
      if (result.ok && result.data && typeof result.data === 'object') {
        setSettings({ ...defaultContactSettings, ...result.data })
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    const result = await adminApi<ContactSettings>(
      '/api/admin/contact-settings',
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      },
      { successMessage: 'Contact page saved' }
    )

    setSaving(false)

    if (!result.ok) {
      setError(result.message || 'Could not save contact page')
      return
    }

    setSettings({ ...defaultContactSettings, ...result.data })
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
