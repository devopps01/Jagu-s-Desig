'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { calcGstAmount, defaultGstSettings, type GstSettings } from '@/libs/gst-types'

const GstSettingsManager = () => {
  const [settings, setSettings] = useState<GstSettings>(defaultGstSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/gst-settings')
    const json = await res.json()

    if (res.ok) setSettings({ ...defaultGstSettings, ...json })
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')
    setError('')

    const res = await fetch('/api/admin/gst-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save GST settings')

      return
    }

    setSettings({ ...defaultGstSettings, ...json })
    setMessage(
      json.enabled
        ? `GST is ON at ${json.rate}%. It will apply on checkout and be included in the bill.`
        : 'GST is OFF. Checkout will not add GST to the bill.'
    )
  }

  const preview = calcGstAmount(1000, settings)

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <Typography variant='h4'>GST settings</Typography>
        <Typography color='text.secondary'>
          Turn GST on only when you want it charged. Set the percentage from here — checkout and bills follow this setting.
        </Typography>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
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
              label={settings.enabled ? 'GST is ON — applies on checkout' : 'GST is OFF — not charged'}
            />

            <TextField
              fullWidth
              type='number'
              label='GST rate (%)'
              helperText='Example: 5, 12 or 18. Used only when GST is ON.'
              inputProps={{ min: 0, max: 40, step: 0.01 }}
              value={settings.rate}
              disabled={!settings.enabled}
              onChange={event => setSettings(current => ({ ...current, rate: Number(event.target.value) }))}
            />

            <TextField
              fullWidth
              label='Bill label'
              helperText='Shown on checkout and invoice, e.g. GST or GST (18%)'
              value={settings.label}
              onChange={event => setSettings(current => ({ ...current, label: event.target.value }))}
            />

            <Alert severity='info'>
              Preview on ₹1,000 taxable: {settings.enabled ? `₹ ${preview.toLocaleString('en-IN')} (${settings.rate}%)` : '₹ 0 (GST off)'}
            </Alert>

            <Button variant='contained' disabled={saving} onClick={() => void save()} sx={{ alignSelf: 'flex-start' }}>
              {saving ? 'Saving…' : 'Save GST settings'}
            </Button>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default GstSettingsManager
