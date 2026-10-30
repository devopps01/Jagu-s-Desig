'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

import AdminRentCalendar, { type RentCalendarHold } from '@admin/views/AdminRentCalendar'
import type { RentProductOption } from '@admin/views/RentFormDialog'
import CustomTextField from '@core/components/mui/TextField'
import { RENT_SIZES, isSizeOutOfStock, sizeQuantity } from '@/libs/rent-sizes'
import { formatPrice } from '@web/data/catalog'

const productNumber = (item?: { imageUrl?: string; id?: string; slug?: string }) => {
  const fromImage = (item?.imageUrl || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (item?.id || item?.slug || '00').slice(-4).toUpperCase()
}

export type OutfitPick = {
  productId: string
  productSlug: string
  size: string
  startDate: string
  endDate: string
  price: number
}

const RentProductDialog = ({
  open,
  products,
  initial,
  onClose,
  onSave
}: {
  open: boolean
  products: RentProductOption[]
  initial: (OutfitPick & { key: string }) | null
  onClose: () => void
  onSave: (pick: OutfitPick & { key: string }) => void
}) => {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<OutfitPick & { key: string }>({
    key: '',
    productId: '',
    productSlug: '',
    size: 'M',
    startDate: '',
    endDate: '',
    price: 0
  })
  const [holds, setHolds] = useState<RentCalendarHold[]>([])

  useEffect(() => {
    if (!open) return

    setQuery('')
    setDraft(
      initial || {
        key: '',
        productId: '',
        productSlug: '',
        size: 'M',
        startDate: '',
        endDate: '',
        price: 0
      }
    )
  }, [open, initial])

  const selected = products.find(item => item.slug === draft.productSlug)
  const outfits = useMemo(() => {
    const text = query.trim().toLowerCase()

    return products.filter(item => item.listingType !== 'sale' && `${item.name || ''} ${productNumber(item)} ${item.slug}`.toLowerCase().includes(text))
  }, [products, query])
  const offered = (selected?.sizes || []).filter(item => (RENT_SIZES as readonly string[]).includes(item))
  const options = offered.length ? offered : [...RENT_SIZES]
  const pieces = sizeQuantity(selected?.rentSizeStock, draft.size)
  const closed = Boolean(selected && isSizeOutOfStock(selected.rentOutOfStock, draft.size))

  useEffect(() => {
    if (!open || !draft.productSlug) {
      setHolds([])

      return
    }

    let live = true

    void fetch(`/api/rent/schedule?slug=${encodeURIComponent(draft.productSlug)}`)
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!live) return

        const rows = Array.isArray(json?.holds) ? json.holds : []

        setHolds(
          rows
            .map((row: RentCalendarHold) => ({
              size: String(row?.size || ''),
              startDate: String(row?.startDate || ''),
              endDate: String(row?.endDate || '')
            }))
            .filter((row: RentCalendarHold) => row.size && row.startDate && row.endDate)
        )
      })
      .catch(() => {
        if (live) setHolds([])
      })

    return () => {
      live = false
    }
  }, [draft.productSlug, open])

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{initial?.productSlug ? 'Change outfit' : 'Add outfit'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5 }}>
        <AdminRentCalendar
          startDate={draft.startDate}
          endDate={draft.endDate}
          size={draft.size}
          stock={sizeQuantity(selected?.rentSizeStock, draft.size)}
          closed={closed}
          holds={holds}
          onChange={(start, end) => setDraft(current => ({ ...current, startDate: start, endDate: end }))}
        />
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <Typography variant='h6'>Size</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {options.map(item => {
              const off = isSizeOutOfStock(selected?.rentOutOfStock, item)
              const count = sizeQuantity(selected?.rentSizeStock, item)
              const on = draft.size === item

              return (
                <Button
                  key={item}
                  type='button'
                  variant={on ? 'contained' : 'tonal'}
                  color={off ? 'error' : on ? 'primary' : 'secondary'}
                  disabled={off}
                  aria-pressed={on}
                  onClick={() => setDraft(current => ({ ...current, size: item }))}
                  sx={{ minWidth: item.length > 2 ? 92 : 64, height: 52, px: 1.5, flexDirection: 'column', lineHeight: 1.1, gap: 0.25 }}
                >
                  <Box component='span' sx={{ fontWeight: 600 }}>
                    {item}
                  </Box>
                  <Box component='span' sx={{ fontSize: '0.7rem', opacity: 0.85 }}>
                    {off ? 'Out' : count}
                  </Box>
                </Button>
              )
            })}
          </Box>
          <Typography variant='caption' color={closed ? 'error.main' : 'text.secondary'}>
            {closed
              ? `${draft.size} is out of stock`
              : selected
                ? `${pieces} ${pieces === 1 ? 'piece' : 'pieces'} to rent.`
                : 'Choose a size'}
          </Typography>
        </Box>
        <div className='flex flex-col gap-3'>
          <Typography variant='h6'>Select outfit</Typography>
          <CustomTextField fullWidth placeholder='Search by name or number...' value={query} onChange={event => setQuery(event.target.value)} />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', md: 'repeat(auto-fill, minmax(180px, 1fr))' },
              gap: { xs: 1.5, md: 2 },
              maxHeight: { xs: 420, md: 480 },
              overflow: 'auto',
              alignContent: 'start'
            }}
          >
            {outfits.map(item => {
              const active = item.slug === draft.productSlug

              return (
                <Box
                  key={item.id}
                  component='button'
                  type='button'
                  onClick={() =>
                    setDraft(current => ({
                      ...current,
                      productSlug: item.slug || '',
                      productId: item.id,
                      size: (item.sizes || []).includes(current.size) ? current.size : current.size,
                      price: current.productSlug === item.slug ? current.price : Math.max(0, Math.round(Number(item.rentPrice) || 0))
                    }))
                  }
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                    width: '100%',
                    minWidth: 0,
                    p: 1,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: active ? 'var(--mui-palette-primary-lightOpacity)' : 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {item.imageUrl ? (
                    <Box component='img' src={item.imageUrl} alt='' sx={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                  ) : (
                    <Box className='flex items-center justify-center rounded bg-actionHover' sx={{ width: '100%', aspectRatio: '3 / 4' }}>
                      <i className='tabler-photo' />
                    </Box>
                  )}
                  <Chip size='small' variant='tonal' color={active ? 'primary' : 'secondary'} label={`#${productNumber(item)}`} sx={{ width: 'fit-content' }} />
                  <Typography variant='body2' sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em', lineHeight: 1.3 }}>
                    {item.name}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatPrice(Number(item.rentPrice) || 0)}
                  </Typography>
                </Box>
              )
            })}
            {!outfits.length ? (
              <Typography color='text.secondary' sx={{ gridColumn: '1 / -1' }}>
                No outfits found
              </Typography>
            ) : null}
          </Box>
        </div>
        <CustomTextField
          type='number'
          label='Price (₹)'
          value={draft.price}
          onChange={event => setDraft(current => ({ ...current, price: Math.max(0, Math.min(999999, Math.round(Number(event.target.value) || 0))) }))}
          helperText='Rent charged for this outfit on the bill'
          sx={{ maxWidth: 220 }}
          slotProps={{ htmlInput: { min: 0, max: 999999 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button type='button' onClick={onClose}>
          Cancel
        </Button>
        <Button type='button' variant='contained' onClick={() => onSave(draft)}>
          {initial?.productSlug ? 'Update outfit' : 'Add outfit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RentProductDialog
