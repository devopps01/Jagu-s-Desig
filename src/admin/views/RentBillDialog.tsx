'use client'

import { useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { pdf } from '@react-pdf/renderer'

import RentBillPdf from '@admin/views/RentBillPdf'
import { billHeading, billPayments, rentBillNo, rentDayLabel, rentMoney, rentPayable, type RentBill } from '@admin/views/rentBill'

const BillTotals = ({ bill }: { bill: RentBill }) => {
  const subtotal = Math.max(0, Math.round(bill.finalPrice || 0))
  const discount = Math.min(subtotal, Math.max(0, Math.round(bill.discountAmount || 0)))
  const payments = billPayments(bill)

  return (
    <Box sx={{ display: 'grid', gap: 0.5, pt: 0.75, borderTop: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant='body2'>Subtotal</Typography>
        <Typography variant='body2'>{rentMoney(subtotal)}</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography variant='body2'>Discount</Typography>
        <Typography variant='body2' fontWeight={700}>
          {discount > 0 ? `- ${rentMoney(discount)}` : rentMoney(0)}
        </Typography>
      </Box>
      {bill.gstAmount ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant='body2'>GST{bill.gstRate ? ` (${bill.gstRate}%)` : ''}</Typography>
          <Typography variant='body2'>{rentMoney(bill.gstAmount)}</Typography>
        </Box>
      ) : null}
      {payments.map((line, index) => (
        <Box key={`${line.method}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Typography variant='body2'>Paid by {line.method}</Typography>
          <Typography variant='body2'>{rentMoney(line.amount)}</Typography>
        </Box>
      ))}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography fontWeight={700}>Total</Typography>
        <Typography fontWeight={700}>{rentMoney(rentPayable(bill))}</Typography>
      </Box>
    </Box>
  )
}

const RentBillDialog = ({ open, bill, onClose }: { open: boolean; bill: RentBill | null; onClose: () => void }) => {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!open || !bill) return

    let live = true
    let objectUrl = ''

    setUrl('')
    setFailed(false)

    void pdf(<RentBillPdf bill={bill} />)
      .toBlob()
      .then(blob => {
        if (!live) return

        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (live) setFailed(true)
      })

    return () => {
      live = false

      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [bill, open])

  const download = () => {
    if (!url || !bill) return

    const link = document.createElement('a')

    link.href = url
    link.download = `${rentBillNo(bill.id)}.pdf`
    link.click()
  }

  const printBill = () => {
    if (!url) return

    const frame = document.createElement('iframe')

    frame.style.position = 'fixed'
    frame.style.width = '0'
    frame.style.height = '0'
    frame.style.border = '0'
    frame.src = url
    document.body.appendChild(frame)
    frame.onload = () => {
      frame.contentWindow?.focus()
      frame.contentWindow?.print()
      window.setTimeout(() => frame.remove(), 1500)
    }
  }

  return (
    <Dialog open={open && Boolean(bill)} onClose={onClose} fullWidth maxWidth='md' fullScreen={fullScreen}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          component='img'
          src='/images/brand/jagu-logo.png'
          alt=''
          sx={{ height: 52, width: 'auto', display: 'block', objectFit: 'contain', flexShrink: 0 }}
        />
        {bill?.kind === 'sale' ? 'Sale' : 'Rent'} bill {bill ? (bill.kind === 'sale' ? billHeading(bill) : rentBillNo(bill.id)) : ''}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {bill?.kind === 'sale' && bill.lines?.length ? (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Outfit</TableCell>
                    <TableCell>Size</TableCell>
                    <TableCell align='right'>Qty</TableCell>
                    <TableCell align='right'>Price</TableCell>
                    <TableCell align='right'>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bill.lines.map((line, index) => {
                    const qty = Math.max(1, line.quantity || 1)
                    const amount = Math.max(0, Math.round(line.price || 0))

                    return (
                      <TableRow key={`${line.productNo}-${index}`}>
                        <TableCell>
                          <Typography variant='body2' fontWeight={600}>
                            {line.name}
                          </Typography>
                          {line.productNo ? (
                            <Typography variant='caption' color='text.secondary'>
                              #{line.productNo}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell>{line.size}</TableCell>
                        <TableCell align='right'>{qty}</TableCell>
                        <TableCell align='right'>{rentMoney(Math.round(amount / qty))}</TableCell>
                        <TableCell align='right'>{rentMoney(amount)}</TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography fontWeight={700}>Subtotal</Typography>
                    </TableCell>
                    <TableCell align='right'>
                      <Typography fontWeight={700}>{rentMoney(bill.lines.reduce((sum, line) => sum + Math.max(0, Math.round(line.price || 0)), 0))}</Typography>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <BillTotals bill={bill} />
          </Box>
        ) : bill?.lines && bill.lines.length > 1 ? (
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            {bill.lines.map((line, index) => (
              <Box key={`${line.productNo}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Typography variant='body2'>
                  {`${line.name} · Size ${line.size} · ${rentDayLabel(line.startDate)} – ${rentDayLabel(line.endDate)}`}
                </Typography>
                <Typography variant='body2' fontWeight={700}>
                  {rentMoney(line.price)}
                </Typography>
              </Box>
            ))}
            <BillTotals bill={bill} />
          </Box>
        ) : bill ? (
          <Box sx={{ display: 'grid', gap: 0.75 }}>
            <Typography color='text.secondary'>
              {bill.kind === 'sale'
                ? `${bill.customerName} · ${bill.productName} · Size ${bill.size} · Qty ${Math.max(1, bill.quantity || 1)}`
                : `${bill.customerName} · ${bill.productName} · Size ${bill.size} · ${rentDayLabel(bill.startDate)} – ${rentDayLabel(bill.endDate)}`}
            </Typography>
            <BillTotals bill={bill} />
          </Box>
        ) : null}
        {url ? (
          <iframe title='Rent bill preview' src={url} style={{ width: '100%', height: fullScreen ? '70vh' : '68vh', border: 0, borderRadius: 8 }} />
        ) : (
          <Typography color={failed ? 'error.main' : 'text.secondary'}>{failed ? 'The bill could not be prepared.' : 'Preparing the bill...'}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
        <Button type='button' onClick={onClose} startIcon={<i className='tabler-check' />}>
          Done
        </Button>
        <Button type='button' variant='tonal' onClick={printBill} disabled={!url} startIcon={<i className='tabler-printer' />}>
          Print
        </Button>
        <Button type='button' variant='contained' onClick={download} disabled={!url} startIcon={<i className='tabler-download' />}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RentBillDialog
