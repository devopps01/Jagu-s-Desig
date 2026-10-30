'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { yupResolver } from '@hookform/resolvers/yup'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { toast } from 'react-toastify'
import * as yup from 'yup'

import { adminApi } from '@admin/libs/adminApi'
import { RentCustomerFields } from '@admin/views/RentCustomerFields'
import RentProductDialog, { type OutfitPick } from '@admin/views/RentOutfitBlock'
import CustomTextField from '@core/components/mui/TextField'
import { cleanRentPayments, RENT_PAYMENT_METHODS, RENT_PAYMENT_OPTIONS, rentPaymentMethodLabel, scaleRentPayments, type RentPaymentLine, type RentPaymentOption } from '@/libs/rent-payment'
import { RENT_SIZES, isSizeOutOfStock } from '@/libs/rent-sizes'
import { formatPrice } from '@web/data/catalog'
import type { PreviewProduct } from '@admin/views/RentPreviewDialog'

export type RentProductOption = PreviewProduct & {
  id: string
  listingType?: string
  sizes?: string[]
  rentSizeStock?: Record<string, number>
  rentOutOfStock?: string[]
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
  status: 'booked' | 'ongoing' | 'returned' | 'cancelled'
  productPrice: number
  finalPrice: number
  paymentOption: RentPaymentOption
  paymentMethod: string
  paymentNote: string
  paidAmount: number
  balanceAmount: number
  gstEnabled: boolean
  gstRate: number
  gstAmount: number
  discountAmount: number
  payments: RentPaymentLine[]
  updateCatalogPrice: boolean
}

const pad = (value: number) => String(value).padStart(2, '0')

export const productNumber = (item?: { imageUrl?: string; id?: string; slug?: string }) => {
  const fromImage = (item?.imageUrl || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (item?.id || item?.slug || '00').slice(-4).toUpperCase()
}

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
    .test('phone', 'Enter a phone number', value => {
      const text = value || ''
      const digits = text.replace(/\D/g, '')

      return digits.length >= 6 && digits.length <= 15 && /^[+()\d][\d\s().+-]*$/.test(text)
    }),
  customerEmail: yup
    .string()
    .trim()
    .default('')
    .test('email', 'Enter a valid email', value => !value || yup.string().email().isValidSync(value)),
  notes: yup.string().trim().max(500, 'Notes must be at most 500 characters').default(''),
  status: yup.string().oneOf(['booked', 'ongoing', 'returned', 'cancelled']).required('Status is required'),
  productPrice: yup.number().typeError('Enter the product price').min(0, 'Product price cannot be negative').max(999999).required(),
  finalPrice: yup.number().typeError('Enter the final price').min(0, 'Final price cannot be negative').max(999999).required(),
  paymentOption: yup.string().oneOf(['unpaid', 'half', 'full', 'custom']).required(),
  paymentMethod: yup.string().trim().max(80).default('Cash'),
  paymentNote: yup.string().trim().max(240).default(''),
  paidAmount: yup.number().typeError('Enter the amount received').min(0).max(999999).required(),
  balanceAmount: yup.number().typeError('Enter what is left to collect').min(0).max(999999).required(),
  gstEnabled: yup.boolean().default(false),
  gstRate: yup.number().typeError('Enter GST %').min(0, 'GST cannot be negative').max(100, 'GST cannot be more than 100%').required(),
  gstAmount: yup.number().min(0).max(999999).default(0),
  discountAmount: yup.number().typeError('Enter the discount').min(0, 'Discount cannot be negative').max(999999).required(),
  payments: yup
    .array()
    .of(
      yup.object({
        method: yup.string().trim().required('Choose how this part was paid'),
        amount: yup.number().typeError('Enter the amount').min(0).max(999999).required()
      })
    )
    .min(1)
    .required(),
  updateCatalogPrice: yup.boolean().default(false)
})

const STATUS_CHOICES = [
  { value: 'booked', label: 'Booked' },
  { value: 'ongoing', label: 'Ongoing' }
] as const

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
  status: 'booked',
  productPrice: 0,
  finalPrice: 0,
  paymentOption: 'unpaid',
  paymentMethod: 'Cash',
  paymentNote: '',
  paidAmount: 0,
  balanceAmount: 0,
  gstEnabled: false,
  gstRate: 5,
  gstAmount: 0,
  discountAmount: 0,
  payments: [{ method: 'Cash', amount: 0 }],
  updateCatalogPrice: false
}

const paymentLinesOf = (row?: { payments?: RentPaymentLine[]; paymentMethod?: string; paidAmount?: number } | null): RentPaymentLine[] => {
  const saved = cleanRentPayments(row?.payments)

  if (saved.length) return saved.map(line => ({ ...line }))

  return [{ method: row?.paymentMethod || 'Cash', amount: Math.max(0, Math.round(Number(row?.paidAmount) || 0)) }]
}

export const loadAdminRentProducts = async () => {
  const [rent, both] = await Promise.all([
    adminApi<{ data?: RentProductOption[] }>('/api/admin/products?limit=100&listingType=rent', undefined, { silentSuccess: true }),
    adminApi<{ data?: RentProductOption[] }>('/api/admin/products?limit=100&listingType=both', undefined, { silentSuccess: true })
  ])
  const rows = [...(rent.data?.data || []), ...(both.data?.data || [])]
  const seen = new Set<string>()

  return rows.filter(item => {
    if (!item.id || seen.has(item.id) || item.listingType === 'sale') return false

    seen.add(item.id)

    return true
  })
}

const RentFormDialog = ({
  open,
  initial,
  products,
  availability,
  embedded = false,
  onClose,
  onSave
}: {
  open: boolean
  initial: RentFormValue
  products: RentProductOption[]
  availability: string
  embedded?: boolean
  onClose: () => void
  onSave: (values: RentFormValue, extras?: RentFormValue[]) => Promise<void> | void
}) => {
  const [extras, setExtras] = useState<(OutfitPick & { key: string })[]>([])
  const [lines, setLines] = useState<(OutfitPick & { key: string })[]>([])
  const [picker, setPicker] = useState<(OutfitPick & { key: string }) | null>(null)
  const [saving, setSaving] = useState(false)
  const [liveAvailability, setLiveAvailability] = useState('')
  const [datesFree, setDatesFree] = useState(true)

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors }
  } = useForm<RentFormValue>({
    resolver: yupResolver(rentFormSchema) as Resolver<RentFormValue>,
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: { ...emptyRentForm, ...initial, payments: paymentLinesOf(initial) }
  })
  const paymentFields = useFieldArray({ control, name: 'payments' })

  useEffect(() => {
    if (!open) return

    reset({
      ...emptyRentForm,
      ...initial,
      gstRate: Number(initial.gstRate) > 0 ? Number(initial.gstRate) : emptyRentForm.gstRate,
      discountAmount: Math.max(0, Math.round(Number(initial.discountAmount) || 0)),
      payments: paymentLinesOf(initial)
    })
    setPicker(null)
    setExtras([])

    if (initial.productSlug) {
      const seeded = Math.max(0, Math.round(Number(initial.finalPrice || initial.productPrice) || 0))

      setLines([
        {
          key: 'primary',
          productId: initial.productId,
          productSlug: initial.productSlug,
          size: initial.size || 'M',
          startDate: initial.startDate,
          endDate: initial.endDate,
          price: seeded
        }
      ])
    } else {
      setLines([])
    }
  }, [initial, open, reset])

  useEffect(() => {
    if (!open || initial.id) return

    let live = true

    fetch('/api/web/gst')
      .then(res => res.json())
      .then(json => {
        if (!live) return

        const rate = Math.round(Number(json?.rate) || 0)

        if (rate > 0 && rate <= 100) setValue('gstRate', rate)
      })
      .catch(() => undefined)

    return () => {
      live = false
    }
  }, [initial.id, open, setValue])

  const productSlug = watch('productSlug')
  const size = watch('size')
  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const bookingId = watch('id')
  const finalPrice = watch('finalPrice')
  const balanceAmount = watch('balanceAmount')
  const gstEnabled = watch('gstEnabled')
  const gstRate = watch('gstRate')
  const discountAmount = watch('discountAmount')
  const paymentLines = watch('payments')
  const selected = products.find(item => item.slug === productSlug)

  const rupee = (value: number | string) => Math.max(0, Math.min(999999, Math.round(Number(value) || 0)))
  const discountOf = (final: number, discount = Number(discountAmount) || 0) => Math.min(rupee(final), rupee(discount))
  const taxableOf = (final: number, discount = Number(discountAmount) || 0) => Math.max(0, rupee(final) - discountOf(final, discount))
  const gstOf = (final: number, enabled = Boolean(gstEnabled), rate = Number(gstRate) || 0, discount = Number(discountAmount) || 0) =>
    enabled && rate > 0 ? rupee((taxableOf(final, discount) * rate) / 100) : 0
  const payableOf = (final: number, enabled = Boolean(gstEnabled), rate = Number(gstRate) || 0, discount = Number(discountAmount) || 0) =>
    taxableOf(final, discount) + gstOf(final, enabled, rate, discount)
  const gstAmount = gstOf(finalPrice)
  const payable = payableOf(finalPrice)
  const discount = discountOf(finalPrice)
  const received = (paymentLines || []).reduce((sum, line) => sum + rupee(line?.amount || 0), 0)

  useEffect(() => {
    if (!open || !selected) return
    if (getValues('productId') !== selected.id) setValue('productId', selected.id)
    if (rupee(getValues('productPrice'))) return

    const price = rupee(Number(selected.rentPrice) || 0)

    if (!price) return

    setValue('productPrice', price)

    if (!rupee(getValues('finalPrice'))) {
      setValue('finalPrice', price)

      if (getValues('paymentOption') === 'unpaid') setValue('balanceAmount', payableOf(price))
    }
  }, [getValues, open, selected, setValue])

  useEffect(() => {
    if (!open || lines.length !== 1 || lines[0].price) return

    const outfit = products.find(item => item.slug === lines[0].productSlug)
    const price = rupee(Number(outfit?.rentPrice) || 0)

    if (!price) return

    setLines([{ ...lines[0], price }])
  }, [lines, open, products])

  const pricedOutfits = lines.map(line => {
    const outfit = products.find(item => item.slug === line.productSlug)

    return { name: outfit?.name || 'Outfit', price: rupee(line.price) }
  })
  const catalogTotal = pricedOutfits.reduce((sum, row) => sum + row.price, 0)
  const several = extras.length > 0

  const applyPaid = (paid: number, price: number) => {
    const nextPaid = Math.min(rupee(paid), rupee(price))
    const lines = (getValues('payments') || []).map(line => ({ method: line.method || 'Cash', amount: rupee(line.amount) }))
    const current = lines.reduce((sum, line) => sum + line.amount, 0)

    setValue('paidAmount', nextPaid)
    setValue('balanceAmount', Math.max(0, rupee(price) - nextPaid))

    if (!lines.length) {
      setValue('payments', [{ method: 'Cash', amount: nextPaid }])

      return
    }

    if (nextPaid === 0) {
      setValue('payments', lines.map(line => ({ ...line, amount: 0 })))

      return
    }

    if (current === nextPaid) return

    if (lines.length === 1 || current <= 0) {
      setValue('payments', lines.map((line, index) => ({ ...line, amount: index === 0 ? nextPaid : 0 })))

      return
    }

    let left = nextPaid

    setValue(
      'payments',
      lines.map((line, index) => {
        if (index === lines.length - 1) return { ...line, amount: left }

        const part = Math.min(left, Math.round((nextPaid * line.amount) / current))

        left -= part

        return { ...line, amount: part }
      })
    )
  }

  const fillPayment = (option: RentPaymentOption, final: number) => {
    const price = rupee(final)
    const current = (getValues('payments') || []).reduce((sum, line) => sum + rupee(line.amount), 0)

    if (option === 'full') {
      applyPaid(price, price)

      return
    }

    if (option === 'half') {
      applyPaid(Math.round(price / 2), price)

      return
    }

    if (option === 'unpaid') {
      applyPaid(0, price)

      return
    }

    applyPaid(current, price)
  }

  const markPaidOption = (paid: number, total: number) => {
    setValue('paymentOption', paid <= 0 ? 'unpaid' : paid >= total && total > 0 ? 'full' : paid === Math.round(total / 2) ? 'half' : 'custom')
  }

  const applyLines = (next: (OutfitPick & { key: string })[]) => {
    const first = next[0]
    const total = next.reduce((sum, line) => sum + rupee(line.price), 0)

    setLines(next)
    setExtras(next.slice(1))
    setValue('productId', first?.productId || '', { shouldValidate: true })
    setValue('productSlug', first?.productSlug || '', { shouldValidate: true, shouldTouch: true })
    setValue('size', first?.size || 'M', { shouldValidate: true })
    setValue('startDate', first?.startDate || '', { shouldValidate: Boolean(first?.startDate && first?.endDate), shouldDirty: true })
    setValue('endDate', first?.endDate || '', { shouldValidate: Boolean(first?.startDate && first?.endDate), shouldDirty: true })
    setValue('productPrice', total)
    setValue('finalPrice', total)
    setValue('updateCatalogPrice', false)
    fillPayment(getValues('paymentOption'), payableOf(total))
  }

  const savePick = (pick: OutfitPick & { key: string }) => {
    if (!pick.productSlug) {
      toast.error('Select an outfit')

      return
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(pick.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(pick.endDate) || pick.endDate < pick.startDate) {
      toast.error('Pick a pickup day and a return day')

      return
    }

    const outfit = products.find(item => item.id === pick.productId || item.slug === pick.productSlug)

    if (isSizeOutOfStock(outfit?.rentOutOfStock, pick.size)) {
      toast.error(`${pick.size} is out of stock`)

      return
    }

    const saved = pick.key && lines.some(line => line.key === pick.key) ? pick : { ...pick, key: `line-${Date.now()}` }
    const next = lines.some(line => line.key === saved.key) ? lines.map(line => (line.key === saved.key ? saved : line)) : [...lines, saved]

    applyLines(next)
    setPicker(null)
  }

  useEffect(() => {
    if (!productSlug || !size || !startDate || !endDate) {
      setLiveAvailability('')
      setDatesFree(true)

      return
    }

    const params = new URLSearchParams({ slug: productSlug, size, startDate, endDate })

    if (bookingId) params.set('excludeId', bookingId)

    fetch(`/api/web/rentals/availability?${params}`)
      .then(res => res.json())
      .then(json => {
        setDatesFree(json?.available !== false)
        setLiveAvailability(json.message || '')
      })
      .catch(() => {
        setDatesFree(true)
        setLiveAvailability('')
      })
  }, [bookingId, endDate, productSlug, size, startDate])

  const submit = handleSubmit(
    async values => {
      const outfit = products.find(item => item.id === values.productId || item.slug === values.productSlug)

      if (isSizeOutOfStock(outfit?.rentOutOfStock, values.size)) {
        toast.error(`${values.size} is out of stock`)

        return
      }

      if (!datesFree && values.status !== 'cancelled' && values.status !== 'returned') {
        toast.error(liveAvailability || 'Those dates are not free')

        return
      }

      const extraValues: RentFormValue[] = []
      const catalogPrices = [rupee(lines[0]?.price ?? values.finalPrice)]

      for (const [index, line] of extras.entries()) {
        const outfit = products.find(item => item.id === line.productId || item.slug === line.productSlug)
        const label = `Outfit ${index + 2}`

        if (!line.productSlug) {
          toast.error(`${label}: select an outfit`)

          return
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(line.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(line.endDate) || line.endDate < line.startDate) {
          toast.error(`${label}: pick a pickup day and a return day`)

          return
        }

        if (isSizeOutOfStock(outfit?.rentOutOfStock, line.size)) {
          toast.error(`${label}: ${line.size} is out of stock`)

          return
        }

        const overlaps = [
          { slug: values.productSlug, size: values.size, start: values.startDate, end: values.endDate },
          ...extras.slice(0, index).map(item => ({ slug: item.productSlug, size: item.size, start: item.startDate, end: item.endDate }))
        ].some(item => item.slug === line.productSlug && item.size === line.size && item.start <= line.endDate && line.startDate <= item.end)

        if (overlaps) {
          toast.error(`${label} uses the same outfit and size on overlapping dates`)

          return
        }

        if (values.status !== 'cancelled' && values.status !== 'returned') {
          const params = new URLSearchParams({ slug: line.productSlug, size: line.size, startDate: line.startDate, endDate: line.endDate })
          const check = await fetch(`/api/web/rentals/availability?${params}`).then(res => res.json()).catch(() => null)

          if (check?.available === false) {
            toast.error(check.message || `${label} is not free on those dates`)

            return
          }
        }

        catalogPrices.push(rupee(line.price))

        extraValues.push({
          ...values,
          id: '',
          productId: line.productId || outfit?.id || '',
          productSlug: line.productSlug,
          size: line.size,
          startDate: line.startDate,
          endDate: line.endDate,
          productPrice: 0,
          finalPrice: 0,
          paidAmount: 0,
          balanceAmount: 0,
          updateCatalogPrice: false
        })
      }

      const weightTotal = catalogPrices.reduce((sum, price) => sum + price, 0)
      const finalTotal = rupee(values.finalPrice)
      const discountTotal = Math.min(finalTotal, rupee(values.discountAmount))
      const taxableTotal = Math.max(0, finalTotal - discountTotal)
      const rate = Math.min(100, rupee(values.gstRate))
      const gstOn = Boolean(values.gstEnabled) && rate > 0
      const gstTotal = gstOn ? rupee((taxableTotal * rate) / 100) : 0
      const payableTotal = taxableTotal + gstTotal
      const enteredPayments = scaleRentPayments(cleanRentPayments(values.payments), payableTotal)
      const paidTotal = enteredPayments.reduce((sum, line) => sum + line.amount, 0)
      let finalLeft = finalTotal
      let discountLeft = discountTotal
      let gstLeft = gstTotal
      let paidLeft = paidTotal
      const shares = catalogPrices.map((price, index) => {
        if (index === catalogPrices.length - 1) return { final: finalLeft, discount: discountLeft, gst: gstLeft, paid: paidLeft }

        const finalPart = weightTotal ? Math.min(finalLeft, Math.round((finalTotal * price) / weightTotal)) : 0
        const discountPart = weightTotal ? Math.min(discountLeft, Math.round((discountTotal * price) / weightTotal)) : 0
        const gstPart = weightTotal ? Math.min(gstLeft, Math.round((gstTotal * price) / weightTotal)) : 0
        const paidPart = weightTotal ? Math.min(paidLeft, Math.round((paidTotal * price) / weightTotal)) : 0

        finalLeft -= finalPart
        discountLeft -= discountPart
        gstLeft -= gstPart
        paidLeft -= paidPart

        return { final: finalPart, discount: discountPart, gst: gstPart, paid: paidPart }
      })
      const paymentPool = enteredPayments.map(line => ({ ...line }))
      const takePayments = (need: number) => {
        const taken: RentPaymentLine[] = []
        let left = need

        paymentPool.forEach(line => {
          if (left <= 0 || line.amount <= 0) return

          const part = Math.min(line.amount, left)

          taken.push({ method: line.method, amount: part })
          line.amount -= part
          left -= part
        })

        return taken
      }
      const shareDue = (share: { final: number; discount: number; gst: number; paid: number }) => Math.max(0, share.final - share.discount + share.gst - share.paid)
      const firstPayments = extras.length ? takePayments(shares[0].paid) : enteredPayments
      const booked = extras.length
        ? {
            ...values,
            productPrice: catalogPrices[0],
            finalPrice: shares[0].final,
            discountAmount: shares[0].discount,
            gstEnabled: gstOn,
            gstRate: rate,
            gstAmount: shares[0].gst,
            payments: firstPayments,
            paymentMethod: rentPaymentMethodLabel(firstPayments),
            paidAmount: shares[0].paid,
            balanceAmount: shareDue(shares[0]),
            updateCatalogPrice: false
          }
        : {
            ...values,
            discountAmount: discountTotal,
            gstEnabled: gstOn,
            gstRate: rate,
            gstAmount: gstTotal,
            payments: enteredPayments,
            paymentMethod: rentPaymentMethodLabel(enteredPayments),
            paidAmount: paidTotal,
            balanceAmount: Math.max(0, payableTotal - paidTotal)
          }

      extraValues.forEach((row, index) => {
        const share = shares[index + 1]
        const payments = takePayments(share.paid)

        row.productPrice = catalogPrices[index + 1]
        row.finalPrice = share.final
        row.discountAmount = share.discount
        row.gstEnabled = gstOn
        row.gstRate = rate
        row.gstAmount = share.gst
        row.payments = payments
        row.paymentMethod = rentPaymentMethodLabel(payments)
        row.paidAmount = share.paid
        row.balanceAmount = shareDue(share)
      })

      setSaving(true)

      try {
        await onSave(booked, extraValues)
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

  const notice = liveAvailability || availability
  const fields = (
    <>
          <Controller
            name='status'
            control={control}
            render={({ field }) => (
              <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '240px 240px' }, gap: 1 }}>
                  {STATUS_CHOICES.map(choice => {
                    const selectedStatus = (field.value || 'booked') === choice.value

                    return (
                      <Button
                        key={choice.value}
                        type='button'
                        variant={selectedStatus ? 'contained' : 'tonal'}
                        color={selectedStatus ? 'primary' : 'secondary'}
                        aria-pressed={selectedStatus}
                        onClick={() => field.onChange(choice.value)}
                        sx={{ minHeight: 40 }}
                      >
                        {choice.label}
                      </Button>
                    )
                  })}
                </Box>
                {errors.status ? (
                  <Typography variant='caption' color='error.main'>
                    {errors.status.message}
                  </Typography>
                ) : null}
              </>
            )}
          />

          {notice ? (
            <Typography color={datesFree ? 'success.main' : 'error.main'}>{notice}</Typography>
          ) : null}

          <div className='flex items-center justify-between gap-3'>
            <div>
              <Typography variant='h6'>Outfits</Typography>
              <Typography variant='body2' color='text.secondary'>
                Add each outfit from the list. Change that outfit&apos;s price in the table.
              </Typography>
            </div>
            {!initial.id ? (
              <Button
                type='button'
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() =>
                  setPicker({
                    key: '',
                    productId: '',
                    productSlug: '',
                    size: size || 'M',
                    startDate,
                    endDate,
                    price: 0
                  })
                }
              >
                Add outfit
              </Button>
            ) : null}
          </div>
          {errors.productSlug ? <Typography color='error'>{errors.productSlug.message}</Typography> : null}
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Outfit</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell width={140}>Price</TableCell>
                  <TableCell width={96} />
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length ? (
                  lines.map(line => {
                    const item = products.find(row => row.slug === line.productSlug)

                    return (
                      <TableRow key={line.key} hover>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {item?.imageUrl ? (
                              <img src={item.imageUrl} alt='' width={44} height={58} className='rounded object-cover' style={{ width: 44, height: 58, objectFit: 'cover' }} />
                            ) : (
                              <div className='flex items-center justify-center rounded bg-actionHover' style={{ width: 44, height: 58 }}>
                                <i className='tabler-shirt' />
                              </div>
                            )}
                            <div className='flex flex-col gap-1'>
                              <Chip size='small' variant='tonal' label={`#${productNumber(item)}`} sx={{ width: 'fit-content' }} />
                              <Typography variant='body2' sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {item?.name || 'Outfit'}
                              </Typography>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{line.size}</TableCell>
                        <TableCell>{line.startDate && line.endDate ? `${line.startDate} → ${line.endDate}` : '—'}</TableCell>
                        <TableCell>
                          <CustomTextField
                            size='small'
                            type='number'
                            value={line.price}
                            onChange={event => {
                              const price = rupee(event.target.value)

                              applyLines(lines.map(row => (row.key === line.key ? { ...row, price } : row)))
                            }}
                            slotProps={{ htmlInput: { min: 0, max: 999999, 'aria-label': 'Outfit price' } }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell align='right'>
                          <IconButton type='button' aria-label='Change outfit' onClick={() => setPicker(line)}>
                            <i className='tabler-pencil' />
                          </IconButton>
                          {!initial.id ? (
                            <IconButton type='button' color='error' aria-label='Remove outfit' onClick={() => applyLines(lines.filter(row => row.key !== line.key))}>
                              <i className='tabler-trash' />
                            </IconButton>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography color='text.secondary'>No outfits yet. Add an outfit to start this booking.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <RentProductDialog open={Boolean(picker)} products={products} initial={picker} onClose={() => setPicker(null)} onSave={savePick} />

          <Grid container spacing={4}>
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
            <RentCustomerFields control={control} errors={errors} setValue={setValue} />
            <Grid size={{ xs: 12 }}>
              <Typography variant='h6'>Payment</Typography>
              <Typography variant='body2' color='text.secondary'>
                {several
                  ? 'The prices below are the total of every selected outfit. Half, full, and the amount received are calculated on that total.'
                  : 'Change the outfit price or the final price for this booking. Half payment fills half now and leaves the rest to collect. You can type any received amount and any amount still left.'}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Controller
                  name='gstEnabled'
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      sx={{ m: 0, height: 40 }}
                      control={
                        <Checkbox
                          sx={{ p: 1 }}
                          checked={Boolean(field.value)}
                          onChange={event => {
                            const enabled = event.target.checked

                            field.onChange(enabled)
                            fillPayment(watch('paymentOption'), payableOf(rupee(finalPrice), enabled, Number(watch('gstRate')) || 0))
                          }}
                        />
                      }
                      label='Apply GST'
                    />
                  )}
                />
                <Controller
                  name='gstRate'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      size='small'
                      type='number'
                      value={field.value}
                      onChange={event => {
                        const rate = Math.min(100, rupee(event.target.value))

                        field.onChange(rate)

                        if (watch('gstEnabled')) fillPayment(watch('paymentOption'), payableOf(rupee(finalPrice), true, rate))
                      }}
                      error={Boolean(errors.gstRate)}
                      helperText={errors.gstRate?.message}
                      sx={{ width: 112 }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position='end' sx={{ color: 'text.secondary' }}>
                              %
                            </InputAdornment>
                          )
                        },
                        htmlInput: { min: 0, max: 100, 'aria-label': 'GST percent' }
                      }}
                    />
                  )}
                />
              </Box>
              {several && pricedOutfits.length ? (
                <Box sx={{ mt: 1.5, display: 'grid', gap: 0.75 }}>
                  {pricedOutfits.map((row, index) => (
                    <Box key={`${row.name}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                      <Typography variant='body2'>{row.name}</Typography>
                      <Typography variant='body2'>{formatPrice(row.price)}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, pt: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography fontWeight={700}>Total</Typography>
                    <Typography fontWeight={700}>{formatPrice(catalogTotal)}</Typography>
                  </Box>
                </Box>
              ) : null}
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='productPrice'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='number'
                    label={several ? 'Total product price (₹)' : 'Product price (₹)'}
                    value={field.value}
                    onChange={event => {
                      const next = rupee(event.target.value)
                      const previous = rupee(field.value)

                      field.onChange(next)
                      setValue('updateCatalogPrice', !several)

                      if (rupee(finalPrice) === previous) {
                        const discountNext = Math.min(rupee(getValues('discountAmount')), next)

                        if (discountNext !== rupee(getValues('discountAmount'))) setValue('discountAmount', discountNext)

                        setValue('finalPrice', next)
                        fillPayment(watch('paymentOption'), payableOf(next, Boolean(getValues('gstEnabled')), Number(getValues('gstRate')) || 0, discountNext))
                      }
                    }}
                    error={Boolean(errors.productPrice)}
                    helperText={errors.productPrice?.message || (several ? 'Total rent of every selected outfit' : 'Changing this also updates the outfit rent price')}
                    slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='finalPrice'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='number'
                    label={several ? 'Total final price (₹)' : 'Final price (₹)'}
                    value={field.value}
                    onChange={event => {
                      const next = rupee(event.target.value)

                      const discountNext = Math.min(rupee(getValues('discountAmount')), next)

                      if (discountNext !== rupee(getValues('discountAmount'))) setValue('discountAmount', discountNext)

                      field.onChange(next)
                      fillPayment(watch('paymentOption'), payableOf(next, Boolean(getValues('gstEnabled')), Number(getValues('gstRate')) || 0, discountNext))
                    }}
                    error={Boolean(errors.finalPrice)}
                    helperText={errors.finalPrice?.message || (several ? 'Rent for every selected outfit, before discount and GST' : 'Rent for this booking, before discount and GST')}
                    slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='discountAmount'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='number'
                    label='Discount (₹)'
                    value={field.value}
                    onChange={event => {
                      const next = Math.min(rupee(finalPrice), rupee(event.target.value))

                      field.onChange(next)
                      fillPayment(getValues('paymentOption'), payableOf(rupee(finalPrice), Boolean(gstEnabled), Number(gstRate) || 0, next))
                    }}
                    error={Boolean(errors.discountAmount)}
                    helperText={errors.discountAmount?.message || 'Taken off the rent before GST'}
                    slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='paymentOption'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    select
                    fullWidth
                    label='Payment'
                    value={field.value}
                    onChange={event => {
                      const option = event.target.value as RentPaymentOption

                      field.onChange(option)
                      fillPayment(option, payable)
                    }}
                    error={Boolean(errors.paymentOption)}
                    helperText={errors.paymentOption?.message}
                  >
                    {RENT_PAYMENT_OPTIONS.map(item => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.label}
                      </MenuItem>
                    ))}
                  </CustomTextField>
                )}
              />
            </Grid>
            {paymentFields.fields.map((item, index) => (
              <Grid key={item.id} size={{ xs: 12 }}>
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name={`payments.${index}.method`}
                      control={control}
                      render={({ field }) => (
                        <CustomTextField select fullWidth label='Paid by' {...field}>
                          {RENT_PAYMENT_METHODS.map(method => (
                            <MenuItem key={method} value={method}>
                              {method}
                            </MenuItem>
                          ))}
                        </CustomTextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Controller
                          name={`payments.${index}.amount`}
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              fullWidth
                              type='number'
                              label='Amount (₹)'
                              value={field.value}
                              onChange={event => {
                                const lines = (getValues('payments') || []).map(line => ({ method: line.method || 'Cash', amount: rupee(line.amount) }))

                                if (!lines[index]) lines[index] = { method: 'Cash', amount: 0 }

                                const others = lines.reduce((sum, line, lineIndex) => sum + (lineIndex === index ? 0 : line.amount), 0)
                                const amount = Math.min(rupee(event.target.value), Math.max(0, payable - others))

                                lines[index] = { ...lines[index], amount }
                                const paid = lines.reduce((sum, line) => sum + line.amount, 0)

                                field.onChange(amount)
                                setValue('paidAmount', paid)
                                setValue('balanceAmount', Math.max(0, payable - paid))
                                markPaidOption(paid, payable)
                              }}
                              slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                            />
                          )}
                        />
                      </Box>
                      {paymentFields.fields.length > 1 ? (
                        <IconButton
                          type='button'
                          aria-label='Remove payment'
                          onClick={() => {
                            const lines = (getValues('payments') || []).filter((_, lineIndex) => lineIndex !== index)
                            const next = lines.length ? lines : [{ method: 'Cash', amount: 0 }]
                            const paid = next.reduce((sum, line) => sum + rupee(line.amount), 0)

                            setValue('payments', next)
                            setValue('paidAmount', Math.min(paid, payable))
                            setValue('balanceAmount', Math.max(0, payable - paid))
                            markPaidOption(Math.min(paid, payable), payable)
                          }}
                          sx={{
                            mb: 0.5,
                            flexShrink: 0,
                            color: 'error.main',
                            bgcolor: 'var(--mui-palette-error-lightOpacity)',
                            '&:hover': { bgcolor: 'var(--mui-palette-error-mainOpacity)' }
                          }}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      ) : null}
                    </Box>
                  </Grid>
                </Grid>
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <Button
                type='button'
                variant='tonal'
                disabled={paymentFields.fields.length >= 6}
                onClick={() => {
                  const lines = (getValues('payments') || []).map(line => ({ method: line.method || 'Cash', amount: rupee(line.amount) }))

                  if (lines.length >= 6) return

                  const used = new Set(lines.map(line => line.method))
                  const method = RENT_PAYMENT_METHODS.find(item => !used.has(item)) || 'UPI'
                  const next = [...lines, { method, amount: 0 }]

                  if (lines.length === 1 && lines[0].amount > 0) {
                    const first = Math.round(lines[0].amount / 2)

                    next[0] = { ...lines[0], amount: first }
                    next[1] = { method, amount: lines[0].amount - first }
                  }

                  setValue('payments', next)
                }}
              >
                Add payment
              </Button>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
                Add a second payment when the customer pays by more than one method, for example half cash and half UPI.
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Controller
                name='balanceAmount'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    type='number'
                    label='Left to collect (₹)'
                    value={field.value}
                    onChange={event => {
                      const next = Math.min(rupee(event.target.value), payable)
                      const paid = Math.max(0, payable - next)

                      field.onChange(next)
                      applyPaid(paid, payable)
                      markPaidOption(paid, payable)
                    }}
                    error={Boolean(errors.balanceAmount)}
                    helperText={
                      errors.balanceAmount?.message ||
                      (received + rupee(balanceAmount) === payable
                        ? 'This is what is still to be collected'
                        : `Received plus left is ${formatPrice(received + rupee(balanceAmount))}. Total is ${formatPrice(payable)}.`)
                    }
                    slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)' },
                  gap: 2,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'action.hover'
                }}
              >
                <Box>
                  <Typography variant='body2' color='text.secondary'>Subtotal</Typography>
                  <Typography fontWeight={700}>{formatPrice(rupee(finalPrice))}</Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>Discount</Typography>
                  <Typography fontWeight={700}>{formatPrice(discount)}</Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>GST{gstEnabled && gstRate ? ` (${gstRate}%)` : ''}</Typography>
                  <Typography fontWeight={700}>{formatPrice(gstAmount)}</Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>Total</Typography>
                  <Typography fontWeight={700}>{formatPrice(payable)}</Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>Received</Typography>
                  <Typography fontWeight={700}>{formatPrice(received)}</Typography>
                </Box>
                <Box>
                  <Typography variant='body2' color='text.secondary'>Balance</Typography>
                  <Typography fontWeight={700}>{formatPrice(Math.max(0, payable - received))}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Controller
                name='paymentNote'
                control={control}
                render={({ field }) => (
                  <CustomTextField
                    fullWidth
                    label='Payment note'
                    placeholder='Example: ₹2,000 on UPI, rest in cash at pickup'
                    {...field}
                    error={Boolean(errors.paymentNote)}
                    helperText={errors.paymentNote?.message || 'Optional. Add the manual payment detail here.'}
                  />
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
    </>
  )
  const actions = (
    <>
      <Button type='button' onClick={onClose} disabled={saving}>
        Cancel
      </Button>
      <Button type='submit' variant='contained' disabled={saving}>
        {saving ? 'Saving...' : initial.id ? 'Save booking' : extras.length ? `Book ${extras.length + 1} outfits` : 'Book rent'}
      </Button>
    </>
  )

  if (embedded) {
    return (
      <form onSubmit={submit} className='flex flex-col gap-5'>
        <div>
          <Typography variant='h4'>{initial.id ? 'Edit rent booking' : 'Book rent'}</Typography>
          <Typography color='text.secondary'>Add each outfit from the popup. Change one outfit&apos;s price in the table, then save the booking.</Typography>
        </div>
        {fields}
        <div className='flex justify-end gap-3'>{actions}</div>
      </form>
    )
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <form onSubmit={submit}>
        <DialogTitle>{initial.id ? 'Edit rent booking' : 'Book rent'}</DialogTitle>
        <DialogContent className='flex flex-col gap-5' sx={{ pt: 2 }}>
          {fields}
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </form>
    </Dialog>
  )
}

export default RentFormDialog
