'use client'

import Autocomplete from '@mui/material/Autocomplete'
import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import ImageDropCard from '@admin/views/ImageDropCard'
import ProductDescriptionEditor from '@admin/views/ProductDescriptionEditor'
import { FILTER_COLORS } from '@/libs/filter-utils'
import { slugify } from '@/libs/slug'
import type { ListingType } from '@/libs/products'

const COLOR_HEX: Record<string, string> = {
  Red: '#c0392b',
  Pink: '#e58aaa',
  Yellow: '#e6c229',
  Green: '#2f8f4e',
  Black: '#1c1c1c',
  White: '#f7f7f7',
  Purple: '#7a3e9d',
  Gold: '#c9a24a',
  Blue: '#2f6fdb',
  Ivory: '#f3ead7',
  Maroon: '#7a1f32',
  Orange: '#e07a2f',
  Beige: '#d8c3a5',
  Grey: '#8d8d8d',
  Brown: '#7a4b2d',
  Navy: '#1d3557'
}

const colorHex = (name: string) => COLOR_HEX[name] || '#c4c4c4'

const ColorSwatch = ({ name }: { name: string }) => (
  <span
    aria-hidden='true'
    style={{
      width: 16,
      height: 16,
      borderRadius: 4,
      flexShrink: 0,
      background: colorHex(name),
      border: '1px solid rgba(255,255,255,0.35)',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)'
    }}
  />
)

export type ProductFormValue = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  images?: string[]
  imageName: string
  imageAlt: string
  listingType: ListingType
  sellingPrice: number | string
  rentPrice: number | string
  sellingMrp: number | string
  rentMrp: number | string
  collections: string[]
  fabric: string
  color: string
  craft: string
  occasion: string
  design: string
  style: string
  styles: string[]
  details: { label: string; value: string }[]
  seoTitle: string
  seoDescription: string
  status: 'active' | 'inactive'
}

const ProductFormModal = ({
  open,
  value,
  mains,
  error,
  onChange,
  onClose,
  onSave,
  onOpenMedia,
  onAddGallery
}: {
  open: boolean
  value: ProductFormValue
  mains: { id: string; name: string; slug: string }[]
  error: string
  onChange: (value: ProductFormValue) => void
  onClose: () => void
  onSave: () => void
  onOpenMedia: (file: File) => void
  onAddGallery: () => void
}) => {
  const set = (patch: Partial<ProductFormValue>) => onChange({ ...value, ...patch })
  const [styleOptions, setStyleOptions] = useState<string[]>([])

  useEffect(() => {
    if (!open) return

    fetch('/api/admin/styles?active=1')
      .then(res => (res.ok ? res.json() : []))
      .then(json => {
        const names = Array.isArray(json) ? json.map((item: { name?: string }) => String(item.name || '')).filter(Boolean) : []

        setStyleOptions(names)
      })
      .catch(() => setStyleOptions([]))
  }, [open])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth='md'
      slotProps={{
        paper: {
          sx: {
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100dvh - 48px)',
            overflow: 'hidden'
          }
        }
      }}
    >
      <DialogTitle sx={{ flexShrink: 0, px: '28px !important', pt: '24px !important', pb: '8px !important' }}>
        {value.id ? 'Edit product' : 'Add product'}
      </DialogTitle>
      <DialogContent sx={{ flex: '1 1 auto', overflowY: 'auto', padding: '16px 28px 32px !important' }}>
        {error ? <Typography color='error' sx={{ mb: 2 }}>{error}</Typography> : null}
        <Grid container spacing={4} sx={{ width: '100%' }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label='Product name'
              value={value.name}
              onChange={event =>
                set({
                  name: event.target.value,
                  slug: value.id ? value.slug : slugify(event.target.value),
                  imageAlt: value.imageAlt || event.target.value,
                  seoTitle: value.id ? value.seoTitle : `${event.target.value} | Jagu's Designing`
                })
              }
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label='URL (slug)' value={value.slug} onChange={event => set({ slug: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ProductDescriptionEditor
              open={open}
              productId={value.id}
              value={value.description}
              onChange={(html, plain) =>
                set({
                  description: html,
                  seoDescription: value.id ? value.seoDescription : plain
                })
              }
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControl>
              <Typography variant='body2'>Listing type</Typography>
              <RadioGroup row value={value.listingType} onChange={event => set({ listingType: event.target.value as ListingType })}>
                <FormControlLabel value='sale' control={<Radio />} label='Selling only' />
                <FormControlLabel value='rent' control={<Radio />} label='Rent only' />
                <FormControlLabel value='both' control={<Radio />} label='Selling + Rent' />
              </RadioGroup>
            </FormControl>
          </Grid>
          {value.listingType !== 'rent' ? (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Selling MRP (₹)'
                  value={value.sellingMrp}
                  onChange={event => set({ sellingMrp: event.target.value })}
                  helperText='Original selling price before discount'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Selling price (₹)'
                  value={value.sellingPrice}
                  onChange={event => set({ sellingPrice: event.target.value })}
                  helperText={
                    Number(value.sellingMrp) > Number(value.sellingPrice) && Number(value.sellingPrice) > 0
                      ? `${Math.round(((Number(value.sellingMrp) - Number(value.sellingPrice)) / Number(value.sellingMrp)) * 100)}% off on selling`
                      : 'Final selling price on website'
                  }
                />
              </Grid>
            </>
          ) : null}
          {value.listingType !== 'sale' ? (
            <>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Rent MRP (₹)'
                  value={value.rentMrp}
                  onChange={event => set({ rentMrp: event.target.value })}
                  helperText='Original rent price before discount'
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type='number'
                  label='Rent price (₹)'
                  value={value.rentPrice}
                  onChange={event => set({ rentPrice: event.target.value })}
                  helperText={
                    Number(value.rentMrp) > Number(value.rentPrice) && Number(value.rentPrice) > 0
                      ? `${Math.round(((Number(value.rentMrp) - Number(value.rentPrice)) / Number(value.rentMrp)) * 100)}% off on rent`
                      : 'Final rent price on website'
                  }
                />
              </Grid>
            </>
          ) : null}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              multiple
              fullWidth
              disableCloseOnSelect
              options={mains}
              value={mains.filter(item => value.collections.includes(item.slug))}
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(option, selected) => option.slug === selected.slug}
              onChange={(_event, selected) => set({ collections: selected.map(item => item.slug) })}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props

                return (
                  <li key={key} {...optionProps}>
                    <Checkbox size='small' checked={selected} sx={{ mr: 1 }} />
                    {option.name}
                  </li>
                )
              }}
              renderInput={params => (
                <TextField {...params} label='Collections' placeholder='Search collections' />
              )}
              slotProps={{ popper: { sx: { zIndex: 1600 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label='Fabric' value={value.fabric} onChange={event => set({ fabric: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              multiple
              fullWidth
              disableCloseOnSelect
              options={[
                ...FILTER_COLORS,
                ...value.color
                  .split(',')
                  .map(item => item.trim())
                  .filter(item => item && !FILTER_COLORS.some(color => color.toLowerCase() === item.toLowerCase()))
              ]}
              value={value.color
                .split(',')
                .map(item => item.trim())
                .filter(Boolean)}
              onChange={(_event, selected) => set({ color: selected.join(', ') })}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props

                return (
                  <li key={key} {...optionProps}>
                    <Checkbox size='small' checked={selected} sx={{ mr: 1 }} />
                    <ColorSwatch name={option} />
                    <span style={{ marginLeft: 8 }}>{option}</span>
                  </li>
                )
              }}
              renderTags={(selected, getTagProps) =>
                selected.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index })

                  return (
                    <Chip key={key} {...tagProps} label={option} size='small' icon={<ColorSwatch name={option} />} />
                  )
                })
              }
              renderInput={params => <TextField {...params} label='Color' placeholder='Search colors' />}
              slotProps={{ popper: { sx: { zIndex: 1600 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label='Craft & Weave' value={value.craft} onChange={event => set({ craft: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label='Occasion' value={value.occasion} onChange={event => set({ occasion: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label='Design & Print' value={value.design} onChange={event => set({ design: event.target.value })} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Autocomplete
              multiple
              fullWidth
              disableCloseOnSelect
              options={[...new Set([...styleOptions, ...(value.styles || []), value.style].filter(Boolean))]}
              value={(value.styles && value.styles.length ? value.styles : value.style ? [value.style] : []).filter(Boolean)}
              onChange={(_event, selected) => set({ styles: selected, style: selected[0] || '' })}
              renderOption={(props, option, { selected }) => {
                const { key, ...optionProps } = props

                return (
                  <li key={key} {...optionProps}>
                    <Checkbox size='small' checked={selected} sx={{ mr: 1 }} />
                    {option}
                  </li>
                )
              }}
              renderInput={params => <TextField {...params} label='Style' placeholder='Search styles' />}
              slotProps={{ popper: { sx: { zIndex: 1600 } } }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant='subtitle1'>Product details</Typography>
            <Typography variant='body2' color='text.secondary' className='mbe-2'>
              Each row is a label and a value on the product page. Add or remove any row.
            </Typography>
            <div className='flex flex-col gap-3'>
              {(value.details || []).map((row, index) => (
                <div key={index} className='flex items-start gap-2'>
                  <TextField
                    fullWidth
                    label='Label'
                    value={row.label}
                    onChange={event => {
                      const details = [...(value.details || [])]

                      details[index] = { ...details[index], label: event.target.value }
                      set({ details })
                    }}
                  />
                  <TextField
                    fullWidth
                    label='Value'
                    value={row.value}
                    onChange={event => {
                      const details = [...(value.details || [])]

                      details[index] = { ...details[index], value: event.target.value }
                      set({ details })
                    }}
                  />
                  <IconButton
                    color='error'
                    aria-label='Remove detail'
                    onClick={() => set({ details: (value.details || []).filter((_, item) => item !== index) })}
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </div>
              ))}
              <Button variant='outlined' onClick={() => set({ details: [...(value.details || []), { label: '', value: '' }] })}>
                Add detail
              </Button>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <ImageDropCard imageUrl={value.imageUrl} imageName={value.imageName} imageAlt={value.imageAlt} onFile={onOpenMedia} />
            <Typography variant='body2' className='mbs-4 mbe-2'>
              Extra photos (more poses)
            </Typography>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(value.images || []).filter(src => src && src !== value.imageUrl).map(src => (
                <button
                  key={src}
                  type='button'
                  onClick={() => set({ images: (value.images || []).filter(item => item !== src) })}
                  style={{ width: 72, height: 90, padding: 0, border: '1px solid #eee', borderRadius: 8, overflow: 'hidden', cursor: 'pointer' }}
                  title='Remove photo'
                >
                  <img src={src} alt='' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
              <Button variant='outlined' onClick={onAddGallery}>
                Add photo
              </Button>
            </div>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label='SEO title'
              value={value.seoTitle}
              onChange={event => set({ seoTitle: event.target.value })}
              helperText='Shown in Google search results'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              label='SEO description'
              value={value.seoDescription}
              onChange={event => set({ seoDescription: event.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch checked={value.status === 'active'} onChange={event => set({ status: event.target.checked ? 'active' : 'inactive' })} />
              }
              label={value.status === 'active' ? 'Status: Active' : 'Status: Inactive'}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions
        sx={{
          position: 'relative',
          zIndex: 2,
          flexShrink: 0,
          justifyContent: 'center',
          margin: 0,
          padding: '16px 28px 24px !important',
          gap: 2,
          bgcolor: 'background.paper',
          border: 'none',
          boxShadow: 'none'
        }}
      >
        <Button onClick={onClose}>Cancel</Button>
        <Button variant='contained' onClick={onSave}>
          {value.id ? 'Update product' : 'Save product'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ProductFormModal
