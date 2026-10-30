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

import CustomTextField from '@core/components/mui/TextField'
import { isSizeOutOfStock, productSizes, stockCount } from '@/libs/rent-sizes'
import { formatPrice } from '@web/data/catalog'

export type SaleProductOption = {
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

export type SalePick = {
  key: string
  productSlug: string
  size: string
  quantity: number
}

const productNumber = (item?: { imageUrl?: string; image?: string; id?: string; slug?: string }) => {
  const fromImage = (item?.imageUrl || item?.image || '').match(/(\d+)(?:\.[a-z0-9]+)?$/i)

  if (fromImage) return fromImage[1].padStart(2, '0')

  return (item?.id || item?.slug || '00').slice(-4).toUpperCase()
}

const emptyPick = (): SalePick => ({ key: '', productSlug: '', size: '', quantity: 1 })

const SaleProductDialog = ({
  open,
  products,
  initial,
  onClose,
  onSave
}: {
  open: boolean
  products: SaleProductOption[]
  initial: SalePick | null
  onClose: () => void
  onSave: (pick: SalePick) => void
}) => {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<SalePick>(emptyPick)

  useEffect(() => {
    if (!open) return

    setQuery('')
    setDraft(initial ? { ...initial } : emptyPick())
  }, [open, initial])

  const selected = products.find(item => item.slug === draft.productSlug)
  const sizes = productSizes(selected?.sizes).filter(size => size !== 'Custom')
  const outfits = useMemo(() => {
    const text = query.trim().toLowerCase()

    return products.filter(item => `${item.name || ''} ${item.title || ''} ${productNumber(item)} ${item.slug}`.toLowerCase().includes(text))
  }, [products, query])
  const piecesLeft = (size: string) => (selected ? stockCount(selected.saleSizeStock, size) : null)
  const closed = (size: string) => Boolean(selected && (isSizeOutOfStock(selected.saleOutOfStock, size) || piecesLeft(size) === 0))
  const pickedPieces = draft.size ? piecesLeft(draft.size) : null

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle>{initial?.productSlug ? 'Change product' : 'Select product'}</DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2.5 }}>
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <Typography variant='h6'>Size</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sizes.map(size => {
              const off = closed(size)
              const count = piecesLeft(size)
              const on = draft.size === size

              return (
                <Button
                  key={size}
                  type='button'
                  variant={on ? 'contained' : 'tonal'}
                  color={off ? 'error' : on ? 'primary' : 'secondary'}
                  disabled={off}
                  aria-pressed={on}
                  onClick={() => setDraft(current => ({ ...current, size }))}
                  sx={{ minWidth: size.length > 2 ? 92 : 64, height: 52, px: 1.5, flexDirection: 'column', lineHeight: 1.1, gap: 0.25 }}
                >
                  <Box component='span' sx={{ fontWeight: 600 }}>
                    {size}
                  </Box>
                  <Box component='span' sx={{ fontSize: '0.7rem', opacity: 0.85 }}>
                    {off ? 'Out' : !selected || count === null ? '—' : count}
                  </Box>
                </Button>
              )
            })}
          </Box>
          <Typography variant='caption' color={draft.size && closed(draft.size) ? 'error.main' : 'text.secondary'}>
            {!draft.size
              ? 'Choose a size'
              : closed(draft.size)
                ? `${draft.size} is out of stock`
                : pickedPieces === null
                  ? 'This size is in stock.'
                  : `${pickedPieces} ${pickedPieces === 1 ? 'piece' : 'pieces'} to sell.`}
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
              const image = item.imageUrl || item.image

              return (
                <Box
                  key={item.slug}
                  component='button'
                  type='button'
                  onClick={() =>
                    setDraft(current => ({
                      ...current,
                      productSlug: item.slug,
                      size: productSizes(item.sizes).includes(current.size) ? current.size : ''
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
                  {image ? (
                    <Box component='img' src={image} alt='' sx={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                  ) : (
                    <Box className='flex items-center justify-center rounded bg-actionHover' sx={{ width: '100%', aspectRatio: '3 / 4' }}>
                      <i className='tabler-photo' />
                    </Box>
                  )}
                  <Chip size='small' variant='tonal' color={active ? 'primary' : 'secondary'} label={`#${productNumber(item)}`} sx={{ width: 'fit-content' }} />
                  <Typography variant='body2' sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.6em', lineHeight: 1.3 }}>
                    {item.name || item.title}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {formatPrice(item.sellingPrice || 0)}
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
          label='Quantity'
          value={draft.quantity}
          onChange={event => setDraft(current => ({ ...current, quantity: Math.max(1, Math.min(20, Math.round(Number(event.target.value)) || 1)) }))}
          sx={{ maxWidth: 160 }}
          slotProps={{ htmlInput: { min: 1, max: 20 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button type='button' onClick={onClose}>
          Cancel
        </Button>
        <Button type='button' variant='contained' onClick={() => onSave(draft)}>
          {initial?.productSlug ? 'Update product' : 'Add product'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SaleProductDialog
