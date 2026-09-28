'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import ImageDropCard from '@admin/views/ImageDropCard'
import MediaPickerModal, { type PickedMedia } from '@admin/views/MediaPickerModal'
import { defaultNewsletterSettings, type NewsletterSettings } from '@/libs/newsletter-types'

const NewsletterSettingsManager = () => {
  const params = useParams()
  const lang = String(params?.lang || 'en')
  const [settings, setSettings] = useState<NewsletterSettings>(defaultNewsletterSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const load = async () => {
    const res = await fetch('/api/admin/newsletter-settings')
    const json = await res.json()

    if (res.ok) setSettings({ ...defaultNewsletterSettings, ...json })
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    const res = await fetch('/api/admin/newsletter-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save newsletter settings')

      return
    }

    setSettings({ ...defaultNewsletterSettings, ...json })
    setMessage('Newsletter settings saved. It shows at the top of the site footer.')
  }

  const onPick = (media: PickedMedia) => {
    setSettings(current => ({ ...current, backgroundImage: media.url }))
    setPickerOpen(false)
    setPendingFile(null)
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <div className='flex flex-wrap items-start justify-between gap-4'>
          <div>
            <Typography variant='h4'>Newsletter banner</Typography>
            <Typography color='text.secondary'>
              Edit the home-page subscribe block: copy, button colour, and background image.
            </Typography>
          </div>
          <Button href={`/${lang}/store/newsletter-subscribers`} variant='outlined'>
            View subscribers
          </Button>
        </div>
      </Grid>

      <Grid size={{ xs: 12, md: 7 }}>
        <Card>
          <CardContent className='flex flex-col gap-5'>
            {message ? <Alert severity='success'>{message}</Alert> : null}
            {error ? <Alert severity='error'>{error}</Alert> : null}

            <FormControlLabel
              control={
                <Switch
                  checked={settings.enabled}
                  onChange={event => setSettings(current => ({ ...current, enabled: event.target.checked }))}
                />
              }
              label={settings.enabled ? 'Banner is ON — shown above footer' : 'Banner is OFF — hidden'}
            />

            <TextField
              fullWidth
              label='Headline'
              value={settings.headline}
              onChange={event => setSettings(current => ({ ...current, headline: event.target.value }))}
            />

            <TextField
              fullWidth
              multiline
              minRows={2}
              label='Subtext'
              value={settings.subtext}
              onChange={event => setSettings(current => ({ ...current, subtext: event.target.value }))}
            />

            <TextField
              fullWidth
              label='Email placeholder'
              value={settings.placeholder}
              onChange={event => setSettings(current => ({ ...current, placeholder: event.target.value }))}
            />

            <TextField
              fullWidth
              label='Button label'
              value={settings.buttonLabel}
              onChange={event => setSettings(current => ({ ...current, buttonLabel: event.target.value }))}
            />

            <TextField
              fullWidth
              type='color'
              label='Button colour'
              value={settings.buttonColor}
              onChange={event => setSettings(current => ({ ...current, buttonColor: event.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ maxWidth: 180 }}
            />

            <TextField
              fullWidth
              label='Success message'
              value={settings.successMessage}
              onChange={event => setSettings(current => ({ ...current, successMessage: event.target.value }))}
            />

            <Button variant='contained' disabled={saving} onClick={() => void save()} sx={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving…' : 'Save newsletter settings'}
            </Button>
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 5 }}>
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='h6'>Background image</Typography>
            <Typography color='text.secondary' variant='body2'>
              Wide bridal / festive image works best behind the white subscribe card.
            </Typography>
            <ImageDropCard
              imageUrl={settings.backgroundImage}
              imageName='newsletter-banner'
              imageAlt='Newsletter banner'
              onFile={file => {
                setPendingFile(file)
                setPickerOpen(true)
              }}
            />
            <TextField
              fullWidth
              label='Image URL'
              value={settings.backgroundImage}
              onChange={event => setSettings(current => ({ ...current, backgroundImage: event.target.value }))}
              helperText='Or paste a public image path / URL'
            />
          </CardContent>
        </Card>
      </Grid>

      <MediaPickerModal
        open={pickerOpen}
        file={pendingFile}
        onClose={() => {
          setPickerOpen(false)
          setPendingFile(null)
        }}
        onSelect={onPick}
      />
    </Grid>
  )
}

export default NewsletterSettingsManager
