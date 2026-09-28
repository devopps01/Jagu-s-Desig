'use client'

import { forwardRef, useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as yup from 'yup'

import CustomTextField from '@core/components/mui/TextField'
import AppReactDatepicker from '@/libs/styles/AppReactDatepicker'
import { RENT_SIZES } from '@/libs/rent-sizes'
import { formatPrice } from '@web/data/catalog'
import type { RentBooking } from '@/libs/rentals'
import type { PreviewProduct } from '@admin/views/RentPreviewDialog'

export type RentProductOption = PreviewProduct & {
  id: string
  listingType?: string
}

export type RentFormValue = {
  id: string
  productId: string
  productSlug: string
  size: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  status: RentBooking['status']
}

const pad = (value: number) => String(value).padStart(2, '0')

export const productNumber = (item?: { imageUrl?: string; id?: string; slug?: string }) => {
  const fromImage = (item?.imageUrl || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (item?.id || item?.slug || '00').slice(-4).toUpperCase()
}

const parseDate = (value: string) => {
  if (!value) return null

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

const toDateValue = (date: Date | null) => (date ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` : '')

const TIME_SLOTS = Array.from({ length: 15 * 4 }, (_, index) => {
  const hours = 8 + Math.floor(index / 4)
  const minutes = (index % 4) * 15

  if (hours > 22) return null

  return `${pad(hours)}:${pad(minutes)}`
}).filter(Boolean) as string[]

const formatSlot = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()

  date.setHours(hours, minutes, 0, 0)

  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

const DateDropdownInput = forwardRef(({ label, error, helperText, ...props }: { label: string; value?: string; error?: boolean; helperText?: string }, ref) => (
  <CustomTextField
    {...props}
    inputRef={ref}
    fullWidth
    label={label}
    error={error}
    helperText={helperText}
    slotProps={{
      input: {
        readOnly: true,
        endAdornment: (
          <InputAdornment position='end'>
            <i className='tabler-calendar-event mie-1' />
            <i className='tabler-chevron-down' />
          </InputAdornment>
        )
      }
    }}
  />
))

DateDropdownInput.displayName = 'DateDropdownInput'

export const rentFormSchema = yup.object({
  id: yup.string().default(''),
  productId: yup.string().default(''),
  productSlug: yup.string().trim().required('Please select an outfit'),
  size: yup
    .string()
    .required('Size is required')
    .test('size', 'Select a valid size', value => !value || (RENT_SIZES as readonly string[]).includes(value)),
  startDate: yup
    .string()
    .required('Start date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid start date'),
  endDate: yup
    .string()
    .required('End date is required')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid end date')
    .test('after-start', 'End date must be on or after start date', function (value) {
      return !value || !this.parent.startDate || value >= this.parent.startDate
    }),
  startTime: yup.string().required('Pickup time is required'),
  endTime: yup.string().required('Return time is required'),
  customerName: yup.string().trim().required('Customer name is required').min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  customerPhone: yup
    .string()
    .trim()
    .required('Phone is required')
    .matches(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit Indian phone number'),
  customerEmail: yup
    .string()
    .trim()
    .default('')
    .test('email', 'Enter a valid email', value => !value || yup.string().email().isValidSync(value)),
  notes: yup.string().trim().max(500, 'Notes must be at most 500 characters').default(''),
  status: yup.string().oneOf(['booked', 'ongoing', 'returned', 'cancelled']).required('Status is required')
})

export const emptyRentForm: RentFormValue = {
  id: '',
  productId: '',
  productSlug: '',
  size: 'M',
  startDate: '',
  endDate: '',
  startTime: '10:00',
  endTime: '18:00',
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  status: 'booked'
}

const RentFormDialog = ({
  open,
  initial,
  products,
  availability,
  onClose,
  onSave
}: {
  open: boolean
  initial: RentFormValue
  products: RentProductOption[]
  availability: string
  onClose: () => void
  onSave: (values: RentFormValue) => Promise<void> | void
}) => {
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [liveAvailability, setLiveAvailability] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RentFormValue>({
    resolver: yupResolver(rentFormSchema) as Resolver<RentFormValue>,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: emptyRentForm
  })

  useEffect(() => {
    if (!open) return

    reset({ ...emptyRentForm, ...initial })
    setQuery('')
  }, [initial, open, reset])

  const productSlug = watch('productSlug')
  const size = watch('size')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const bookingId = watch('id')
  const selected = products.find(item => item.slug === productSlug)

  useEffect(() => {
    if (!productSlug || !size || !startDate || !endDate) {
      setLiveAvailability('')

      return
    }

    const params = new URLSearchParams({ slug: productSlug, size, startDate, endDate })

    if (bookingId) params.set('excludeId', bookingId)

    fetch(`/api/web/rentals/availability?${params}`)
      .then(res => res.json())
      .then(json => setLiveAvailability(json.message || ''))
      .catch(() => setLiveAvailability(''))
  }, [bookingId, endDate, productSlug, size, startDate])

  const outfits = useMemo(
    () =>
      products
        .filter(item => item.listingType !== 'sale')
        .filter(item => {
          const text = `${item.name || ''} ${productNumber(item)} ${item.slug}`.toLowerCase()

          return text.includes(query.trim().toLowerCase())
        }),
    [products, query]
  )

  const submit = handleSubmit(
    async values => {
      setSaving(true)

      try {
        await onSave(values)
      } catch {
        // Parent save already shows the error toast.
      } finally {
        setSaving(false)
      }
    },
    formErrors => {
      const first = Object.values(formErrors)[0]?.message || 'Please fill all required fields'

      toast.error(String(first))
    }
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <form onSubmit={submit}>
        <DialogTitle>{initial.id ? 'Edit rental' : 'Add rental'}</DialogTitle>
        <DialogContent className='flex flex-col gap-5' sx={{ pt: 2 }}>
          {liveAvailability || availability ? (
            <Typography color='primary.main'>{liveAvailability || availability}</Typography>
          ) : null}

          {selected ? (
            <div className='flex items-center gap-4 rounded border p-4'>
              {selected.imageUrl ? (
                <img src={selected.imageUrl} alt={selected.name} width={72} height={96} className='rounded object-cover' style={{ width: 72, height: 96, objectFit: 'cover' }} />
              ) : (
                <div className='flex items-center justify-center rounded bg-actionHover' style={{ width: 72, height: 96 }}>
                  <i className='tabler-shirt' />
                </div>
              )}
              <div className='flex flex-col gap-1'>
                <Chip size='small' color='primary' variant='tonal' label={`#${productNumber(selected)}`} sx={{ width: 'fit-content' }} />
                <Typography variant='h6'>{selected.name}</Typography>
                {Number(selected.rentPrice) ? (
                  <Typography color='text.secondary'>Rent {formatPrice(Number(selected.rentPrice))}</Typography>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className='flex flex-col gap-3'>
            <Typography variant='h6'>Select outfit</Typography>
            <CustomTextField fullWidth placeholder='Search by name or number...' value={query} onChange={event => setQuery(event.target.value)} />
            {errors.productSlug ? <Typography color='error'>{errors.productSlug.message}</Typography> : null}
            <div className='flex flex-wrap gap-3' style={{ maxHeight: 260, overflow: 'auto' }}>
              {outfits.map(item => {
                const active = item.slug === productSlug

                return (
                  <button
                    key={item.id}
                    type='button'
                    onClick={() => {
                      setValue('productSlug', item.slug || '', { shouldValidate: true, shouldTouch: true })
                      setValue('productId', item.id, { shouldValidate: true })
                    }}
                    className='flex flex-col gap-2 rounded border p-2 text-start'
                    style={{
                      width: 132,
                      borderColor: errors.productSlug && !productSlug ? 'var(--mui-palette-error-main)' : active ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-divider)',
                      background: active ? 'var(--mui-palette-primary-lightOpacity)' : 'transparent',
                      cursor: 'pointer'
                    }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div className='flex items-center justify-center rounded bg-actionHover' style={{ height: 120 }}>
                        <i className='tabler-photo' />
                      </div>
                    )}
                    <Chip size='small' variant='tonal' color={active ? 'primary' : 'secondary'} label={`#${productNumber(item)}`} />
                    <Typography variant='body2' className='line-clamp-2'>
                      {item.name}
                    </Typography>
                  </button>
                )
              })}
              {!outfits.length ? <Typography color='text.secondary'>No outfits found</Typography> : null}
            </div>
          </div>

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='size'
                control={control}
                render={({ field }) => (
                  <CustomTextField select fullWidth label='Size' {...field} error={Boolean(errors.size)} helperText={errors.size?.message}>
                    {RENT_SIZES.map(item => (
                      <MenuItem key={item} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Controller
                name='status'
                control={control}
                render={({ field }) => (
                  <CustomTextField select fullWidth label='Status' {...field} error={Boolean(errors.status)} helperText={errors.status?.message}>
                    <MenuItem value='booked'>Booked</MenuItem>
                    <MenuItem value='ongoing'>Ongoing</MenuItem>
                    <MenuItem value='returned'>Returned</MenuItem>
                    <MenuItem value='cancelled'>Cancelled</MenuItem>
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='startDate'
                control={control}
                render={({ field }) => (
                  <AppReactDatepicker
                    withPortal
                    showPopperArrow={false}
                    popperPlacement='bottom-start'
                    popperProps={{ strategy: 'fixed' }}
                    selected={parseDate(field.value)}
                    selectsStart
                    startDate={parseDate(field.value)}
                    endDate={parseDate(endDate)}
                    dateFormat='dd-MM-yyyy'
                    placeholderText='Select start date'
                    customInput={<DateDropdownInput label='Start date' error={Boolean(errors.startDate)} helperText={errors.startDate?.message} />}
                    onChange={(date: Date | null) => field.onChange(toDateValue(date))}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='endDate'
                control={control}
                render={({ field }) => (
                  <AppReactDatepicker
                    withPortal
                    showPopperArrow={false}
                    popperPlacement='bottom-start'
                    popperProps={{ strategy: 'fixed' }}
                    selected={parseDate(field.value)}
                    selectsEnd
                    startDate={parseDate(startDate)}
                    endDate={parseDate(field.value)}
                    minDate={parseDate(startDate) || undefined}
                    dateFormat='dd-MM-yyyy'
                    placeholderText='Select end date'
                    customInput={<DateDropdownInput label='End date' error={Boolean(errors.endDate)} helperText={errors.endDate?.message} />}
                    onChange={(date: Date | null) => field.onChange(toDateValue(date))}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='startTime'
                control={control}
                render={({ field }) => (
                  <CustomTextField select fullWidth label='Pickup time' {...field} error={Boolean(errors.startTime)} helperText={errors.startTime?.message}>
                    {TIME_SLOTS.map(item => (
                      <MenuItem key={`start-${item}`} value={item}>
                        {formatSlot(item)}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='endTime'
                control={control}
                render={({ field }) => (
                  <CustomTextField select fullWidth label='Return time' {...field} error={Boolean(errors.endTime)} helperText={errors.endTime?.message}>
                    {TIME_SLOTS.map(item => (
                      <MenuItem key={`end-${item}`} value={item}>
                        {formatSlot(item)}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='customerName'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth label='Customer name' {...field} error={Boolean(errors.customerName)} helperText={errors.customerName?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='customerPhone'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth label='Phone' {...field} error={Boolean(errors.customerPhone)} helperText={errors.customerPhone?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='customerEmail'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth label='Email' {...field} error={Boolean(errors.customerEmail)} helperText={errors.customerEmail?.message} />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='notes'
                control={control}
                render={({ field }) => (
                  <CustomTextField fullWidth multiline minRows={2} label='Notes' {...field} error={Boolean(errors.notes)} helperText={errors.notes?.message} />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button type='button' onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type='submit' variant='contained' disabled={saving}>
            {saving ? 'Saving...' : 'Save rental'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default RentFormDialog
