'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Fade from '@mui/material/Fade'
import Typography from '@mui/material/Typography'
import type { TransitionProps } from '@mui/material/transitions'
import { forwardRef, type ReactElement, type Ref } from 'react'

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: ReactElement<any, any> },
  ref: Ref<unknown>
) {
  return <Fade ref={ref} {...props} timeout={220} />
})

export type ConfirmActionDialogProps = {
  open: boolean
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

const ConfirmActionDialog = ({
  open,
  title = 'Please confirm',
  message,
  confirmLabel = 'Remove',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onClose
}: ConfirmActionDialogProps) => (
  <Dialog
    open={open}
    onClose={loading ? undefined : onClose}
    TransitionComponent={Transition}
    keepMounted
    fullWidth
    maxWidth='xs'
    aria-labelledby='confirm-action-title'
    slotProps={{
      backdrop: {
        sx: {
          backgroundColor: 'rgba(15, 18, 28, 0.62)',
          backdropFilter: 'blur(4px)'
        }
      }
    }}
    PaperProps={{
      elevation: 0,
      sx: {
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        m: 2
      }
    }}
  >
    <DialogContent sx={{ pt: 4, px: 4, pb: 2, textAlign: 'center' }}>
      <Box
        sx={{
          width: 64,
          height: 64,
          mx: 'auto',
          mb: 2.5,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          bgcolor: theme => (theme.palette.mode === 'dark' ? 'rgba(255,76,81,0.16)' : 'rgba(255,76,81,0.1)'),
          color: 'error.main',
          animation: open ? 'confirmPop .28s ease' : 'none',
          '@keyframes confirmPop': {
            '0%': { transform: 'scale(0.72)', opacity: 0 },
            '100%': { transform: 'scale(1)', opacity: 1 }
          }
        }}
      >
        <i className='tabler-trash text-3xl' />
      </Box>
      <Typography id='confirm-action-title' variant='h5' className='mbe-2'>
        {title}
      </Typography>
      <Typography color='text.secondary' sx={{ lineHeight: 1.6 }}>
        {message}
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 4, pb: 3.5, pt: 1, justifyContent: 'center', gap: 1.5 }}>
      <Button variant='tonal' color='secondary' disabled={loading} onClick={onClose} sx={{ minWidth: 110 }}>
        {cancelLabel}
      </Button>
      <Button variant='contained' color='error' disabled={loading} onClick={onConfirm} sx={{ minWidth: 110 }} autoFocus>
        {confirmLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default ConfirmActionDialog
