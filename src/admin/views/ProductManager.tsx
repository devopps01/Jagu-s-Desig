'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import ProductFormModal, { type ProductFormValue } from '@admin/views/ProductFormModal'
import MediaPickerModal, { type PickedMedia } from '@admin/views/MediaPickerModal'
import { discountPercent, formatPrice } from '@web/data/catalog'

type ProductRow = ProductFormValue & { id: string }

const emptyForm: ProductFormValue = {
  id: '',
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  images: [],
  imageName: '',
  imageAlt: '',
  listingType: 'both',
  sellingPrice: '',
  rentPrice: '',
  sellingMrp: '',
  rentMrp: '',
  collections: [],
  fabric: '',
  color: '',
  craft: '',
  occasion: '',
  design: '',
  style: 'Chaniya Choli',
  styles: ['Chaniya Choli'],
  details: [
    { label: 'Country of manufacture', value: 'India' },
    { label: 'Wash care', value: 'Dry wash only' },
    { label: 'Colour', value: '' },
    { label: 'Fabric', value: '' },
    { label: 'Work type', value: '' }
  ],
  seoTitle: '',
  seoDescription: '',
  status: 'active'
}

const ProductManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const [listingFilter, setListingFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter, listingType: listingFilter }), [listingFilter, statusFilter])
  const table = useServerTable<ProductRow>('/api/admin/products', { extraParams })
  const [mains, setMains] = useState<{ id: string; name: string; slug: string }[]>([])
  const [form, setForm] = useState(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [galleryAdd, setGalleryAdd] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/categories?mains=1')
      .then(res => res.json())
      .then(json => setMains(Array.isArray(json) ? json : []))
      .catch(() => setMains([]))
  }, [])

  const save = async () => {
    setError('')
    const payload = {
      ...form,
      sellingPrice: Number(form.sellingPrice) || 0,
      rentPrice: Number(form.rentPrice) || 0,
      sellingMrp: Number(form.sellingMrp) || 0,
      rentMrp: Number(form.rentMrp) || 0
    }
    const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Save failed')

      return
    }

    setFormOpen(false)
    setForm(emptyForm)
    await table.reload()
  }

  return (
    <>
      <AdminDataTable
        title='Products'
        subtitle='Manage rent, selling, images, collections, filters and SEO.'
        search={table.search}
        searchPlaceholder='Search products...'
        onSearchChange={table.setSearch}
        onRefresh={() => void table.reload()}
        actions={
          <>
            <TextField select size='small' label='Status' value={statusFilter} onChange={event => setStatusFilter(event.target.value)} sx={{ minWidth: 120 }}>
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </TextField>
            <TextField select size='small' label='Listing' value={listingFilter} onChange={event => setListingFilter(event.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value=''>All types</MenuItem>
              <MenuItem value='sale'>Selling</MenuItem>
              <MenuItem value='rent'>Rent</MenuItem>
              <MenuItem value='both'>Both</MenuItem>
            </TextField>
            <Button
              variant='contained'
              startIcon={<i className='tabler-plus' />}
              onClick={() => {
                setError('')
                setForm(emptyForm)
                setFormOpen(true)
              }}
            >
              Add Product
            </Button>
          </>
        }
        columns={[
          {
            id: 'image',
            label: 'Image',
            render: row =>
              row.imageUrl ? <img src={row.imageUrl} alt={row.imageAlt} width={48} height={64} style={{ objectFit: 'cover', borderRadius: 6 }} /> : '-'
          },
          { id: 'name', label: 'Name' },
          {
            id: 'listingType',
            label: 'Type',
            render: row => <Chip size='small' label={row.listingType === 'sale' ? 'Selling' : row.listingType === 'rent' ? 'Rent' : 'Both'} />
          },
          {
            id: 'sellingPrice',
            label: 'Selling',
            render: row => {
              const price = Number(row.sellingPrice)
              const off = discountPercent(Number(row.sellingMrp), price)

              if (!price) return '-'

              return (
                <span>
                  {formatPrice(price)}
                  {off ? <Chip size='small' color='error' label={`${off}% off`} sx={{ ml: 1 }} /> : null}
                </span>
              )
            }
          },
          {
            id: 'rentPrice',
            label: 'Rent',
            render: row => {
              const price = Number(row.rentPrice)
              const off = discountPercent(Number(row.rentMrp), price)

              if (!price) return '-'

              return (
                <span>
                  {formatPrice(price)}
                  {off ? <Chip size='small' color='error' label={`${off}% off`} sx={{ ml: 1 }} /> : null}
                </span>
              )
            }
          },
          {
            id: 'status',
            label: 'Status',
            render: row => (
              <Switch
                size='small'
                checked={row.status === 'active'}
                onChange={() =>
                  void fetch(`/api/admin/products/${row.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: row.status === 'active' ? 'inactive' : 'active' })
                  }).then(() => table.reload())
                }
              />
            )
          },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <>
                <IconButton
                  size='small'
                  onClick={() => {
                    setError('')
                    setForm({
                      ...emptyForm,
                      ...row,
                      collections: row.collections || [],
                      styles: Array.isArray(row.styles) && row.styles.length ? row.styles : row.style ? [row.style] : [],
                      details:
                        Array.isArray(row.details) && row.details.length
                          ? row.details
                          : [
                              { label: 'Country of manufacture', value: 'India' },
                              { label: 'Wash care', value: 'Dry wash only' },
                              ...(row.color ? [{ label: 'Colour', value: row.color }] : []),
                              ...(row.fabric ? [{ label: 'Fabric', value: row.fabric }] : []),
                              ...([row.craft, row.design].filter(Boolean).length
                                ? [{ label: 'Work type', value: [row.craft, row.design].filter(Boolean).join(', ') }]
                                : [])
                            ]
                    })
                    setFormOpen(true)
                  }}
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => void fetch(`/api/admin/products/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}
                >
                  <i className='tabler-trash' />
                </IconButton>
              </>
            )
          }
        ]}
        rows={table.rows}
        rowKey={row => row.id}
        total={table.total}
        page={table.page}
        limit={table.limit}
        loading={table.loading}
        emptyText='No products yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />
      <ProductFormModal
        open={formOpen}
        value={form}
        mains={mains}
        error={error}
        onChange={setForm}
        onClose={() => setFormOpen(false)}
        onSave={() => void save()}
        onOpenMedia={file => {
          setGalleryAdd(false)
          setPendingFile(file)
          setPickerOpen(true)
        }}
        onAddGallery={() => {
          setGalleryAdd(true)
          setPendingFile(null)
          setPickerOpen(true)
        }}
      />
      <MediaPickerModal
        open={pickerOpen}
        file={pendingFile}
        onClose={() => {
          setPickerOpen(false)
          setPendingFile(null)
          setGalleryAdd(false)
        }}
        onSelect={(media: PickedMedia) =>
          setForm(current => {
            const images = [...new Set([...(current.images || []), current.imageUrl, media.url].filter(Boolean))]

            if (galleryAdd) {
              return { ...current, images, imageUrl: current.imageUrl || media.url }
            }

            return {
              ...current,
              imageUrl: media.url,
              imageName: media.name,
              imageAlt: media.alt || current.name,
              images: [media.url, ...images.filter(item => item !== media.url)]
            }
          })
        }
      />
    </>
  )
}

export default ProductManager
