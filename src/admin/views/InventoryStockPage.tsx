'use client'

import { useEffect, useMemo, useState } from 'react'

import IconButton from '@mui/material/IconButton'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
import type { InventoryChannel, InventoryList, InventoryProduct, InventorySize } from '@/libs/inventory'

const InventoryStockPage = ({ channel }: { channel: InventoryChannel }) => {
  const [data, setData] = useState<InventoryList | null>(null)
  const [search, setSearch] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState('')

  const load = async () => {
    const result = await adminApi<InventoryList>(`/api/admin/inventory/${channel}`, undefined, { silentSuccess: true })

    if (result.ok && result.data?.products) setData(result.data)
  }

  useEffect(() => {
    void load()
  }, [channel])

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase()

    return (data?.products || []).filter(product => !query || `${product.name} ${product.slug}`.toLowerCase().includes(query))
  }, [data, search])

  const keyOf = (productId: string, size: string) => `${productId}|${size}`

  const draftValue = (product: InventoryProduct, size: InventorySize) => {
    const key = keyOf(product.id, size.size)

    if (key in drafts) return drafts[key]

    return size.quantity === null ? '' : String(size.quantity)
  }

  const save = async (product: InventoryProduct, size: InventorySize) => {
    const key = keyOf(product.id, size.size)
    const raw = draftValue(product, size).trim()
    const quantity = channel === 'sale' && raw === '' ? null : Number(raw)

    setSaving(key)

    const result = await adminApi<{ product: InventoryProduct | null }>(
      `/api/admin/inventory/${channel}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, size: size.size, quantity })
      },
      { successMessage: 'Inventory updated' }
    )

    setSaving('')

    if (!result.ok || !result.data?.product) return

    setData(current =>
      current
        ? { ...current, products: current.products.map(item => (item.id === product.id ? result.data.product! : item)) }
        : current
    )
    setDrafts(current => {
      const next = { ...current }

      delete next[key]

      return next
    })
    void load()
  }

  const summary = data?.summary
  const cards =
    channel === 'sale'
      ? [
          { label: 'Outfits', value: summary?.products ?? 0 },
          { label: 'Pieces on hand', value: summary?.pieces ?? 0 },
          { label: 'Sold', value: summary?.used ?? 0 },
          { label: 'Left to sell', value: summary?.left ?? 0 }
        ]
      : [
          { label: 'Outfits', value: summary?.products ?? 0 },
          { label: 'Pieces in stock', value: summary?.pieces ?? 0 },
          { label: 'Out today', value: summary?.used ?? 0 },
          { label: 'Free today', value: summary?.left ?? 0 }
        ]

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }} className='flex items-center justify-between gap-4 flex-wrap'>
        <div>
          <Typography variant='h4'>{channel === 'sale' ? 'Selling inventory' : 'Rent inventory'}</Typography>
          <Typography color='text.secondary'>
            {channel === 'sale'
              ? 'Set how many pieces of each size you can sell. Leave a size empty for no limit.'
              : 'Set how many pieces of each size you can rent. The same dates can be booked once for each piece.'}
          </Typography>
        </div>
        <TextField size='small' value={search} placeholder='Search outfits' onChange={event => setSearch(event.target.value)} />
      </Grid>

      {cards.map(card => (
        <Grid key={card.label} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Typography variant='h4'>{card.value}</Typography>
              <Typography color='text.secondary'>{card.label}</Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {rows.map(product => (
        <Grid key={product.id} size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <div className='flex items-center gap-4 mbe-4'>
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt='' style={{ width: 56, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <div className='flex items-center justify-center rounded bg-actionHover' style={{ width: 56, height: 72 }}>
                    <i className='tabler-photo' />
                  </div>
                )}
                <div>
                  <Typography variant='h6'>{product.name}</Typography>
                  <div className='flex gap-2 mbs-1'>
                    <Chip size='small' variant='tonal' label={product.listingType} className='capitalize' />
                    <Chip size='small' color={product.status === 'active' ? 'success' : 'default'} label={product.status} className='capitalize' />
                  </div>
                </div>
              </div>
              <div className='flex flex-col gap-3'>
                {product.sizes.map(size => {
                  const key = keyOf(product.id, size.size)

                  return (
                    <div key={size.size} className='flex items-center gap-3 flex-wrap'>
                      <Typography sx={{ width: 92 }} className='font-medium'>
                        {size.size}
                      </Typography>
                      <TextField
                        size='small'
                        type='number'
                        label={channel === 'sale' ? 'Selling qty' : 'Rent qty'}
                        placeholder={channel === 'sale' ? 'No limit' : '1'}
                        value={draftValue(product, size)}
                        onChange={event => setDrafts(current => ({ ...current, [key]: event.target.value }))}
                        slotProps={{ htmlInput: { min: channel === 'sale' ? 0 : 1, max: 99 } }}
                        sx={{ width: 140 }}
                      />
                      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 180 }}>
                        {channel === 'sale'
                          ? `Sold ${size.used} · ${size.left === null ? 'no limit' : `${size.left} left`}`
                          : `Out today ${size.used} · booked ahead ${size.reserved} · ${size.left} free today`}
                      </Typography>
                      {size.low ? <Chip size='small' color={size.left === 0 ? 'error' : 'warning'} label={size.left === 0 ? 'None left' : 'Low'} /> : null}
                      <IconButton size='small' color='primary' disabled={saving === key} aria-label={saving === key ? 'Saving' : 'Save'} title={saving === key ? 'Saving' : 'Save'} onClick={() => void save(product, size)}>
                        <i className='tabler-device-floppy' />
                      </IconButton>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </Grid>
      ))}

      {!rows.length ? (
        <Grid size={{ xs: 12 }}>
          <Typography color='text.secondary'>No outfits match this inventory.</Typography>
        </Grid>
      ) : null}
    </Grid>
  )
}

export default InventoryStockPage
