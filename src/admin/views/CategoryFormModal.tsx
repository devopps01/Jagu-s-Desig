'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import ImageDropCard from '@admin/views/ImageDropCard'
import { slugify } from '@/libs/slug'

export type CategoryFormValue = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  imageName: string
  imageAlt: string
  type: 'main' | 'sub'
  parentId: string
  status: 'active' | 'inactive'
}

type MainOption = { id: string; name: string }

const CategoryFormModal = ({
  open,
  value,
  mains,
  error,
  onChange,
  onClose,
  onSave,
  onOpenMedia
}: {
  open: boolean
  value: CategoryFormValue
  mains: MainOption[]
  error: string
  onChange: (value: CategoryFormValue) => void
  onClose: () => void
  onSave: () => void
  onOpenMedia: (file: File) => void
}) => (
  <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
    <DialogTitle>{value.id ? 'Edit category' : 'Add category'}</DialogTitle>
    <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
      {error ? <Typography color='error'>{error}</Typography> : null}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='Name'
            value={value.name}
            onChange={event =>
              onChange({
                ...value,
                name: event.target.value,
                slug: value.id ? value.slug : slugify(event.target.value)
              })
            }
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label='URL (slug)'
            value={value.slug}
            onChange={event => onChange({ ...value, slug: event.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            multiline
            minRows={3}
            label='Description'
            value={value.description}
            onChange={event => onChange({ ...value, description: event.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControl>
            <RadioGroup
              row
              value={value.type}
              onChange={event =>
                onChange({
                  ...value,
                  type: event.target.value as 'main' | 'sub',
                  parentId: event.target.value === 'main' ? '' : value.parentId
                })
              }
            >
              <FormControlLabel value='main' control={<Radio />} label='Main category' />
              <FormControlLabel value='sub' control={<Radio />} label='Sub category' />
            </RadioGroup>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={value.status === 'active'}
                onChange={event => onChange({ ...value, status: event.target.checked ? 'active' : 'inactive' })}
              />
            }
            label={value.status === 'active' ? 'Status: Active' : 'Status: Inactive'}
          />
        </Grid>
        {value.type === 'sub' ? (
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label='Main category'
              value={value.parentId}
              onChange={event => onChange({ ...value, parentId: event.target.value })}
            >
              {mains.map(item => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        ) : null}
        <Grid size={{ xs: 12 }}>
          <ImageDropCard
            imageUrl={value.imageUrl}
            imageName={value.imageName}
            imageAlt={value.imageAlt}
            onFile={onOpenMedia}
          />
        </Grid>
      </Grid>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant='contained' onClick={onSave}>
        {value.id ? 'Update category' : 'Save category'}
      </Button>
    </DialogActions>
  </Dialog>
)

export default CategoryFormModal
