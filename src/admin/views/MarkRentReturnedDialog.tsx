'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'
import { mergeRentPayments, type RentPaymentLine } from '@/libs/rent-payment'
import { linePayable } from '@/libs/return-fee'

const rupee = (value: number) => `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`

const amountOf = (value: string) => {
  const next = Math.round(Number(value))

  if (!Number.isFinite(next) || next < 0) return 0

  return Math.min(999999, next)
}

export type RentReturnSource = {
  id: string
  productName: string
  size: string
  customerName?: string
  startDate: string
  endDate: string
  finalPrice?: number
  discountAmount?: number
  gstAmount?: number
  paidAmount?: number
  paymentMethod?: string
  payments?: RentPaymentLine[]
}

export type RentReturnPayload = {
  collectCash: number
  collectUpi: number
  securityDeposit: number
  securityRefunded: number
  securityHoldReason: string
  dryCleanNeeded: boolean
  stitchingNeeded: boolean
  dressNotes: string
  extraExpense: number
  extraExpenseNote: string
}

const paidLines = (source: RentReturnSource | null): RentPaymentLine[] => {
  if (!source) return []

  const lines = mergeRentPayments([source.payments || []])

  if (lines.length) return lines

  const paid = Math.max(0, Math.round(Number(source.paidAmount) || 0))

  if (!paid) return []

  return [{ method: source.paymentMethod || 'Cash', amount: paid }]
}

const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.75 }}>
    <Typography color='text.secondary'>{label}</Typography>
    <Typography sx={{ color: color || 'text.primary', fontWeight: 600 }}>{value}</Typography>
  </Box>
)

const MarkRentReturnedDialog = ({
  open,
  source,
  onClose,
  onConfirm
}: {
  open: boolean
  source: RentReturnSource | null
  onClose: () => void
  onConfirm: (payload: RentReturnPayload) => Promise<void>
}) => {
  const [cashText, setCashText] = useState('0')
  const [upiText, setUpiText] = useState('0')
  const [depositText, setDepositText] = useState('0')
  const [refundText, setRefundText] = useState('0')
  const [refundTouched, setRefundTouched] = useState(false)
  const [reason, setReason] = useState('')
  const [dryClean, setDryClean] = useState(false)
  const [stitching, setStitching] = useState(false)
  const [dressNotes, setDressNotes] = useState('')
  const [extraOn, setExtraOn] = useState(false)
  const [extraText, setExtraText] = useState('')
  const [extraNote, setExtraNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return

    setCashText('0')
    setUpiText('0')
    setDepositText('0')
    setRefundText('0')
    setRefundTouched(false)
    setReason('')
    setDryClean(false)
    setStitching(false)
    setDressNotes('')
    setExtraOn(false)
    setExtraText('')
    setExtraNote('')
    setError('')
  }, [open, source?.id])

  const payable = source ? linePayable(source) : 0
  const already = paidLines(source)
  const alreadyPaid = already.reduce((sum, row) => sum + row.amount, 0)
  const collectCash = amountOf(cashText)
  const collectUpi = amountOf(upiText)
  const extra = extraOn ? amountOf(extraText) : 0
  const deposit = amountOf(depositText)
  const refunded = Math.min(deposit, amountOf(refundText))
  const held = Math.max(0, deposit - amountOf(refundText))
  const newPaid = alreadyPaid + collectCash + collectUpi + extra
  const dueBefore = Math.max(0, payable - alreadyPaid)
  const dueAfter = Math.max(0, payable + extra - newPaid)

  const save = async () => {
    if (amountOf(refundText) > deposit) {
      setError('The refund cannot be more than the security deposit')

      return
    }

    if (held > 0 && reason.trim().length < 3) {
      setError('Write why the security deposit is held')

      return
    }

    if (extraOn && extra <= 0) {
      setError('Enter the extra amount collected from the customer')

      return
    }

    setSaving(true)
    setError('')

    try {
      await onConfirm({
        collectCash,
        collectUpi,
        securityDeposit: deposit,
        securityRefunded: refunded,
        securityHoldReason: held > 0 ? reason.trim() : '',
        dryCleanNeeded: dryClean,
        stitchingNeeded: stitching,
        dressNotes: dressNotes.trim(),
        extraExpense: extra,
        extraExpenseNote: extra ? extraNote.trim() : ''
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Mark returned</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' className='mbe-4'>
          {source ? `${source.productName}, size ${source.size}` : ''}
          {source?.customerName ? ` · ${source.customerName}` : ''}
          {source ? ` · ${source.startDate} to ${source.endDate}` : ''}
        </Typography>

        {dueBefore > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Typography color='error.main' fontWeight={700}>
              Balance pending
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Collect the remaining rent before this outfit is marked returned, or leave it and the balance stays on the bill.
            </Typography>
          </Box>
        ) : (
          <Typography color='success.main' fontWeight={700} className='mbe-3'>
            Rent is already paid
          </Typography>
        )}

        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 2, py: 1, mb: 3 }}>
          <Row label='Total amount' value={rupee(payable)} />
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ letterSpacing: 0.6 }}>
          ALREADY PAID
        </Typography>
        <Box sx={{ mb: 3 }}>
          {already.length ? already.map(row => <Row key={row.method} label={row.method} value={rupee(row.amount)} />) : <Row label='Paid' value={rupee(0)} />}
          <Row label='Total paid' value={rupee(alreadyPaid)} />
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ letterSpacing: 0.6 }}>
          COLLECTING NOW
        </Typography>
        <Typography variant='body2' color='text.secondary' className='mbe-2'>
          Enter only the additional amount taken today.
        </Typography>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mb: 3 }}>
          <CustomTextField label='Cash (₹)' type='number' value={cashText} disabled={saving} onChange={event => setCashText(event.target.value)} />
          <CustomTextField label='UPI (₹)' type='number' value={upiText} disabled={saving} onChange={event => setUpiText(event.target.value)} />
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ letterSpacing: 0.6 }}>
          SUMMARY
        </Typography>
        <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, px: 2, py: 1, mb: 3 }}>
          <Row label='New total paid' value={rupee(newPaid)} color='var(--mui-palette-success-main)' />
          <Row label='Balance due' value={rupee(dueAfter)} color={dueAfter > 0 ? 'var(--mui-palette-error-main)' : 'var(--mui-palette-success-main)'} />
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ letterSpacing: 0.6 }}>
          SECURITY DEPOSIT
        </Typography>
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, mt: 2 }}>
          <CustomTextField
            label='Deposit (₹)'
            type='number'
            value={depositText}
            disabled={saving}
            onChange={event => {
              setDepositText(event.target.value)
              if (!refundTouched) setRefundText(event.target.value)
            }}
          />
          <CustomTextField
            label='Refunded (₹)'
            type='number'
            value={refundText}
            disabled={saving}
            onChange={event => {
              setRefundTouched(true)
              setRefundText(event.target.value)
            }}
          />
        </Box>
        <Box sx={{ mt: 1, mb: 2 }}>
          <Row label='Held' value={rupee(held)} color={held > 0 ? 'var(--mui-palette-warning-main)' : undefined} />
        </Box>
        {held > 0 ? (
          <Box sx={{ border: '1px solid', borderColor: 'warning.main', bgcolor: 'var(--mui-palette-warning-lightOpacity)', borderRadius: 1, p: 2, mb: 3 }}>
            <Typography color='warning.main' fontWeight={600} className='mbe-2'>
              Reason for security held
            </Typography>
            <CustomTextField
              fullWidth
              multiline
              minRows={2}
              placeholder='For example, stain on the fabric or a repair cost'
              value={reason}
              disabled={saving}
              onChange={event => setReason(event.target.value)}
            />
          </Box>
        ) : null}

        <Typography variant='caption' color='text.secondary' sx={{ letterSpacing: 0.6 }}>
          DRESS CONDITION
        </Typography>
        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 2, py: 1, mt: 1, mb: 2, display: 'flex', flexDirection: 'column' }}>
          <FormControlLabel control={<Checkbox checked={dryClean} disabled={saving} onChange={event => setDryClean(event.target.checked)} />} label='Dry clean needed' />
          <FormControlLabel control={<Checkbox checked={stitching} disabled={saving} onChange={event => setStitching(event.target.checked)} />} label='Stitching needed' />
          <CustomTextField fullWidth label='Notes' placeholder='Anything else about the outfit' value={dressNotes} disabled={saving} onChange={event => setDressNotes(event.target.value)} />
        </Box>

        <FormControlLabel
          control={<Checkbox checked={extraOn} disabled={saving} onChange={event => setExtraOn(event.target.checked)} />}
          label='Additional expense collected from customer'
        />
        {extraOn ? (
          <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', sm: '160px 1fr' }, mt: 1 }}>
            <CustomTextField label='Amount (₹)' type='number' value={extraText} disabled={saving} onChange={event => setExtraText(event.target.value)} />
            <CustomTextField label='Note' value={extraNote} disabled={saving} onChange={event => setExtraNote(event.target.value)} />
          </Box>
        ) : null}

        {error ? (
          <Typography color='error.main' className='mts-3'>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' disabled={saving} onClick={onClose}>
          Cancel
        </Button>
        <Button variant='contained' disabled={saving || !source} onClick={() => void save()}>
          {saving ? 'Saving...' : 'Save & mark returned'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MarkRentReturnedDialog
