'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { AdminDataTable } from '@admin/components/table'
import type { FilterDoc, FilterOption } from '@/libs/filter-utils'

const emptyOption = (isPrice: boolean): FilterOption =>
  isPrice ? { label: '', value: '', min: 0, max: 0, active: true } : { label: '', value: '', active: true }

const FilterManager = () => {
  const [rows, setRows] = useState<FilterDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [edit, setEdit] = useState<FilterDoc | null>(null)
  const [draftOption, setDraftOption] = useState<FilterOption>(emptyOption(false))

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/filters')
    const json = await res.json()

    setRows(Array.isArray(json) ? json : [])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const save = async (key: string, payload: Partial<FilterDoc>) => {
    await fetch(`/api/admin/filters/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    await load()
  }

  const addOption = () => {
    if (!edit || !draftOption.label.trim()) return

    setEdit({
      ...edit,
      options: [...(edit.options || []), { ...draftOption, value: draftOption.value || draftOption.label, active: true }]
    })
    setDraftOption(emptyOption(edit.key === 'price'))
  }

  return (
    <>
      <AdminDataTable
        title='Collection filters'
        subtitle='Choose which filters appear on collection pages, and whether options come from products or a static list.'
        search=''
        searchPlaceholder='Search filters...'
        onSearchChange={() => undefined}
        onRefresh={() => void load()}
        columns={[
          { id: 'label', label: 'Filter' },
          {
            id: 'show',
            label: 'Show on web',
            render: row => (
              <Switch size='small' checked={row.show} onChange={event => void save(row.key, { show: event.target.checked })} />
            )
          },
          {
            id: 'source',
            label: 'Options from',
            render: row => (
              <Chip
                size='small'
                color={row.source === 'product' ? 'primary' : 'secondary'}
                label={row.source === 'product' ? 'Products' : 'Static list'}
              />
            )
          },
          {
            id: 'pills',
            label: 'Top pills',
            render: row => (row.showPills ? 'Yes' : 'No')
          },
          {
            id: 'options',
            label: 'Options',
            render: row => `${(row.options || []).filter(item => item.active !== false).length}`
          },
          {
            id: 'actions',
            label: 'Manage',
            render: row => (
              <IconButton
                size='small'
                onClick={() => {
                  setEdit(row)
                  setDraftOption(emptyOption(row.key === 'price'))
                }}
              >
                <i className='tabler-settings' />
              </IconButton>
            )
          }
        ]}
        rows={rows}
        rowKey={row => row.key}
        total={rows.length}
        page={1}
        limit={20}
        loading={loading}
        emptyText='No filters yet.'
        onPageChange={() => undefined}
        onLimitChange={() => undefined}
      />

      <Dialog open={Boolean(edit)} onClose={() => setEdit(null)} fullWidth maxWidth='sm'>
        <DialogTitle>{edit ? `Manage ${edit.label}` : 'Filter'}</DialogTitle>
        {edit ? (
          <DialogContent className='flex flex-col gap-4' sx={{ pt: 2 }}>
            <FormControl>
              <Typography variant='body2' className='mbe-2'>
                How should options work?
              </Typography>
              <RadioGroup
                value={edit.source}
                onChange={event => setEdit({ ...edit, source: event.target.value as FilterDoc['source'] })}
              >
                <FormControlLabel value='product' control={<Radio />} label='Get options from products in this collection' />
                <FormControlLabel value='static' control={<Radio />} label='Use a static list I manage here' />
              </RadioGroup>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={edit.show} onChange={event => setEdit({ ...edit, show: event.target.checked })} />}
              label={edit.show ? 'Visible on collection page' : 'Hidden on collection page'}
            />
            <FormControlLabel
              control={
                <Switch checked={edit.showPills} onChange={event => setEdit({ ...edit, showPills: event.target.checked })} />
              }
              label='Show as pills above the product grid'
            />
            {edit.source === 'static' ? (
              <>
                <Typography variant='subtitle2'>Static options</Typography>
                {(edit.options || []).map((option, index) => (
                  <div key={`${option.value}-${index}`} className='flex items-center gap-2'>
                    <Typography variant='body2' className='flex-1'>
                      {option.label}
                      {edit.key === 'price' ? ` (₹${option.min ?? 0} – ₹${option.max ?? 0})` : ''}
                    </Typography>
                    <IconButton
                      size='small'
                      onClick={() =>
                        setEdit({ ...edit, options: edit.options.filter((_, optionIndex) => optionIndex !== index) })
                      }
                    >
                      <i className='tabler-trash' />
                    </IconButton>
                  </div>
                ))}
                <div className='flex flex-wrap gap-2'>
                  <TextField
                    size='small'
                    label='Option label'
                    value={draftOption.label}
                    onChange={event => setDraftOption({ ...draftOption, label: event.target.value })}
                  />
                  {edit.key === 'price' ? (
                    <>
                      <TextField
                        size='small'
                        type='number'
                        label='Min'
                        value={draftOption.min ?? 0}
                        onChange={event => setDraftOption({ ...draftOption, min: Number(event.target.value) })}
                        sx={{ width: 110 }}
                      />
                      <TextField
                        size='small'
                        type='number'
                        label='Max'
                        value={draftOption.max ?? 0}
                        onChange={event => setDraftOption({ ...draftOption, max: Number(event.target.value) })}
                        sx={{ width: 110 }}
                      />
                    </>
                  ) : null}
                  <Button variant='outlined' onClick={addOption}>
                    Add option
                  </Button>
                </div>
              </>
            ) : (
              <Typography color='text.secondary'>
                Options will be collected from product fields on the collection page (only values that exist on products).
              </Typography>
            )}
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={() => setEdit(null)}>Cancel</Button>
          <Button
            variant='contained'
            onClick={() => {
              if (!edit) return
              void save(edit.key, {
                show: edit.show,
                source: edit.source,
                showPills: edit.showPills,
                options: edit.options
              }).then(() => setEdit(null))
            }}
          >
            Save filter
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default FilterManager
