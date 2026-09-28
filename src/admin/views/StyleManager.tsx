'use client'

import { useEffect, useMemo, useState } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable, useServerTable } from '@admin/components/table'
import { slugify } from '@/libs/slug'

type StyleRow = {
  id: string
  name: string
  slug: string
  collections: string[]
  status: 'active' | 'inactive'
}

type CollectionOption = { id: string; name: string; slug: string }

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  collections: [] as string[],
  status: 'active' as 'active' | 'inactive'
}

const StyleManager = () => {
  const [statusFilter, setStatusFilter] = useState('')
  const extraParams = useMemo(() => ({ status: statusFilter }), [statusFilter])
  const table = useServerTable<StyleRow>('/api/admin/styles', { extraParams })
  const [collections, setCollections] = useState<CollectionOption[]>([])
  const [form, setForm] = useState(emptyForm)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/categories?mains=1')
      .then(res => (res.ok ? res.json() : []))
      .then(json => setCollections(Array.isArray(json) ? json : []))
      .catch(() => setCollections([]))
  }, [])

  const save = async () => {
    setError('')

    const res = await fetch(form.id ? `/api/admin/styles/${form.id}` : '/api/admin/styles', {
      method: form.id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.message || 'Save failed')

      return
    }

    setOpen(false)
    setForm(emptyForm)
    await table.reload()
  }

  return (
    <>
      <AdminDataTable
        title='Styles'
        subtitle='Each style can belong to more than one collection. Products can select these styles.'
        search={table.search}
        searchPlaceholder='Search styles...'
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
            <Button
              variant='contained'
              onClick={() => {
                setError('')
                setForm(emptyForm)
                setOpen(true)
              }}
            >
              Add style
            </Button>
          </>
        }
        columns={[
          { id: 'name', label: 'Style' },
          {
            id: 'collections',
            label: 'Collections',
            render: row =>
              row.collections.length ? (
                <div className='flex flex-wrap gap-1'>
                  {row.collections.map(slug => (
                    <Chip key={slug} size='small' label={collections.find(item => item.slug === slug)?.name || slug} />
                  ))}
                </div>
              ) : (
                '—'
              )
          },
          {
            id: 'status',
            label: 'Status',
            render: row => (
              <Switch
                checked={row.status === 'active'}
                onChange={() =>
                  void fetch(`/api/admin/styles/${row.id}`, {
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
                    setForm({ id: row.id, name: row.name, slug: row.slug, collections: row.collections || [], status: row.status })
                    setOpen(true)
                  }}
                >
                  <i className='tabler-edit' />
                </IconButton>
                <IconButton size='small' color='error' onClick={() => void fetch(`/api/admin/styles/${row.id}`, { method: 'DELETE' }).then(() => table.reload())}>
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
        emptyText='No styles yet.'
        onPageChange={table.setPage}
        onLimitChange={table.setLimit}
      />
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='sm'>
        <DialogTitle>{form.id ? 'Edit style' : 'Add style'}</DialogTitle>
        <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
          {error ? <Typography color='error'>{error}</Typography> : null}
          <TextField
            fullWidth
            label='Style name'
            value={form.name}
            onChange={event =>
              setForm(current => ({
                ...current,
                name: event.target.value,
                slug: current.id ? current.slug : slugify(event.target.value)
              }))
            }
          />
          <Autocomplete
            multiple
            disableCloseOnSelect
            options={collections}
            value={collections.filter(item => form.collections.includes(item.slug))}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, selected) => option.slug === selected.slug}
            onChange={(_event, selected) => setForm(current => ({ ...current, collections: selected.map(item => item.slug) }))}
            renderOption={(props, option, { selected }) => {
              const { key, ...optionProps } = props

              return (
                <li key={key} {...optionProps}>
                  <Checkbox size='small' checked={selected} sx={{ mr: 1 }} />
                  {option.name}
                </li>
              )
            }}
            renderInput={params => <TextField {...params} label='Collections' placeholder='Search collections' />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant='contained' onClick={() => void save()}>
            {form.id ? 'Update style' : 'Save style'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StyleManager
