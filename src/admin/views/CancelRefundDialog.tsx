'use client'

import { useEffect, useState } from 'react'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'

import CustomTextField from '@core/components/mui/TextField'
import { refundFromFee } from '@/libs/return-fee'

const rupee = (value: number) => `₹${Math.max(0, Math.round(value)).toLocaleString('en-IN')}`

const PERCENTS = [0, 10, 25, 50, 100]

type CancelRefundDialogProps = {
  open: boolean
  outfit: string
  detail: string
  payable: number
  paid: number
  onClose: () => void
  onConfirm: (returnFee: number) => Promise<void>
}

const CancelRefundDialog = ({ open, outfit, detail, payable, paid, onClose, onConfirm }: CancelRefundDialogProps) => {
  const [feeText, setFeeText] = useState('0')
  const [saving, setSaving] = useState(false)
  const quote = refundFromFee(paid, feeText)
  const typed = Math.max(0, Math.round(Number(feeText) || 0))

  useEffect(() => {
    if (open) setFeeText('0')
  }, [open, outfit])

  const save = async () => {
    setSaving(true)

    try {
      await onConfirm(quote.returnFee)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Cancel this outfit?</DialogTitle>
      <DialogContent>
        <Typography color='text.secondary' className='mbe-4'>
          {detail}
        </Typography>
        <Typography fontWeight={600}>{outfit}</Typography>
        <div className='flex flex-col gap-2 mbs-4'>
          <div className='flex justify-between gap-4'>
            <Typography color='text.secondary'>Outfit total</Typography>
            <Typography>{rupee(payable)}</Typography>
          </div>
          <div className='flex justify-between gap-4'>
            <Typography color='text.secondary'>Already paid</Typography>
            <Typography>{rupee(quote.paidAmount)}</Typography>
          </div>
        </div>
        <Typography variant='body2' color='text.secondary' className='mbs-4 mbe-2'>
          Return fee is taken from the amount already paid. The rest is returned to the customer.
        </Typography>
        <div className='flex flex-wrap gap-2 mbe-3'>
          {PERCENTS.map(percent => (
            <Button
              key={percent}
              size='small'
              variant={quote.returnFee === Math.round((quote.paidAmount * percent) / 100) ? 'contained' : 'tonal'}
              disabled={saving || quote.paidAmount === 0}
              onClick={() => setFeeText(String(Math.round((quote.paidAmount * percent) / 100)))}
            >
              {percent}%
            </Button>
          ))}
        </div>
        <CustomTextField
          fullWidth
          type='number'
          label='Return fee'
          value={feeText}
          disabled={saving || quote.paidAmount === 0}
          onChange={event => setFeeText(event.target.value)}
          helperText={
            quote.paidAmount === 0
              ? 'Nothing was paid, so there is nothing to return.'
              : typed > quote.paidAmount
                ? 'Return fee cannot be more than the amount paid.'
                : 'Percent is of the amount already paid.'
          }
          slotProps={{ htmlInput: { min: 0, max: quote.paidAmount } }}
        />
        <div className='flex flex-col gap-2 mts-4'>
          <div className='flex justify-between gap-4'>
            <Typography color='text.secondary'>Return fee kept</Typography>
            <Typography>{rupee(quote.returnFee)}</Typography>
          </div>
          <div className='flex justify-between gap-4'>
            <Typography fontWeight={700}>Amount to return</Typography>
            <Typography fontWeight={700}>{rupee(quote.refundAmount)}</Typography>
          </div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button variant='tonal' color='secondary' disabled={saving} onClick={onClose}>
          Keep outfit
        </Button>
        <Button variant='contained' color='error' disabled={saving} onClick={() => void save()}>
          Cancel and return
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CancelRefundDialog
