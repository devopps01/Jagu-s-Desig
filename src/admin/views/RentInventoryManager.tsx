'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
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
import MarkRentReturnedDialog, { type RentReturnPayload } from '@admin/views/MarkRentReturnedDialog'
import type { InventoryHold, InventoryList, InventoryProduct } from '@/libs/inventory'

const rupees = (value: number) => `₹${Number(value || 0).toLocaleString('en-IN')}`

const totals = (product: InventoryProduct) => ({
  pieces: product.sizes.reduce((sum, size) => sum + (size.quantity || 0), 0),
  out: product.sizes.reduce((sum, size) => sum + size.used, 0),
  overdue: product.sizes.reduce((sum, size) => sum + size.overdue, 0),
  ahead: product.sizes.reduce((sum, size) => sum + size.reserved, 0),
  free: product.sizes.reduce((sum, size) => sum + (size.left || 0), 0),
  low: product.sizes.some(size => size.low)
})

const RentInventoryManager = () => {
  const [products, setProducts] = useState<InventoryProduct[]>([])
  const [holds, setHolds] = useState<InventoryHold[]>([])
  const [loading, setLoading] = useState(true)
  const [returnHold, setReturnHold] = useState<InventoryHold | null>(null)
  const [editing, setEditing] = useState<InventoryProduct | null>(null)
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const [price, setPrice] = useState('')
  const [mrp, setMrp] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const table = useClientTable(products, { searchKeys: ['name', 'slug'] })

  const load = async () => {
    setLoading(true)
    const result = await adminApi<InventoryList>('/api/admin/inventory/rent', undefined, { silentSuccess: true })

    if (result.ok && result.data?.products) {
      setProducts(result.data.products)
      setHolds(result.data.holds || [])
    }

    setLoading(false)
  }

  const markReturned = async (payload: RentReturnPayload) => {
    if (!returnHold) return

    const result = await adminApi<InventoryList>(
      '/api/admin/inventory/rent',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnBookingId: returnHold.id, ...payload })
      },
      { successMessage: 'Outfit marked returned' }
    )

    if (!result.ok) return

    setReturnHold(null)

    if (result.data?.products) {
      setProducts(result.data.products)
      setHolds(result.data.holds || [])
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const openEdit = (product: InventoryProduct) => {
    setError('')
    setEditing(product)
    setQuantities(Object.fromEntries(product.sizes.map(size => [size.size, String(size.quantity ?? 1)])))
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

    const sizes: Record<string, number> = {}

    for (const size of editing.sizes) {
      const next = Math.floor(Number(quantities[size.size]))

      if (!Number.isFinite(next) || next < 1 || next > 99) {
        setError(`Rent quantity for ${size.size} must be from 1 to 99`)

        return
      }

      sizes[size.size] = next
    }

    const nextPrice = Math.round(Number(price))
    const nextMrp = mrp.trim() === '' ? 0 : Math.round(Number(mrp))

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      setError('Rent price must be greater than 0')

      return
    }

    if (!Number.isFinite(nextMrp) || nextMrp < 0 || (nextMrp && nextMrp < nextPrice)) {
      setError('Rent MRP must be empty or at least the rent price')

      return
    }

    setSaving(true)
    setError('')

    const result = await adminApi<{ product: InventoryProduct | null }>(
      '/api/admin/inventory/rent',
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
      { successMessage: 'Rent inventory updated' }
    )

    setSaving(false)

    if (!result.ok) {
      setError(result.message || 'Could not update rent inventory')

      return
    }

    setEditing(null)
    await load()
  }

  const todayHolds = holds.filter(hold => hold.kind === 'today')
  const overdueHolds = holds.filter(hold => hold.kind === 'overdue')

  const holdCard = (title: string, rows: InventoryHold[], empty: string) => (
    <Card className='mbe-6'>
      <CardContent>
        <Typography variant='h5' className='mbe-1'>
          {title}
        </Typography>
        <Typography color='text.secondary' className='mbe-4'>
          {rows.length ? `${rows.length} ${rows.length === 1 ? 'outfit' : 'outfits'}` : empty}
        </Typography>
        <div className='flex flex-col gap-3'>
          {rows.map(hold => (
            <div key={hold.id} className='flex items-center justify-between gap-3 flex-wrap rounded border p-3'>
              <div className='flex items-center gap-3'>
                {hold.imageUrl ? (
                  <img src={hold.imageUrl} alt='' width={48} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} />
                ) : null}
                <div>
                  <Typography className='font-medium'>{hold.productName}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Size {hold.size} · {hold.startDate} to {hold.endDate}
                    {hold.customerName ? ` · ${hold.customerName}` : ''}
                  </Typography>
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <Chip size='small' color={hold.kind === 'today' ? 'warning' : 'error'} label={hold.kind === 'today' ? 'On rent today' : 'Not returned'} />
                <IconButton size='small' color='primary' aria-label='Mark returned' title='Mark returned' onClick={() => setReturnHold(hold)}>
                  <i className='tabler-package-import' />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <>
      {holdCard('On rent today', todayHolds, 'No outfit is out on rent today.')}
      {holdCard('Not returned yet', overdueHolds, 'Every past booking has been marked returned.')}
      <AdminDataTable
        title='Rent inventory'
        subtitle='Outfits on rent today stay out until you mark them returned. Pieces whose return date has passed stay in Not returned until they come back.'
        search={table.search}
        searchPlaceholder='Search rent outfits'
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
            render: row => <Chip size='small' label={row.listingType === 'rent' ? 'Rent' : 'Both'} />
          },
          {
            id: 'pieces',
            label: 'Pieces',
            align: 'right',
            render: row => totals(row).pieces
          },
          {
            id: 'out',
            label: 'Out today',
            align: 'right',
            render: row => totals(row).out
          },
          {
            id: 'overdue',
            label: 'Not returned',
            align: 'right',
            render: row => totals(row).overdue
          },
          {
            id: 'ahead',
            label: 'Booked ahead',
            align: 'right',
            render: row => totals(row).ahead
          },
          {
            id: 'free',
            label: 'Free today',
            align: 'right',
            render: row => totals(row).free
          },
          {
            id: 'stock',
            label: 'Stock',
            render: row => {
              const today = row.sizes.filter(size => size.used > 0).map(size => size.size)
              const late = row.sizes.filter(size => size.overdue > 0).map(size => size.size)

              if (today.length) return <Chip size='small' color='warning' label={`On rent today · ${today.join(', ')}`} />
              if (late.length) return <Chip size='small' color='error' label={`Not returned · ${late.join(', ')}`} />
              if (row.sizes.some(size => size.closed)) {
                return <Chip size='small' color='error' label={`Out of stock · ${row.sizes.filter(size => size.closed).map(size => size.size).join(', ')}`} />
              }

              return <Chip size='small' color='success' label='Available' />
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
        emptyText='No rent outfits yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <Dialog open={Boolean(editing)} onClose={closeEdit} fullWidth maxWidth='md'>
        <DialogTitle>Edit rent inventory</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          {editing ? (
            <>
              <Typography color='text.secondary'>{editing.name}</Typography>
              <div className='flex items-center gap-3 flex-wrap'>
                <TextField
                  size='small'
                  type='number'
                  label='Rent price (₹)'
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                  slotProps={{ htmlInput: { min: 1, max: 999999 } }}
                  sx={{ width: 180 }}
                />
                <TextField
                  size='small'
                  type='number'
                  label='Rent MRP (₹)'
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
                    label='Rent qty'
                    value={quantities[size.size] ?? ''}
                    onChange={event => setQuantities(current => ({ ...current, [size.size]: event.target.value }))}
                    slotProps={{ htmlInput: { min: 1, max: 99 } }}
                    sx={{ width: 120 }}
                  />
                  <Typography variant='body2' color='text.secondary'>
                    Out today {size.used} · booked ahead {size.reserved} · {size.left} free today
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
      <MarkRentReturnedDialog open={Boolean(returnHold)} source={returnHold} onClose={() => setReturnHold(null)} onConfirm={markReturned} />
    </>
  )
}

export default RentInventoryManager
