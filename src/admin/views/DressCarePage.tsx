'use client'

import { useEffect, useMemo, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { adminApi } from '@admin/libs/adminApi'
import type { RentBooking } from '@/libs/rentals'

type CareStatus = 'pending' | 'done'
type CareType = '' | 'dry' | 'stitch'

type CareDraft = {
  dryCleanNeeded: boolean
  stitchingNeeded: boolean
  dressNotes: string
  dressNotesDone: boolean
  dressCareStatus: CareStatus
}

type CareAsk = {
  row: RentBooking
  next: CareDraft
  title: string
  detail: string
}

const draftOf = (row: RentBooking, notes = row.dressNotes || ''): CareDraft => ({
  dryCleanNeeded: Boolean(row.dryCleanNeeded),
  stitchingNeeded: Boolean(row.stitchingNeeded),
  dressNotes: notes,
  dressNotesDone: Boolean(row.dressNotesDone),
  dressCareStatus: row.dressCareStatus === 'done' ? 'done' : 'pending'
})

const returnLabel = (row: RentBooking) => {
  const value = row.returnedAt || row.endDate
  const date = value ? new Date(value) : null

  if (!date || Number.isNaN(date.getTime())) return row.endDate || ''

  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const DressCarePage = () => {
  const [rows, setRows] = useState<RentBooking[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<'' | CareStatus>('pending')
  const [type, setType] = useState<CareType>('')
  const [search, setSearch] = useState('')
  const [ask, setAsk] = useState<CareAsk | null>(null)

  const load = async () => {
    setLoading(true)
    const result = await adminApi<{ data?: RentBooking[] }>('/api/admin/rentals/dress-care', undefined, { silentSuccess: true })
    const next = Array.isArray(result.data?.data) ? result.data.data : []

    setRows(next)
    setNotes(Object.fromEntries(next.map(row => [row.id, row.dressNotes || ''])))
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  const pending = rows.filter(row => row.dressCareStatus !== 'done').length
  const visible = useMemo(() => {
    const text = search.trim().toLowerCase()

    return rows.filter(row => {
      if (status === 'pending' && row.dressCareStatus === 'done') return false
      if (status === 'done' && row.dressCareStatus !== 'done') return false
      if (type === 'dry' && !row.dryCleanNeeded) return false
      if (type === 'stitch' && !row.stitchingNeeded) return false
      if (!text) return true

      return `${row.productName} ${row.size} ${row.customerName}`.toLowerCase().includes(text)
    })
  }, [rows, search, status, type])

  const openAsk = (row: RentBooking, next: CareDraft, title: string, detail: string) => {
    setAsk({ row, next, title, detail })
  }

  const confirm = async () => {
    if (!ask) return

    setSaving(true)
    const result = await adminApi<{ data?: RentBooking }>(
      '/api/admin/rentals/dress-care',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ask.row.id, ...ask.next })
      },
      { successMessage: 'Dress care updated' }
    )

    setSaving(false)
    if (!result.ok || !result.data?.data) return

    const saved = result.data.data

    setRows(current => current.map(row => (row.id === saved.id ? saved : row)))
    setNotes(current => ({ ...current, [saved.id]: saved.dressNotes || '' }))
    setAsk(null)
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box className='flex items-center justify-between gap-4 flex-wrap mbe-4'>
            <div>
              <Typography variant='h4'>Dress care</Typography>
              <Typography color='text.secondary'>Outfits marked returned. Update dry clean, stitching, and notes here.</Typography>
            </div>
            <Box className='flex items-center gap-2'>
              <Chip color='warning' label={`Pending ${pending}`} />
              <Chip color='success' label={`Done ${rows.length - pending}`} />
              <Button variant='tonal' disabled={loading} onClick={() => void load()}>
                Refresh
              </Button>
            </Box>
          </Box>
          <Box className='flex items-center gap-3 flex-wrap mbe-4'>
            <TextField select size='small' label='Status' value={status} onChange={event => setStatus(event.target.value as '' | CareStatus)} sx={{ minWidth: 140 }}>
              <MenuItem value='pending'>Pending</MenuItem>
              <MenuItem value='done'>Done</MenuItem>
              <MenuItem value=''>All</MenuItem>
            </TextField>
            <TextField select size='small' label='Type' value={type} onChange={event => setType(event.target.value as CareType)} sx={{ minWidth: 160 }}>
              <MenuItem value=''>All tasks</MenuItem>
              <MenuItem value='dry'>Dry clean</MenuItem>
              <MenuItem value='stitch'>Stitching</MenuItem>
            </TextField>
            <TextField size='small' label='Search' placeholder='Outfit or customer' value={search} onChange={event => setSearch(event.target.value)} sx={{ minWidth: 220 }} />
          </Box>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  {['Outfit', 'Size', 'Customer', 'Return date', 'Dry clean', 'Stitching', 'Notes', 'Notes done', ''].map(heading => (
                    <TableCell key={heading || 'action'}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map(row => {
                  const note = notes[row.id] ?? row.dressNotes ?? ''
                  const noteChanged = note.trim() !== (row.dressNotes || '')

                  return (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Box className='flex items-center gap-3'>
                          {row.productImage ? <img src={row.productImage} alt='' width={40} height={54} style={{ objectFit: 'cover', borderRadius: 4 }} /> : null}
                          <Typography className='font-medium'>{row.productName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{row.size}</TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{returnLabel(row)}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={Boolean(row.dryCleanNeeded)}
                          inputProps={{ 'aria-label': `Dry clean ${row.productName}` }}
                          onChange={event =>
                            openAsk(
                              row,
                              { ...draftOf(row, note), dryCleanNeeded: event.target.checked },
                              event.target.checked ? 'Mark dry clean?' : 'Clear dry clean?',
                              event.target.checked ? 'This outfit will be marked for dry cleaning.' : 'Dry clean will be removed from this outfit.'
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={Boolean(row.stitchingNeeded)}
                          inputProps={{ 'aria-label': `Stitching ${row.productName}` }}
                          onChange={event =>
                            openAsk(
                              row,
                              { ...draftOf(row, note), stitchingNeeded: event.target.checked },
                              event.target.checked ? 'Mark stitching?' : 'Clear stitching?',
                              event.target.checked ? 'This outfit will be marked for stitching.' : 'Stitching will be removed from this outfit.'
                            )
                          }
                        />
                      </TableCell>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Box className='flex items-center gap-1'>
                          <TextField
                            size='small'
                            fullWidth
                            placeholder='Care notes'
                            value={note}
                            onChange={event => setNotes(current => ({ ...current, [row.id]: event.target.value }))}
                          />
                          <IconButton
                            size='small'
                            color='primary'
                            aria-label='Save notes'
                            title='Save notes'
                            disabled={!noteChanged}
                            onClick={() => openAsk(row, { ...draftOf(row, note), dressNotes: note.trim() }, 'Save notes?', note.trim() ? `Notes will be saved as “${note.trim()}”.` : 'The notes will be cleared.')}
                          >
                            <i className='tabler-device-floppy' />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={Boolean(row.dressNotesDone)}
                          inputProps={{ 'aria-label': `Notes done ${row.productName}` }}
                          onChange={event =>
                            openAsk(
                              row,
                              { ...draftOf(row, note), dressNotesDone: event.target.checked },
                              event.target.checked ? 'Mark notes done?' : 'Clear notes done?',
                              event.target.checked ? 'The care notes will be marked done.' : 'Notes done will be cleared.'
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {row.dressCareStatus === 'done' ? (
                          <Button
                            size='small'
                            variant='tonal'
                            onClick={() => openAsk(row, { ...draftOf(row, note), dressCareStatus: 'pending' }, 'Reopen dress care?', 'This outfit will move back to the pending list.')}
                          >
                            Reopen
                          </Button>
                        ) : (
                          <Button
                            size='small'
                            variant='contained'
                            onClick={() => openAsk(row, { ...draftOf(row, note), dressCareStatus: 'done' }, 'Mark dress care done?', 'This outfit will leave the pending list.')}
                          >
                            Mark done
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {!visible.length ? (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography color='text.secondary'>{loading ? 'Loading dress care…' : 'No returned outfits in this list. Mark an outfit returned and it will show here.'}</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(ask)} onClose={saving ? undefined : () => setAsk(null)} fullWidth maxWidth='sm'>
        <DialogTitle>{ask?.title}</DialogTitle>
        <DialogContent>
          {ask ? (
            <Box className='flex items-center gap-4 mbe-4'>
              {ask.row.productImage ? <img src={ask.row.productImage} alt='' width={72} height={96} style={{ objectFit: 'cover', borderRadius: 8 }} /> : null}
              <div>
                <Typography variant='h6'>{ask.row.productName}</Typography>
                <Typography>Size {ask.row.size}</Typography>
                <Typography color='text.secondary'>
                  {ask.row.customerName} · Returned {returnLabel(ask.row)}
                </Typography>
              </div>
            </Box>
          ) : null}
          <Typography>{ask?.detail}</Typography>
        </DialogContent>
        <DialogActions>
          <Button variant='tonal' color='secondary' disabled={saving} onClick={() => setAsk(null)}>
            Cancel
          </Button>
          <Button variant='contained' disabled={saving || !ask} onClick={() => void confirm()}>
            {saving ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DressCarePage
