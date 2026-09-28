'use client'

import { useEffect, useMemo, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import CategoryFormModal, { type CategoryFormValue } from '@admin/views/CategoryFormModal'
import MediaPickerModal, { type PickedMedia } from '@admin/views/MediaPickerModal'

type CategoryRow = {
  id: string
  name: string
  slug: string
  description: string
  imageUrl: string
  imageName: string
  imageAlt: string
  type: 'main' | 'sub'
  parentId: string | null
  parentName?: string
  status: 'active' | 'inactive'
}

const emptyForm: CategoryFormValue = {
  id: '',
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
  imageName: '',
  imageAlt: '',
  type: 'main',
  parentId: '',
  status: 'active'
}

const CategoryManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<CategoryRow>('/api/admin/categories', { extraParams })
  const [mains, setMains] = useState<CategoryRow[]>([])
  const [form, setForm] = useState(emptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [error, setError] = useState('')

  const loadMains = async () => {
    const res = await fetch('/api/admin/categories?mains=1')

    if (!res.ok) return

    setMains(await res.json())
  }

  useEffect(() => {
    void loadMains()
  }, [])

  const openAdd = () => {
    setError('')
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEdit = (row: CategoryRow) => {
    setError('')
    setForm({ ...row, parentId: row.parentId || '', status: row.status || 'active' })
    setFormOpen(true)
  }

  const save = async () => {
    setError('')

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      imageUrl: form.imageUrl,
      imageName: form.imageName,
      imageAlt: form.imageAlt,
      type: form.type,
      parentId: form.type === 'sub' ? form.parentId : null,
      status: form.status
    }

    const res = await fetch(form.id ? `/api/admin/categories/${form.id}` : '/api/admin/categories', {
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
    await loadMains()
    await table.reload()
  }

  const remove = async (id: string) => {
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    await loadMains()
    await table.reload()
  }

  const toggleStatus = async (row: CategoryRow) => {
    await fetch(`/api/admin/categories/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: row.status === 'active' ? 'inactive' : 'active' })
    })
    await loadMains()
    await table.reload()
  }

  const onPick = (media: PickedMedia) => {
    setForm(current => ({
      ...current,
      imageUrl: media.url,
      imageName: media.name,
      imageAlt: media.alt
    }))
  }

  return (
    <>
      <AdminDataTable
        title='Categories'
        subtitle='Only Active main categories appear in the website header.'
        search={table.search}
        searchPlaceholder='Search categories...'
        onSearchChange={table.setSearch}
        onRefresh={() => void table.reload()}
        actions={
          <>
            <TextField
              select
              size='small'
              label='Status'
              value={statusFilter}
              onChange={event => {
                table.setPage(1)
                setStatusFilter(event.target.value)
              }}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </TextField>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={openAdd}>
              Add New Category
            </Button>
          </>
        }
        columns={[
          { id: 'name', label: 'Name' },
          { id: 'slug', label: 'Slug', render: row => `/${row.slug}` },
          {
            id: 'type',
            label: 'Type',
            render: row => (
              <Chip size='small' color={row.type === 'main' ? 'primary' : 'secondary'} label={row.type === 'main' ? 'Main' : 'Sub'} />
            )
          },
          { id: 'parentName', label: 'Parent', render: row => row.parentName || '-' },
          {
            id: 'status',
            label: 'Status',
            render: row => (
              <div className='flex items-center gap-2'>
                <Switch size='small' checked={row.status === 'active'} onChange={() => void toggleStatus(row)} />
                <Chip
                  size='small'
                  color={row.status === 'active' ? 'success' : 'default'}
                  label={row.status === 'active' ? 'Active' : 'Inactive'}
                />
              </div>
            )
          },
          {
            id: 'image',
            label: 'Image',
            render: row =>
              row.imageUrl ? (
                <img src={row.imageUrl} alt={row.imageAlt} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 6 }} />
              ) : (
                '-'
              )
          },
          {
            id: 'actions',
            label: 'Actions',
            render: row => (
              <>
                <IconButton size='small' onClick={() => openEdit(row)}>
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton size='small' color='error' onClick={() => void remove(row.id)}>
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
        emptyText='No categories yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />

      <CategoryFormModal
        open={formOpen}
        value={form}
        mains={mains}
        error={error}
        onChange={setForm}
        onClose={() => setFormOpen(false)}
        onSave={() => void save()}
        onOpenMedia={file => {
          setPendingFile(file)
          setPickerOpen(true)
        }}
      />
      <MediaPickerModal
        open={pickerOpen}
        file={pendingFile}
        onClose={() => {
          setPickerOpen(false)
          setPendingFile(null)
        }}
        onSelect={onPick}
      />
    </>
  )
}

export default CategoryManager
