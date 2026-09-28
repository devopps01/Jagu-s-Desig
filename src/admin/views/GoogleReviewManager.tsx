'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { defaultGoogleReviewSettings, type GoogleReviewSettings } from '@/libs/google-reviews-types'

type AdminState = GoogleReviewSettings & {
  placeName: string
  rating: number
  userRatingsTotal: number
  mapsUrl: string
  fetchedAt: string | null
  lastError: string
  reviews: { authorName: string; rating: number; text: string; relativeTime: string }[]
}

const empty: AdminState = {
  ...defaultGoogleReviewSettings,
  placeName: '',
  rating: 0,
  userRatingsTotal: 0,
  mapsUrl: '',
  fetchedAt: null,
  lastError: '',
  reviews: []
}

const GoogleReviewManager = () => {
  const [form, setForm] = useState<AdminState>(empty)
  const [saving, setSaving] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [message, setMessage] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/google-reviews')
    const json = await res.json()

    if (res.ok) setForm({ ...empty, ...json })
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage('')

    const res = await fetch('/api/admin/google-reviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()

    setSaving(false)
    setMessage(res.ok ? 'Google review settings saved.' : json.message || 'Save failed')
    if (res.ok) setForm({ ...empty, ...json })
  }

  const fetchGoogle = async () => {
    setFetching(true)
    setMessage('')

    const res = await fetch('/api/admin/google-reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()

    setFetching(false)
    setMessage(res.ok ? 'Reviews fetched from Google.' : json.message || 'Fetch failed')
    if (res.ok) setForm({ ...empty, ...json })
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card>
          <CardContent className='flex flex-col gap-2'>
            <Typography color='text.secondary'>Google rating</Typography>
            <Typography variant='h3'>{form.rating ? form.rating.toFixed(1) : '—'}</Typography>
            <Typography>{form.userRatingsTotal ? `${form.userRatingsTotal} Google reviews` : 'Not fetched yet'}</Typography>
            <Typography color='text.secondary'>{form.placeName || 'Connect a Place ID to load the business.'}</Typography>
            {form.fetchedAt ? (
              <Typography variant='body2' color='text.secondary'>
                Last fetch {new Date(form.fetchedAt).toLocaleString()}
              </Typography>
            ) : null}
            {form.lastError ? (
              <Typography color='error' variant='body2'>
                {form.lastError}
              </Typography>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid size={{ xs: 12, md: 8 }}>
        <Card>
          <CardContent>
            <Typography variant='h5' className='mbe-2'>
              Google reviews
            </Typography>
            <Typography color='text.secondary' className='mbe-6'>
              Connect your Google Business Profile. Paste the Place ID (Google Maps → your shop → Share, or the Place ID
              finder) and a Places API key, then Fetch. Quotes show on home and product pages; products without a site
              review use the Google star rating. Until that key is saved, the live map and Google review buttons still
              point to the Surat atelier.
            </Typography>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={form.enabled} onChange={event => setForm(current => ({ ...current, enabled: event.target.checked }))} />}
                  label='Enable Google reviews on the website'
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  label='Google Place ID'
                  value={form.placeId}
                  onChange={event => setForm(current => ({ ...current, placeId: event.target.value }))}
                  helperText='Open Google Maps → your business → Share. Or use the Place ID finder. You can paste a Maps URL that contains place_id.'
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  type='password'
                  label='Google Places API key'
                  value={form.apiKey}
                  onChange={event => setForm(current => ({ ...current, apiKey: event.target.value }))}
                  helperText='Google Cloud → APIs & Services → enable Places API → create an API key. You can also set GOOGLE_PLACES_API_KEY in .env.'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={<Switch checked={form.showOnHome} onChange={event => setForm(current => ({ ...current, showOnHome: event.target.checked }))} />}
                  label='Show on home page'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={<Switch checked={form.showOnProducts} onChange={event => setForm(current => ({ ...current, showOnProducts: event.target.checked }))} />}
                  label='Show on product pages'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <FormControlLabel
                  control={
                    <Switch checked={form.applyToProducts} onChange={event => setForm(current => ({ ...current, applyToProducts: event.target.checked }))} />
                  }
                  label='Apply rating to all products'
                />
              </Grid>
              <Grid size={{ xs: 12 }} className='flex flex-wrap gap-3'>
                <Button variant='contained' onClick={() => void save()} disabled={saving}>
                  {saving ? 'Saving…' : 'Save settings'}
                </Button>
                <Button variant='outlined' onClick={() => void fetchGoogle()} disabled={fetching}>
                  {fetching ? 'Fetching…' : 'Fetch from Google'}
                </Button>
                {form.mapsUrl ? (
                  <Button href={form.mapsUrl} target='_blank' rel='noreferrer'>
                    Open on Google
                  </Button>
                ) : null}
              </Grid>
              {message ? (
                <Grid size={{ xs: 12 }}>
                  <Typography color={message.includes('fail') || message.includes('error') || message.includes('Add') ? 'error' : 'success'}>
                    {message}
                  </Typography>
                </Grid>
              ) : null}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {form.reviews.length ? (
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mbe-4'>
                Latest Google quotes
              </Typography>
              <Grid container spacing={4}>
                {form.reviews.map(item => (
                  <Grid key={`${item.authorName}-${item.relativeTime}`} size={{ xs: 12, md: 6 }}>
                    <Typography fontWeight={600}>
                      {item.authorName} · {item.rating}★
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {item.relativeTime}
                    </Typography>
                    <Typography className='mbs-2'>{item.text}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default GoogleReviewManager
