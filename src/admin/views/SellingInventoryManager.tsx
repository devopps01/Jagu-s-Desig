'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, AdminTableActions, adminActionsColumn, useClientTable } from '@admin/components/table'
import { adminApi } from '@admin/libs/adminApi'
import type { InventoryList, InventoryProduct, InventorySaleRow } from '@/libs/inventory'

const rupees = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const totals = (product: InventoryProduct) => {
  const capped = product.sizes.filter(size => size.quantity !== null)

  return {
    pieces: capped.reduce((sum, size) => sum + (size.quantity || 0), 0),
    unlimited: product.sizes.length - capped.length,
    sold: product.sizes.reduce((sum, size) => sum + size.used, 0),
    left: capped.reduce((sum, size) => sum + (size.left || 0), 0),
    low: product.sizes.some(size => size.low)
  }
}

const soldOn = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const SellingInventoryManager = () => {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [sales, setSales] = useState<InventorySaleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<InventoryProduct | null>(null)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [price, setPrice] = useState('')
  const [mrp, setMrp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const table = useClientTable(products, { searchKeys: ['name', 'slug'] })
  const history = useClientTable(sales, { searchKeys: ['productName', 'size', 'customerName', 'source'] })

  const load = async () => {
    setLoading(true)
    const result = await adminApi<InventoryList>('/api/admin/inventory/sale', undefined, { silentSuccess: true })

    if (result.ok && result.data?.products) {
      setProducts(result.data.products)
      setSales(result.data.sales || [])
    }

    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const openEdit = (product: InventoryProduct) => {
    setError('')
    setEditing(product)
    setQuantities(Object.fromEntries(product.sizes.map(size => [size.size, size.quantity === null ? '' : String(size.quantity)])))
    setClosed(Object.fromEntries(product.sizes.map(size => [size.size, size.closed])))
    setPrice(product.price ? String(product.price) : '')
    setMrp(product.mrp ? String(product.mrp) : '')
  }

  const closeEdit = () => {
    if (saving) return

    setEditing(null)
    setError('')
  }

  const save = async () => {
    if (!editing) return

    const sizes: Record<string, number | null> = {}

    for (const size of editing.sizes) {
      const raw = (quantities[size.size] ?? '').trim()

      if (raw === '') {
        sizes[size.size] = null
        continue
      }

      const next = Math.floor(Number(raw))

      if (!Number.isFinite(next) || next < 0 || next > 99) {
        setError(`Selling quantity for ${size.size} must be from 0 to 99, or empty for no limit`)

        return
      }

      sizes[size.size] = next
    }

    const nextPrice = Math.round(Number(price))
    const nextMrp = mrp.trim() === '' ? 0 : Math.round(Number(mrp))

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError('Selling price must be greater than 0')

      return
    }

    if (!Number.isFinite(nextMrp) || nextMrp < 0 || (nextMrp && nextMrp < nextPrice)) {
      setError('Selling MRP must be empty or at least the selling price')

      return
    }

    setSaving(true)
    setError('')

    const result = await adminApi<{ product: InventoryProduct | null }>(
      '/api/admin/inventory/sale',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: editing.id,
          sizes,
          outOfStock: editing.sizes.filter(size => closed[size.size]).map(size => size.size),
          price: nextPrice,
          mrp: nextMrp
        })
      },
      { successMessage: 'Selling inventory updated' }
    )

    setSaving(false)

    if (!result.ok) {
      setError(result.message || 'Could not update selling inventory')

      return
    }

    setEditing(null)
    await load()
  }

  return (
    <>
      <AdminDataTable
        title='Sales history'
        subtitle='Every outfit sold in the shop or on the website. Shop sales update the sold count below.'
        search={history.search}
        searchPlaceholder='Outfit, size or customer'
        onSearchChange={history.setSearch}
        onRefresh={() => void load()}
        columns={[
          {
            id: 'when',
            label: 'Date',
            minWidth: 160,
            render: row => soldOn(row.createdAt)
          },
          {
            id: 'outfit',
            label: 'Outfit',
            minWidth: 220,
            render: row => (
              <div className='flex items-center gap-3'>
                {row.imageUrl ? <img src={row.imageUrl} alt='' width={40} height={54} style={{ objectFit: 'cover', borderRadius: 6 }} /> : null}
                <Typography className='font-medium'>{row.productName}</Typography>
              </div>
            )
          },
          { id: 'size', label: 'Size', render: row => row.size || '-' },
          { id: 'quantity', label: 'Qty', align: 'right', render: row => row.quantity },
          { id: 'amount', label: 'Amount', align: 'right', render: row => rupees(row.amount) },
          { id: 'customer', label: 'Customer', render: row => row.customerName || '-' },
          {
            id: 'source',
            label: 'From',
            render: row => <Chip size='small' color={row.source === 'shop' ? 'primary' : 'default'} label={row.source === 'shop' ? 'Shop' : 'Website'} />
          }
        ]}
        rows={history.rows}
        rowKey={row => row.id}
        total={history.total}
        page={history.page}
        limit={history.limit}
        loading={loading}
        emptyText='No outfits have been sold yet.'
        onPageChange={history.setPage}
        onLimitChange={history.setLimit}
      />
      <div className='mbs-6' />
      <AdminDataTable
        title='Selling inventory'
        subtitle='Sold includes shop sales and website orders. On hand is the size cap you set. Leave a size empty for no limit.'
        search={table.search}
        searchPlaceholder='Search selling outfits'
        onSearchChange={table.setSearch}
        onRefresh={() => void load()}
        columns={[
          {
            id: 'image',
            label: 'Image',
            render: row =>
              row.imageUrl ? (
                <img src={row.imageUrl} alt='' width={48} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                '-'
              )
          },
          { id: 'name', label: 'Outfit', minWidth: 220 },
          {
            id: 'price',
            label: 'Price',
            align: 'right',
            render: row => (
              <div>
                <div>{rupees(row.price)}</div>
                {row.mrp > row.price ? (
                  <Typography variant='caption' color='text.secondary' sx={{ textDecoration: 'line-through' }}>
                    {rupees(row.mrp)}
                  </Typography>
                ) : null}
              </div>
            )
          },
          {
            id: 'listingType',
            label: 'Type',
            render: row => <Chip size='small' label={row.listingType === 'sale' ? 'Selling' : 'Both'} />
          },
          {
            id: 'pieces',
            label: 'On hand',
            align: 'right',
            render: row => {
              const stock = totals(row)

              if (!stock.pieces && stock.unlimited) return 'No limit'

              return stock.unlimited ? `${stock.pieces} + open` : stock.pieces
            }
          },
          {
            id: 'sold',
            label: 'Sold',
            align: 'right',
            render: row => totals(row).sold
          },
          {
            id: 'left',
            label: 'Left',
            align: 'right',
            render: row => {
              const stock = totals(row)

              if (!stock.pieces && stock.unlimited) return 'No limit'

              return stock.left
            }
          },
          {
            id: 'stock',
            label: 'Stock',
            render: row => {
              const marked = row.sizes.filter(size => size.closed || (size.quantity !== null && size.left === 0))

              if (marked.length) return <Chip size='small' color='error' label={`Out of stock · ${marked.map(size => size.size).join(', ')}`} />
              if (row.sizes.every(size => size.quantity === null)) return <Chip size='small' label='Not set' />

              return <Chip size='small' color='success' label='In stock' />
            }
          },
          adminActionsColumn<InventoryProduct>(row => (
            <AdminTableActions>
              <IconButton size='small' aria-label={`Edit ${row.name}`} onClick={() => openEdit(row)}>
                <i className='tabler-edit' />
              </IconButton>
            </AdminTableActions>
          ))
        ]}
        rows={table.rows}
        rowKey={row => row.id}
        total={table.total}
        page={table.page}
        limit={table.limit}
        loading={loading}
        emptyText='No selling outfits yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth='md'>
        <DialogTitle>Edit selling inventory</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          {editing ? (
            <>
              <Typography color='text.secondary'>{editing.name}</Typography>
              <div className='flex items-center gap-3 flex-wrap'>
                <TextField
                  size='small'
                  type='number'
                  label='Selling price (₹)'
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: 999999 } }}
                  sx={{ width: 180 }}
                />
                <TextField
                  size='small'
                  type='number'
                  label='Selling MRP (₹)'
                  placeholder='Optional'
                  value={mrp}
                  onChange={event => setMrp(event.target.value)}
                  slotProps={{ htmlInput: { min: 0, max: 999999 } }}
                  sx={{ width: 180 }}
                  helperText={
                    Number(mrp) > Number(price) && Number(price) > 0
                      ? `${Math.round(((Number(mrp) - Number(price)) / Number(mrp)) * 100)}% off`
                      : 'Leave MRP empty if there is no discount'
                  }
                />
              </div>
              {editing.sizes.map(size => (
                <div key={size.size} className='flex items-center gap-3 flex-wrap'>
                  <Typography sx={{ width: 96 }} className='font-medium'>
                    {size.size}
                  </Typography>
                  <TextField
                    size='small'
                    type='number'
                    label='Selling qty'
                    placeholder='No limit'
                    value={quantities[size.size] ?? ''}
                    onChange={event => setQuantities(current => ({ ...current, [size.size]: event.target.value }))}
                    slotProps={{ htmlInput: { min: 0, max: 99 } }}
                    sx={{ width: 130 }}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    Sold {size.used} · {size.left === null ? 'no limit' : `${size.left} left`}
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(closed[size.size])}
                        onChange={event => setClosed(current => ({ ...current, [size.size]: event.target.checked }))}
                      />
                    }
                    label='Out of stock'
                  />
                </div>
              ))}
              {error ? (
                <Typography color='error' variant='body2'>
                  {error}
                </Typography>
              ) : null}
            </>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit} disabled={saving}>
            Cancel
          </Button>
          <Button variant='contained' onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default SellingInventoryManager
