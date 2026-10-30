'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import dynamic from 'next/dynamic'
import { useParams, useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
import { RentCustomerFields } from '@admin/views/RentCustomerFields'
import SaleProductDialog, { type SalePick } from '@admin/views/SaleOutfitBlock'
import { saleOrderBill, type SaleRow } from '@admin/views/saleBill'
import type { RentBill } from '@admin/views/rentBill'
import CustomTextField from '@core/components/mui/TextField'
import { formatPrice } from '@web/data/catalog'
import { isSizeOutOfStock, stockCount } from '@/libs/rent-sizes'
import {
  RENT_PAYMENT_METHODS,
  RENT_PAYMENT_OPTIONS,
  cleanRentPayments,
  rentPaymentMethodLabel,
  scaleRentPayments,
  type RentPaymentLine,
  type RentPaymentOption
} from '@/libs/rent-payment'

const RentBillDialog = dynamic(() => import('@admin/views/RentBillDialog'), { ssr: false })

type SaleProduct = {
  id: string
  slug: string
  name?: string
  title?: string
  imageUrl?: string
  image?: string
  sellingPrice?: number
  sizes?: string[]
  saleSizeStock?: Record<string, number>
  saleOutOfStock?: string[]
}

type SaleFormValue = {
  productSlug: string
  size: string
  quantity: number
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  productPrice: number
  finalPrice: number
  discountAmount: number
  gstEnabled: boolean
  gstRate: number
  paymentOption: RentPaymentOption
  paymentNote: string
  balanceAmount: number
  payments: RentPaymentLine[]
}

const emptySale: SaleFormValue = {
  productSlug: '',
  size: '',
  quantity: 1,
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  notes: '',
  productPrice: 0,
  finalPrice: 0,
  discountAmount: 0,
  gstEnabled: false,
  gstRate: 5,
  paymentOption: 'unpaid',
  paymentNote: '',
  balanceAmount: 0,
  payments: [{ method: 'Cash', amount: 0 }]
}

const productNumber = (item?: { imageUrl?: string; image?: string; id?: string; slug?: string }) => {
  const fromImage = (item?.imageUrl || item?.image || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (item?.id || item?.slug || '00').slice(-4).toUpperCase()
}

const rupee = (value: unknown) => {
  const next = Math.round(Number(value) || 0)

  return Number.isFinite(next) ? Math.max(0, next) : 0
}

const SaleFormPage = () => {
  const params = useParams()
  const router = useRouter()
  const lang = String(params.lang || 'en')
  const [products, setProducts] = useState<SaleProduct[]>([])
  const [lines, setLines] = useState<SalePick[]>([])
  const [picker, setPicker] = useState<SalePick | null>(null)
  const [saving, setSaving] = useState(false)
  const [bill, setBill] = useState<RentBill | null>(null)
  const { control, handleSubmit, setValue, watch, getValues, formState } = useForm<SaleFormValue>({ defaultValues: emptySale })
  const values = watch()
  const discount = Math.min(rupee(values.finalPrice), rupee(values.discountAmount))
  const taxable = Math.max(0, rupee(values.finalPrice) - discount)
  const gst = values.gstEnabled && values.gstRate > 0 ? rupee((taxable * values.gstRate) / 100) : 0
  const payable = taxable + gst
  const received = values.payments.reduce((sum, row) => sum + rupee(row.amount), 0)
  const left = Math.max(0, payable - Math.min(payable, received))

  useEffect(() => {
    let live = true

    void Promise.all([
      adminApi<{ data?: SaleProduct[] }>('/api/admin/products?limit=100&listingType=sale', undefined, { silentSuccess: true }),
      adminApi<{ data?: SaleProduct[] }>('/api/admin/products?limit=100&listingType=both', undefined, { silentSuccess: true })
    ]).then(([sale, both]) => {
      if (!live) return

      const rows = [...(sale.data?.data || []), ...(both.data?.data || [])]
      const seen = new Set<string>()

      setProducts(rows.filter(item => (seen.has(item.slug) ? false : seen.add(item.slug))))
    })

    fetch('/api/web/gst')
      .then(res => res.json())
      .then(json => {
        const rate = Math.round(Number(json?.rate) || 0)

        if (live && rate > 0 && rate <= 100) setValue('gstRate', rate)
      })
      .catch(() => undefined)

    return () => {
      live = false
    }
  }, [setValue])

  const dueFor = (final = values.finalPrice, enabled = values.gstEnabled, rate = values.gstRate, off = values.discountAmount) => {
    const line = rupee(final)
    const discountValue = Math.min(line, rupee(off))
    const tax = enabled && rate > 0 ? rupee(((line - discountValue) * rate) / 100) : 0

    return Math.max(0, line - discountValue + tax)
  }

  const applyPaid = (amount: number, total = payable) => {
    const next = Math.min(total, rupee(amount))
    const rows = getValues('payments')
    const current = rows.length ? rows : [{ method: 'Cash', amount: 0 }]
    const sum = current.reduce((totalPaid, row) => totalPaid + rupee(row.amount), 0)
    let remaining = next
    const payments =
      current.length === 1
        ? [{ ...current[0], amount: next }]
        : current.map((row, index) => {
            if (next <= 0) return { ...row, amount: 0 }
            if (index === current.length - 1) return { ...row, amount: remaining }

            const weight = sum > 0 ? row.amount : 1
            const base = sum > 0 ? sum : current.length
            const part = Math.min(remaining, Math.round((next * weight) / base))

            remaining -= part

            return { ...row, amount: part }
          })

    setValue('payments', payments)
    setValue('balanceAmount', Math.max(0, total - next))
    setValue('paymentOption', next <= 0 ? 'unpaid' : next === total ? 'full' : next === Math.round(total / 2) ? 'half' : 'custom')
  }

  const fillPayment = (option: RentPaymentOption, total: number) => {
    const paidNow = (getValues('payments') || []).reduce((sum, line) => sum + rupee(line.amount), 0)

    if (option === 'full') applyPaid(total, total)
    else if (option === 'half') applyPaid(Math.round(total / 2), total)
    else if (option === 'unpaid') applyPaid(0, total)
    else applyPaid(paidNow, total)
  }

  const pricedOutfits = useMemo(
    () =>
      lines.flatMap(line => {
        const item = products.find(row => row.slug === line.productSlug)

        if (!item) return []

        return [{ name: item.name || item.title || 'Outfit', price: rupee(item.sellingPrice) * Math.max(1, rupee(line.quantity) || 1) }]
      }),
    [lines, products]
  )
  const catalogTotal = pricedOutfits.reduce((sum, row) => sum + row.price, 0)
  const several = lines.length > 1

  useEffect(() => {
    if (!pricedOutfits.length) return

    setValue('productPrice', catalogTotal)
    setValue('finalPrice', catalogTotal)
    setValue('discountAmount', 0)
    fillPayment(getValues('paymentOption'), dueFor(catalogTotal, getValues('gstEnabled'), Number(getValues('gstRate')) || 0, 0))
    // Prices follow the selected outfits. A manual final price stays until the outfit list changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogTotal])

  const savePick = (pick: SalePick) => {
    if (!pick.productSlug) {
      toast.error('Select an outfit')

      return
    }

    if (!pick.size) {
      toast.error('Select a size')

      return
    }

    const item = products.find(row => row.slug === pick.productSlug)
    const leftCount = item ? stockCount(item.saleSizeStock, pick.size) : null

    if (!item || isSizeOutOfStock(item.saleOutOfStock, pick.size) || leftCount === 0) {
      toast.error(`${pick.size} is out of stock`)

      return
    }

    setLines(current => {
      const next = { ...pick, key: pick.key || `line-${Date.now()}`, quantity: Math.max(1, Math.min(20, rupee(pick.quantity) || 1)) }

      return current.some(row => row.key === next.key) ? current.map(row => (row.key === next.key ? next : row)) : [...current, next]
    })
    setPicker(null)
  }

  const onSave = handleSubmit(async form => {
    if (!lines.length) {
      toast.error('Select a product')

      return
    }

    const picks = lines.map(line => {
      const item = products.find(row => row.slug === line.productSlug)
      const count = Math.max(1, Math.min(20, rupee(line.quantity) || 1))

      return { productSlug: line.productSlug, size: line.size, quantity: count, catalog: rupee(item?.sellingPrice) * count }
    })

    for (const [index, pick] of picks.entries()) {
      const label = picks.length > 1 ? `Outfit ${index + 1}` : 'This outfit'
      const item = products.find(row => row.slug === pick.productSlug)

      if (!pick.productSlug || !item) {
        toast.error(`${label}: select an outfit`)

        return
      }

      if (!pick.size) {
        toast.error(`${label}: select a size`)

        return
      }

      const leftCount = stockCount(item.saleSizeStock, pick.size)
      const used = picks.slice(0, index).reduce((sum, row) => sum + (row.productSlug === pick.productSlug && row.size === pick.size ? row.quantity : 0), 0)

      if (isSizeOutOfStock(item.saleOutOfStock, pick.size) || (leftCount !== null && used + pick.quantity > leftCount)) {
        toast.error(leftCount ? `${label}: only ${leftCount} left in size ${pick.size}` : `${label}: ${pick.size} is out of stock`)

        return
      }
    }

    const line = rupee(form.finalPrice)
    const off = Math.min(line, rupee(form.discountAmount))
    const base = Math.max(0, line - off)
    const rate = Math.min(100, rupee(form.gstRate))
    const gstOn = Boolean(form.gstEnabled) && rate > 0
    const tax = gstOn ? rupee((base * rate) / 100) : 0
    const due = base + tax
    const payments = scaleRentPayments(cleanRentPayments(form.payments), due)
    const paid = payments.reduce((sum, row) => sum + row.amount, 0)
    const weightTotal = picks.reduce((sum, row) => sum + row.catalog, 0)
    let finalLeft = line
    let discountLeft = off
    let gstLeft = tax
    let paidLeft = paid
    const shares = picks.map((pick, index) => {
      if (index === picks.length - 1) return { final: finalLeft, discount: discountLeft, gst: gstLeft, paid: paidLeft }

      const weight = weightTotal ? pick.catalog : 1
      const baseWeight = weightTotal || picks.length
      const finalPart = Math.min(finalLeft, Math.round((line * weight) / baseWeight))
      const discountPart = Math.min(discountLeft, Math.round((off * weight) / baseWeight))
      const gstPart = Math.min(gstLeft, Math.round((tax * weight) / baseWeight))
      const paidPart = Math.min(paidLeft, Math.round((paid * weight) / baseWeight))

      finalLeft -= finalPart
      discountLeft -= discountPart
      gstLeft -= gstPart
      paidLeft -= paidPart

      return { final: finalPart, discount: discountPart, gst: gstPart, paid: paidPart }
    })
    const pool = payments.map(row => ({ ...row }))
    const takePayments = (need: number) => {
      const taken: RentPaymentLine[] = []
      let leftToTake = need

      pool.forEach(row => {
        if (leftToTake <= 0 || row.amount <= 0) return

        const part = Math.min(row.amount, leftToTake)

        taken.push({ method: row.method, amount: part })
        row.amount -= part
        leftToTake -= part
      })

      return taken
    }
    const items = picks.map((pick, index) => {
      const share = shares[index]
      const sharePayments = takePayments(share.paid)

      return {
        productSlug: pick.productSlug,
        size: pick.size,
        quantity: pick.quantity,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        notes: form.notes,
        productPrice: pick.catalog,
        finalPrice: share.final,
        discountAmount: share.discount,
        gstEnabled: gstOn,
        gstRate: rate,
        gstAmount: share.gst,
        paymentOption: form.paymentOption,
        paymentNote: form.paymentNote,
        payments: sharePayments,
        paymentMethod: rentPaymentMethodLabel(sharePayments),
        paidAmount: share.paid,
        balanceAmount: Math.max(0, share.final - share.discount + share.gst - share.paid)
      }
    })

    setSaving(true)

    const result = await adminApi<{ data?: SaleRow[] }>(
      '/api/admin/sales',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      },
      { successMessage: items.length > 1 ? `${items.length} outfits sold` : 'Outfit sold' }
    )

    setSaving(false)

    const saved = result.data?.data

    if (!result.ok || !saved?.length) return

    setBill(saleOrderBill(saved))
    setLines([])
  })

  return (
    <>
      <Card sx={{ width: '100%' }}>
        <CardContent>
          <form onSubmit={onSave} className='flex flex-col gap-5'>
            <div>
              <Typography variant='h4'>Sell outfit</Typography>
              <Typography color='text.secondary'>Add each outfit from the product list. The table is the sale, and the bill opens after it is saved.</Typography>
            </div>

            <div className='flex items-center justify-between gap-3'>
              <Typography variant='h6'>Products</Typography>
              <Button type='button' variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => setPicker({ key: '', productSlug: '', size: '', quantity: 1 })}>
                Select product
              </Button>
            </div>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Outfit</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell width={110}>Qty</TableCell>
                    <TableCell align='right'>Price</TableCell>
                    <TableCell align='right'>Amount</TableCell>
                    <TableCell width={96} />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length ? (
                    lines.map(line => {
                      const item = products.find(row => row.slug === line.productSlug)
                      const photo = item?.imageUrl || item?.image
                      const price = rupee(item?.sellingPrice)
                      const amount = price * Math.max(1, line.quantity || 1)

                      return (
                        <TableRow key={line.key} hover>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              {photo ? (
                                <img src={photo} alt='' width={44} height={58} className='rounded object-cover' style={{ width: 44, height: 58, objectFit: 'cover' }} />
                              ) : (
                                <div className='flex items-center justify-center rounded bg-actionHover' style={{ width: 44, height: 58 }}>
                                  <i className='tabler-shirt' />
                                </div>
                              )}
                              <div className='flex flex-col gap-1'>
                                <Chip size='small' variant='tonal' label={`#${productNumber(item)}`} sx={{ width: 'fit-content' }} />
                                <Typography variant='body2' sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {item?.name || item?.title || 'Outfit'}
                                </Typography>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{line.size}</TableCell>
                          <TableCell>
                            <CustomTextField
                              size='small'
                              type='number'
                              value={line.quantity}
                              onChange={event => {
                                const quantity = Math.max(1, Math.min(20, rupee(Number(event.target.value)) || 1))

                                setLines(current => current.map(row => (row.key === line.key ? { ...row, quantity } : row)))
                              }}
                              slotProps={{ htmlInput: { min: 1, max: 20, 'aria-label': 'Quantity' } }}
                              sx={{ width: 88 }}
                            />
                          </TableCell>
                          <TableCell align='right'>{formatPrice(price)}</TableCell>
                          <TableCell align='right'>{formatPrice(amount)}</TableCell>
                          <TableCell align='right'>
                            <IconButton type='button' aria-label='Change product' onClick={() => setPicker(line)}>
                              <i className='tabler-pencil' />
                            </IconButton>
                            <IconButton type='button' color='error' aria-label='Remove product' onClick={() => setLines(current => current.filter(row => row.key !== line.key))}>
                              <i className='tabler-trash' />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography color='text.secondary'>No products yet. Select a product to add it to this sale.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Grid container spacing={4}>
              <RentCustomerFields control={control} errors={formState.errors} setValue={setValue} />
              <Grid size={{ xs: 12 }}>
                <Typography variant='h6'>Payment</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {several
                    ? 'The prices below are the total of every selected outfit. Half, full, and the amount received are calculated on that total.'
                    : 'Change the outfit price or the final price for this sale. Half payment fills half now and leaves the rest to collect. You can type any received amount and any amount still left.'}
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
                              fillPayment(getValues('paymentOption'), dueFor(getValues('finalPrice'), enabled, Number(getValues('gstRate')) || 0, getValues('discountAmount')))
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

                          if (getValues('gstEnabled')) {
                            fillPayment(getValues('paymentOption'), dueFor(getValues('finalPrice'), true, rate, getValues('discountAmount')))
                          }
                        }}
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

                        if (rupee(getValues('finalPrice')) === previous) {
                          const discountNext = Math.min(rupee(getValues('discountAmount')), next)

                          if (discountNext !== rupee(getValues('discountAmount'))) setValue('discountAmount', discountNext)

                          setValue('finalPrice', next)
                          fillPayment(getValues('paymentOption'), dueFor(next, getValues('gstEnabled'), Number(getValues('gstRate')) || 0, discountNext))
                        }
                      }}
                      helperText={several ? 'Total sale price of every selected outfit' : 'Selling price for this quantity'}
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
                        fillPayment(getValues('paymentOption'), dueFor(next, getValues('gstEnabled'), Number(getValues('gstRate')) || 0, discountNext))
                      }}
                      helperText={several ? 'Price for every selected outfit, before discount and GST' : 'Price for this sale, before discount and GST'}
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
                        const next = Math.min(rupee(getValues('finalPrice')), rupee(event.target.value))

                        field.onChange(next)
                        fillPayment(getValues('paymentOption'), dueFor(getValues('finalPrice'), getValues('gstEnabled'), Number(getValues('gstRate')) || 0, next))
                      }}
                      helperText='Taken off the price before GST'
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
              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: 'grid', gap: 2 }}>
                  {values.payments.map((row, index) => (
                    <Box key={`${row.method}-${index}`} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr auto', sm: '1fr 1fr auto' }, gap: { xs: 2, sm: 4 }, alignItems: 'end' }}>
                      <CustomTextField
                        select
                        fullWidth
                        label='Paid by'
                        sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}
                        value={row.method}
                        onChange={event => {
                          setValue(
                            'payments',
                            values.payments.map((item, itemIndex) => (itemIndex === index ? { ...item, method: event.target.value } : item))
                          )
                        }}
                      >
                        {RENT_PAYMENT_METHODS.map(method => (
                          <MenuItem key={method} value={method}>
                            {method}
                          </MenuItem>
                        ))}
                      </CustomTextField>
                      <CustomTextField
                        fullWidth
                        type='number'
                        label='Amount (₹)'
                        value={row.amount}
                        onChange={event => {
                          const lines = values.payments.map(line => ({ method: line.method || 'Cash', amount: rupee(line.amount) }))
                          const others = lines.reduce((sum, line, lineIndex) => sum + (lineIndex === index ? 0 : line.amount), 0)
                          const amount = Math.min(rupee(Number(event.target.value)), Math.max(0, payable - others))

                          lines[index] = { ...lines[index], amount }
                          const paid = lines.reduce((sum, line) => sum + line.amount, 0)

                          setValue('payments', lines)
                          setValue('balanceAmount', Math.max(0, payable - paid))
                          setValue('paymentOption', paid <= 0 ? 'unpaid' : paid === payable ? 'full' : paid === Math.round(payable / 2) ? 'half' : 'custom')
                        }}
                        slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                      />
                      {values.payments.length > 1 ? (
                        <IconButton
                          type='button'
                          aria-label='Remove payment'
                          onClick={() => {
                            const next = values.payments.filter((_, itemIndex) => itemIndex !== index)
                            const rows = next.length ? next : [{ method: 'Cash', amount: 0 }]
                            const paid = rows.reduce((sum, line) => sum + rupee(line.amount), 0)

                            setValue('payments', rows)
                            setValue('balanceAmount', Math.max(0, payable - paid))
                            setValue('paymentOption', paid <= 0 ? 'unpaid' : paid === payable ? 'full' : paid === Math.round(payable / 2) ? 'half' : 'custom')
                          }}
                          sx={{
                            mb: 0.5,
                            justifySelf: 'start',
                            color: 'error.main',
                            bgcolor: 'var(--mui-palette-error-lightOpacity)',
                            '&:hover': { bgcolor: 'var(--mui-palette-error-mainOpacity)' }
                          }}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      ) : null}
                    </Box>
                  ))}
                  <Box>
                    <Button
                      type='button'
                      variant='tonal'
                      disabled={values.payments.length >= 6}
                      onClick={() => {
                        const lines = values.payments.map(line => ({ method: line.method || 'Cash', amount: rupee(line.amount) }))
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
                    <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                      Add a second payment when the customer pays by more than one method, for example half cash and half UPI.
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <CustomTextField
                  fullWidth
                  type='number'
                  label='Left to collect (₹)'
                  value={values.balanceAmount}
                  onChange={event => {
                    const next = Math.min(rupee(Number(event.target.value)), payable)

                    applyPaid(Math.max(0, payable - next), payable)
                  }}
                  helperText='This is what is still to be collected'
                  slotProps={{ htmlInput: { min: 0, max: 999999 } }}
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
                    <Typography fontWeight={700}>{formatPrice(rupee(values.finalPrice))}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>Discount</Typography>
                    <Typography fontWeight={700}>{formatPrice(discount)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>GST{values.gstEnabled && values.gstRate ? ` (${values.gstRate}%)` : ''}</Typography>
                    <Typography fontWeight={700}>{formatPrice(gst)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>Total</Typography>
                    <Typography fontWeight={700}>{formatPrice(payable)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>Received</Typography>
                    <Typography fontWeight={700}>{formatPrice(Math.min(payable, received))}</Typography>
                  </Box>
                  <Box>
                    <Typography variant='body2' color='text.secondary'>Balance</Typography>
                    <Typography fontWeight={700}>{formatPrice(left)}</Typography>
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
                      placeholder='Example: ₹2,000 on UPI, rest in cash'
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={field.value ?? ''}
                      helperText='Optional. Add the manual payment detail here.'
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Controller
                  name='notes'
                  control={control}
                  render={({ field }) => (
                    <CustomTextField
                      fullWidth
                      multiline
                      minRows={2}
                      label='Notes'
                      name={field.name}
                      inputRef={field.ref}
                      onBlur={field.onBlur}
                      onChange={field.onChange}
                      value={field.value ?? ''}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <div className='flex justify-end gap-3'>
              <Button type='button' onClick={() => router.push(`/${lang}/store/sales`)} disabled={saving}>
                Cancel
              </Button>
              <Button type='submit' variant='contained' disabled={saving}>
                {saving ? 'Saving...' : lines.length > 1 ? `Sell ${lines.length} outfits` : 'Sell outfit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <SaleProductDialog open={Boolean(picker)} products={products} initial={picker} onClose={() => setPicker(null)} onSave={savePick} />
      <RentBillDialog
        open={Boolean(bill)}
        bill={bill}
        onClose={() => {
          setBill(null)
          router.push(`/${lang}/store/sales`)
        }}
      />
    </>
  )
}

export default SaleFormPage
