'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { toast } from 'react-toastify'

import { adminApi } from '@admin/libs/adminApi'
import { loadAdminRentProducts, type RentProductOption } from '@admin/views/RentFormDialog'
import RentProductDialog, { type OutfitPick } from '@admin/views/RentOutfitBlock'
import SaleProductDialog, { type SalePick, type SaleProductOption } from '@admin/views/SaleOutfitBlock'
import CustomTextField from '@core/components/mui/TextField'
import { billSettlement, linePayable } from '@/libs/return-fee'
import type { RentBooking } from '@/libs/rentals'
import type { SaleRow } from '@admin/views/saleBill'

const PERCENTS = [0, 10, 25, 50, 100]
const rupee = (value: number) => `₹${Math.max(0, Math.round(value || 0)).toLocaleString('en-IN')}`
const money = (value: unknown) => {
  const next = Math.round(Number(value) || 0)

  return Number.isFinite(next) ? Math.max(0, next) : 0
}

type Draft = {
  key: string
  id: string
  isNew: boolean
  cancel: boolean
  touched: boolean
  productSlug: string
  productId: string
  productName: string
  productImage: string
  size: string
  quantity: number
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  price: number
  originalPayable: number
  originalPaid: number
  finalPrice: number
  productPrice: number
  discountAmount: number
  gstEnabled: boolean
  gstRate: number
  gstAmount: number
  status: string
  paymentMethod: string
  customerName: string
  customerPhone: string
  customerEmail: string
  notes: string
  orderKey: string
}

const blankDraft = (customer: Pick<Draft, 'customerName' | 'customerPhone' | 'customerEmail' | 'notes' | 'orderKey'>): Draft => ({
  key: `new-${Date.now()}`,
  id: '',
  isNew: true,
  cancel: false,
  touched: true,
  productSlug: '',
  productId: '',
  productName: '',
  productImage: '',
  size: '',
  quantity: 1,
  startDate: '',
  endDate: '',
  startTime: '10:00',
  endTime: '18:00',
  price: 0,
  originalPayable: 0,
  originalPaid: 0,
  finalPrice: 0,
  productPrice: 0,
  discountAmount: 0,
  gstEnabled: false,
  gstRate: 0,
  gstAmount: 0,
  status: 'booked',
  paymentMethod: 'Cash',
  ...customer
})

const fromSale = (row: SaleRow): Draft => {
  const payable = linePayable(row)

  return {
    key: row.id,
    id: row.id,
    isNew: false,
    cancel: false,
    touched: false,
    productSlug: row.productSlug || '',
    productId: '',
    productName: row.productName,
    productImage: row.productImage || '',
    size: row.size,
    quantity: Math.max(1, Number(row.quantity) || 1),
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    price: payable,
    originalPayable: payable,
    originalPaid: money(row.paidAmount),
    finalPrice: money(row.finalPrice),
    productPrice: money(row.productPrice),
    discountAmount: money(row.discountAmount),
    gstEnabled: Boolean(row.gstEnabled),
    gstRate: money(row.gstRate),
    gstAmount: money(row.gstAmount),
    status: row.status || 'sold',
    paymentMethod: row.paymentMethod || row.payments?.[0]?.method || 'Cash',
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail || '',
    notes: row.notes || '',
    orderKey: row.orderKey || ''
  }
}

const fromRent = (row: RentBooking): Draft => {
  const payable = linePayable(row)

  return {
    key: row.id,
    id: row.id,
    isNew: false,
    cancel: false,
    touched: false,
    productSlug: row.productSlug,
    productId: row.productId,
    productName: row.productName,
    productImage: row.productImage || '',
    size: row.size,
    quantity: 1,
    startDate: row.startDate,
    endDate: row.endDate,
    startTime: row.startTime || '10:00',
    endTime: row.endTime || '18:00',
    price: payable,
    originalPayable: payable,
    originalPaid: money(row.paidAmount),
    finalPrice: money(row.finalPrice),
    productPrice: money(row.productPrice),
    discountAmount: money(row.discountAmount),
    gstEnabled: Boolean(row.gstEnabled),
    gstRate: money(row.gstRate),
    gstAmount: money(row.gstAmount),
    status: row.status,
    paymentMethod: row.paymentMethod || row.payments?.[0]?.method || 'Cash',
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    customerEmail: row.customerEmail || '',
    notes: row.notes || '',
    orderKey: row.orderKey || ''
  }
}

const lineMoney = (row: Draft) => {
  if (!row.touched) {
    return {
      payable: row.originalPayable,
      finalPrice: row.finalPrice,
      productPrice: row.productPrice,
      discountAmount: row.discountAmount,
      gstEnabled: row.gstEnabled,
      gstRate: row.gstRate,
      gstAmount: row.gstAmount
    }
  }

  return {
    payable: money(row.price),
    finalPrice: money(row.price),
    productPrice: money(row.price),
    discountAmount: 0,
    gstEnabled: false,
    gstRate: row.gstRate,
    gstAmount: 0
  }
}

const splitMoney = (total: number, weights: number[]) => {
  const parts = weights.map(weight => Math.max(0, Math.round(weight)))
  const sum = parts.reduce((totalWeight, weight) => totalWeight + weight, 0)
  let left = money(total)

  return parts.map((weight, index) => {
    if (index === parts.length - 1) return left

    const share = sum ? Math.min(left, Math.round((total * weight) / sum)) : 0

    left -= share

    return share
  })
}

const assignPaid = (rows: Draft[], total: number) => {
  const payables = rows.map(row => lineMoney(row).payable)
  const shares = splitMoney(total, payables)
  let overflow = 0
  const capped = shares.map((share, index) => {
    if (share <= payables[index]) return share

    overflow += share - payables[index]

    return payables[index]
  })

  if (overflow && capped.length) capped[capped.length - 1] += overflow

  return capped
}

const AmountLine = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <div className='flex items-center justify-between gap-4'>
    <Typography color={strong ? 'text.primary' : 'text.secondary'} fontWeight={strong ? 700 : 400}>
      {label}
    </Typography>
    <Typography fontWeight={strong ? 700 : 500}>{value}</Typography>
  </div>
)

const BillEditDialog = ({
  open,
  kind,
  sales,
  rents,
  onClose,
  onSaved
}: {
  open: boolean
  kind: 'sale' | 'rent'
  sales: SaleRow[]
  rents: RentBooking[]
  onClose: () => void
  onSaved: () => void
}) => {
  const saleBill = kind === 'sale'
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [saleProducts, setSaleProducts] = useState<SaleProductOption[]>([])
  const [rentProducts, setRentProducts] = useState<RentProductOption[]>([])
  const [salePicker, setSalePicker] = useState<SalePick | null>(null)
  const [rentPicker, setRentPicker] = useState<(OutfitPick & { key: string }) | null>(null)
  const [feeText, setFeeText] = useState('0')
  const [chargeText, setChargeText] = useState('')
  const [chargeTouched, setChargeTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const sourceKey = (saleBill ? sales : rents).map(row => row.id).join(',')

  useEffect(() => {
    if (!open) return

    setDrafts(saleBill ? sales.filter(row => row.status !== 'cancelled').map(fromSale) : rents.filter(row => row.status !== 'cancelled').map(fromRent))
    setFeeText('0')
    setChargeText('')
    setChargeTouched(false)
    setSalePicker(null)
    setRentPicker(null)
    // Reset only when this bill opens. Parent arrays change identity on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, saleBill, sourceKey])

  useEffect(() => {
    if (!open) return

    let live = true

    if (saleBill) {
      void Promise.all([
        adminApi<{ data?: SaleProductOption[] }>('/api/admin/products?limit=100&listingType=sale', undefined, { silentSuccess: true }),
        adminApi<{ data?: SaleProductOption[] }>('/api/admin/products?limit=100&listingType=both', undefined, { silentSuccess: true })
      ]).then(([sale, both]) => {
        if (!live) return

        const rows = [...(sale.data?.data || []), ...(both.data?.data || [])]
        const seen = new Set<string>()

        setSaleProducts(
          rows.filter(item => {
            if (!item.slug || seen.has(item.slug)) return false

            seen.add(item.slug)

            return true
          })
        )
      })
    } else {
      void loadAdminRentProducts().then(rows => {
        if (live) setRentProducts(rows)
      })
    }

    return () => {
      live = false
    }
  }, [open, saleBill])

  const kept = drafts.filter(row => !row.cancel)
  const cancelling = drafts.filter(row => row.cancel && row.id)
  const paidBefore = drafts.filter(row => !row.isNew).reduce((sum, row) => sum + row.originalPaid, 0)
  const billNow = kept.reduce((sum, row) => sum + lineMoney(row).payable, 0)
  const dueNow = Math.max(0, billNow - paidBefore)
  const quote = useMemo(
    () => billSettlement(paidBefore, billNow, feeText, chargeTouched ? chargeText : dueNow),
    [paidBefore, billNow, feeText, chargeText, chargeTouched, dueNow]
  )
  const customer = drafts[0]

  const patch = (key: string, next: Partial<Draft>) => {
    setDrafts(current => current.map(row => (row.key === key ? { ...row, ...next } : row)))
  }

  const saveSalePick = (pick: SalePick) => {
    if (!pick.productSlug || !pick.size) {
      toast.error('Choose an outfit and a size')

      return
    }

    const item = saleProducts.find(row => row.slug === pick.productSlug)
    const quantity = Math.max(1, Math.min(20, money(pick.quantity) || 1))
    const price = money(item?.sellingPrice) * quantity
    const name = item?.name || item?.title || 'Outfit'

    setDrafts(current => {
      const existing = current.find(row => row.key === pick.key)

      if (existing) {
        return current.map(row =>
          row.key === pick.key
            ? { ...row, productSlug: pick.productSlug, productName: name, productImage: item?.imageUrl || item?.image || row.productImage, size: pick.size, quantity, price, touched: true }
            : row
        )
      }

      const base = current[0]

      return [
        ...current,
        {
          ...blankDraft({
            customerName: base?.customerName || '',
            customerPhone: base?.customerPhone || '',
            customerEmail: base?.customerEmail || '',
            notes: base?.notes || '',
            orderKey: base?.orderKey || ''
          }),
          key: pick.key || `new-${Date.now()}`,
          productSlug: pick.productSlug,
          productName: name,
          productImage: item?.imageUrl || item?.image || '',
          size: pick.size,
          quantity,
          price,
          status: 'sold'
        }
      ]
    })
    setSalePicker(null)
  }

  const saveRentPick = (pick: OutfitPick & { key: string }) => {
    if (!pick.productSlug || !pick.size || !pick.startDate || !pick.endDate) {
      toast.error('Choose an outfit, a size and the dates')

      return
    }

    const item = rentProducts.find(row => row.slug === pick.productSlug)

    setDrafts(current => {
      const existing = current.find(row => row.key === pick.key)
      const next = {
        productSlug: pick.productSlug,
        productId: pick.productId || item?.id || '',
        productName: item?.name || existing?.productName || 'Outfit',
        productImage: item?.imageUrl || existing?.productImage || '',
        size: pick.size,
        startDate: pick.startDate,
        endDate: pick.endDate,
        price: money(pick.price),
        touched: true
      }

      if (existing) return current.map(row => (row.key === pick.key ? { ...row, ...next } : row))

      const base = current[0]

      return [
        ...current,
        {
          ...blankDraft({
            customerName: base?.customerName || '',
            customerPhone: base?.customerPhone || '',
            customerEmail: base?.customerEmail || '',
            notes: base?.notes || '',
            orderKey: base?.orderKey || ''
          }),
          key: pick.key || `new-${Date.now()}`,
          ...next,
          status: 'booked'
        }
      ]
    })
    setRentPicker(null)
  }

  const save = async () => {
    if (!customer) return

    const active = drafts.filter(row => !row.cancel)
    const removed = drafts.filter(row => row.cancel && row.id)

    for (const row of active) {
      if (!row.productSlug || !row.size) {
        toast.error(`Choose an outfit and size for ${row.productName || 'the new line'}`)

        return
      }

      if (!saleBill && (!row.startDate || !row.endDate)) {
        toast.error(`Choose dates for ${row.productName || 'the new outfit'}`)

        return
      }
    }

    const feeOnActive = removed.length ? 0 : quote.fee
    const activePaid = quote.extra > 0 ? quote.billNow + feeOnActive : quote.paid + quote.charge
    const paidShares = assignPaid(active, activePaid)
    const feeShares = splitMoney(removed.length ? quote.fee : 0, removed.map(row => row.originalPaid))
    const refundShares = splitMoney(quote.refund, removed.map(row => row.originalPaid))
    const orderKey = drafts.find(row => row.orderKey)?.orderKey || (active.length > 1 || drafts.some(row => row.isNew) ? `ord-${Date.now().toString(36)}` : '')

    setSaving(true)

    try {
      for (const [index, row] of active.entries()) {
        const priced = lineMoney(row)
        const paid = paidShares[index] || 0
        const balance = Math.max(0, priced.payable - paid)
        const option = paid <= 0 ? 'unpaid' : paid >= priced.payable ? 'full' : 'custom'
        const payments = paid > 0 ? [{ method: row.paymentMethod || 'Cash', amount: paid }] : []

        if (saleBill) {
          const body = {
            productSlug: row.productSlug,
            size: row.size,
            quantity: row.quantity,
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail,
            notes: customer.notes,
            productPrice: priced.productPrice,
            finalPrice: priced.finalPrice,
            discountAmount: priced.discountAmount,
            gstEnabled: priced.gstEnabled,
            gstRate: priced.gstRate,
            gstAmount: priced.gstAmount,
            paymentOption: option,
            paymentMethod: row.paymentMethod || 'Cash',
            payments,
            paidAmount: paid,
            balanceAmount: balance,
            orderKey
          }
          const result = await adminApi(row.id ? `/api/admin/sales/${row.id}` : '/api/admin/sales', {
            method: row.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }, { silentSuccess: true, errorMessage: 'Could not save this sale' })

          if (!result.ok) return
        } else {
          const body = {
            productSlug: row.productSlug,
            size: row.size,
            startDate: row.startDate,
            endDate: row.endDate,
            startTime: row.startTime || '10:00',
            endTime: row.endTime || '18:00',
            customerName: customer.customerName,
            customerPhone: customer.customerPhone,
            customerEmail: customer.customerEmail,
            notes: customer.notes,
            status: row.isNew ? 'booked' : row.status,
            productPrice: priced.productPrice,
            finalPrice: priced.finalPrice,
            discountAmount: priced.discountAmount,
            gstEnabled: priced.gstEnabled,
            gstRate: priced.gstRate,
            gstAmount: priced.gstAmount,
            paymentOption: option,
            paymentMethod: row.paymentMethod || 'Cash',
            payments,
            paidAmount: paid,
            balanceAmount: balance,
            updateCatalogPrice: false,
            allowExtraPaid: paid > priced.payable,
            orderKey
          }
          const result = await adminApi(row.id ? `/api/admin/rentals/${row.id}` : '/api/admin/rentals', {
            method: row.id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          }, { silentSuccess: true, errorMessage: 'Could not save this rental' })

          if (!result.ok) return
        }
      }

      for (const [index, row] of removed.entries()) {
        const result = await adminApi(saleBill ? `/api/admin/sales/${row.id}` : `/api/admin/rentals/${row.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel', returnFee: feeShares[index] || 0, refundAmount: refundShares[index] || 0 })
        }, { silentSuccess: true, errorMessage: 'Could not cancel this outfit' })

        if (!result.ok) return
      }

      const settled = [
        quote.refund ? `${rupee(quote.refund)} to return` : '',
        quote.fee ? `${rupee(quote.fee)} kept as fee` : '',
        quote.charge ? `${rupee(quote.charge)} collected` : ''
      ].filter(Boolean)

      toast.success(settled.length ? `Bill updated. ${settled.join(', ')}.` : 'Bill updated')
      onSaved()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='md'>
        <DialogTitle>{saleBill ? 'Edit sale bill' : 'Edit rent bill'}</DialogTitle>
        <DialogContent>
          <Typography color='text.secondary' className='mbe-4'>
            {customer ? `${customer.customerName} · ${customer.customerPhone}` : ''} Add an outfit, cancel one, or change its amount. The calculator at the bottom settles the money.
          </Typography>
          <div className='flex items-center justify-between gap-3 mbe-3'>
            <Typography variant='h6'>Outfits</Typography>
            <Button
              type='button'
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              disabled={saving}
              onClick={() => {
                if (saleBill) setSalePicker({ key: `new-${Date.now()}`, productSlug: '', size: '', quantity: 1 })
                else setRentPicker({ key: `new-${Date.now()}`, productId: '', productSlug: '', size: 'M', startDate: '', endDate: '', price: 0 })
              }}
            >
              Add outfit
            </Button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Outfit</TableCell>
                  <TableCell>{saleBill ? 'Size / qty' : 'Size / dates'}</TableCell>
                  <TableCell width={140}>Amount (₹)</TableCell>
                  <TableCell width={64} />
                </TableRow>
              </TableHead>
              <TableBody>
                {drafts.map(row => (
                  <TableRow key={row.key} sx={row.cancel ? { opacity: 0.55 } : undefined}>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <IconButton size='small' aria-label='Change outfit' disabled={saving || row.cancel || row.status === 'returned'} onClick={() => {
                          if (saleBill) setSalePicker({ key: row.key, productSlug: row.productSlug, size: row.size, quantity: row.quantity })
                          else setRentPicker({ key: row.key, productId: row.productId, productSlug: row.productSlug, size: row.size, startDate: row.startDate, endDate: row.endDate, price: row.price })
                        }}>
                          <i className='tabler-pencil' />
                        </IconButton>
                        <span>{row.productName || 'New outfit'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {saleBill ? (
                        <div className='flex items-center gap-2'>
                          <span>{row.size || '—'}</span>
                          <CustomTextField
                            type='number'
                            size='small'
                            value={row.quantity}
                            disabled={saving || row.cancel}
                            onChange={event => patch(row.key, { quantity: Math.max(1, Math.min(20, money(Number(event.target.value)) || 1)) })}
                            sx={{ width: 72 }}
                            slotProps={{ htmlInput: { min: 1, max: 20 } }}
                          />
                        </div>
                      ) : (
                        <span>
                          {row.size || '—'}
                          {row.startDate ? ` · ${row.startDate} → ${row.endDate}` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <CustomTextField
                        type='number'
                        size='small'
                        value={row.cancel ? row.originalPayable : row.price}
                        disabled={saving || row.cancel}
                        onChange={event => patch(row.key, { price: money(Number(event.target.value)), touched: true })}
                        slotProps={{ htmlInput: { min: 0 } }}
                      />
                    </TableCell>
                    <TableCell>
                      {row.status === 'returned' ? null : (
                        <IconButton
                          type='button'
                          aria-label={row.cancel ? 'Keep outfit' : 'Cancel outfit'}
                          disabled={saving}
                          onClick={() => patch(row.key, { cancel: !row.cancel })}
                          sx={{
                            color: 'error.main',
                            bgcolor: 'var(--mui-palette-error-lightOpacity)',
                            '&:hover': { bgcolor: 'var(--mui-palette-error-mainOpacity)' }
                          }}
                        >
                          <i className={row.cancel ? 'tabler-arrow-back-up' : 'tabler-trash'} />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex flex-col gap-2 mts-6'>
            <Typography variant='h6'>Settle this edit</Typography>
            <AmountLine label='Bill before' value={rupee(drafts.filter(row => !row.isNew).reduce((sum, row) => sum + row.originalPayable, 0))} />
            <AmountLine label='Bill now' value={rupee(quote.billNow)} />
            <AmountLine label='Already paid' value={rupee(quote.paid)} />
            {quote.extra > 0 ? (
              <>
                <AmountLine label='Extra paid' value={rupee(quote.extra)} strong />
                <Typography variant='body2' color='text.secondary'>
                  The return fee is kept from this extra. The rest goes back to the customer.
                </Typography>
                <div className='flex flex-wrap gap-2'>
                  {PERCENTS.map(percent => {
                    const amount = Math.round((quote.extra * percent) / 100)

                    return (
                      <Button key={percent} size='small' variant={quote.fee === amount ? 'contained' : 'tonal'} disabled={saving} onClick={() => setFeeText(String(amount))}>
                        {percent}%
                      </Button>
                    )
                  })}
                </div>
                <CustomTextField
                  type='number'
                  label='Return fee to keep'
                  value={feeText}
                  disabled={saving}
                  onChange={event => setFeeText(event.target.value)}
                  helperText='Percent is of the extra already paid.'
                  slotProps={{ htmlInput: { min: 0, max: quote.extra } }}
                />
                <AmountLine label='Return fee kept' value={rupee(quote.fee)} />
                <AmountLine label='Amount to return' value={rupee(quote.refund)} strong />
              </>
            ) : null}
            {quote.due > 0 ? (
              <>
                <AmountLine label='Left to collect' value={rupee(quote.due)} strong />
                <Typography variant='body2' color='text.secondary'>
                  Take all of it now, or take a part and leave the rest on the bill.
                </Typography>
                <div className='flex flex-wrap gap-2'>
                  {PERCENTS.map(percent => {
                    const amount = Math.round((quote.due * percent) / 100)

                    return (
                      <Button
                        key={percent}
                        size='small'
                        variant={quote.charge === amount ? 'contained' : 'tonal'}
                        disabled={saving}
                        onClick={() => {
                          setChargeTouched(true)
                          setChargeText(String(amount))
                        }}
                      >
                        {percent}%
                      </Button>
                    )
                  })}
                </div>
                <CustomTextField
                  type='number'
                  label='Charge to take now'
                  value={chargeTouched ? chargeText : String(quote.due)}
                  disabled={saving}
                  onChange={event => {
                    setChargeTouched(true)
                    setChargeText(event.target.value)
                  }}
                  helperText='Percent is of the amount still left on this bill.'
                  slotProps={{ htmlInput: { min: 0, max: quote.due } }}
                />
                <AmountLine label='Collect now' value={rupee(quote.charge)} />
                <AmountLine label='Still left on the bill' value={rupee(quote.stillDue)} strong />
              </>
            ) : null}
            {quote.extra === 0 && quote.due === 0 ? (
              <Typography color='text.secondary'>This bill matches what was already paid. Nothing to return or collect.</Typography>
            ) : null}
          </div>
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' color='secondary' disabled={saving} onClick={onClose}>
            Close
          </Button>
          <Button variant='contained' disabled={saving || !drafts.length} onClick={() => void save()}>
            Save bill
          </Button>
        </DialogActions>
      </Dialog>
      <SaleProductDialog open={Boolean(salePicker)} products={saleProducts} initial={salePicker} onClose={() => setSalePicker(null)} onSave={saveSalePick} />
      <RentProductDialog open={Boolean(rentPicker)} products={rentProducts} initial={rentPicker} onClose={() => setRentPicker(null)} onSave={saveRentPick} />
    </>
  )
}

export default BillEditDialog
