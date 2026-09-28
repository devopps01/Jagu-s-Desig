'use client'

import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'

import { discountPercent, formatPrice } from '@web/data/catalog'
import type { RentBooking } from '@/libs/rentals'

export type PreviewProduct = {
  slug: string
  name?: string
  imageUrl?: string
  sellingPrice?: number
  rentPrice?: number
  sellingMrp?: number
  rentMrp?: number
}

const statusColor = (status: RentBooking['status']) => {
  if (status === 'ongoing') return 'warning'
  if (status === 'returned') return 'success'
  if (status === 'cancelled') return 'default'

  return 'info'
}

const PriceLine = ({ label, price, mrp }: { label: string; price?: number; mrp?: number }) => {
  const value = Number(price) || 0

  if (!value) return null

  const off = discountPercent(Number(mrp), value)

  return (
    <div className='flex items-center justify-between gap-3'>
      <Typography color='text.secondary'>{label}</Typography>
      <Typography fontWeight={700}>
        {formatPrice(value)}
        {off ? (
          <Chip size='small' color='error' label={`${off}% off`} sx={{ ml: 1 }} />
        ) : null}
      </Typography>
    </div>
  )
}

const InfoRow = ({ label, value }: { label: string; value?: string }) => {
  if (!value) return null

  return (
    <div className='flex items-start justify-between gap-4'>
      <Typography color='text.secondary'>{label}</Typography>
      <Typography fontWeight={600} className='text-right'>
        {value}
      </Typography>
    </div>
  )
}

const RentPreviewDialog = ({
  open,
  booking,
  product,
  onClose,
  onEdit
}: {
  open: boolean
  booking: RentBooking | null
  product?: PreviewProduct | null
  onClose: () => void
  onEdit: () => void
}) => {
  if (!booking) return null

  const image = product?.imageUrl || booking.productImage
  const rentPrice = Number(product?.rentPrice) || 0
  const sellingPrice = Number(product?.sellingPrice) || 0

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogContent className='p-0'>
        <div className='relative'>
          {image ? (
            <img src={image} alt={booking.productName} className='is-full' style={{ height: 320, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div className='flex items-center justify-center bg-actionHover' style={{ height: 220 }}>
              <i className='tabler-photo text-4xl' />
            </div>
          )}
          <IconButton onClick={onClose} className='absolute' sx={{ top: 12, right: 12, bgcolor: 'background.paper' }}>
            <i className='tabler-x' />
          </IconButton>
          <Chip
            size='small'
            color={statusColor(booking.status)}
            label={booking.status}
            className='absolute'
            sx={{ top: 16, left: 16, textTransform: 'capitalize' }}
          />
        </div>
        <div className='flex flex-col gap-4 p-6'>
          <div>
            <Typography variant='h5' className='mbe-1'>
              {booking.productName}
            </Typography>
            <Typography color='text.secondary'>Size {booking.size}</Typography>
          </div>
          <div className='flex flex-col gap-2 rounded p-4' style={{ background: 'var(--mui-palette-action-hover)' }}>
            <PriceLine label='Rent price' price={rentPrice} mrp={product?.rentMrp} />
            <PriceLine label='Selling price' price={sellingPrice} mrp={product?.sellingMrp} />
            {!rentPrice && !sellingPrice ? <Typography color='text.secondary'>Price not set</Typography> : null}
          </div>
          <div className='flex flex-col gap-3'>
            <InfoRow label='Period' value={`${booking.startDate} ${booking.startTime || ''} → ${booking.endDate} ${booking.endTime || ''}`} />
            <InfoRow label='Customer' value={booking.customerName} />
            <InfoRow label='Phone' value={booking.customerPhone} />
            <InfoRow label='Email' value={booking.customerEmail} />
            <InfoRow label='Notes' value={booking.notes} />
          </div>
          <Divider />
          <div className='flex justify-end gap-3'>
            <Button variant='tonal' color='secondary' onClick={onClose}>
              Close
            </Button>
            <Button variant='contained' startIcon={<i className='tabler-edit' />} onClick={onEdit}>
              Edit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default RentPreviewDialog
