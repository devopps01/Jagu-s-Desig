export const linePayable = (row: { finalPrice?: number; discountAmount?: number; gstAmount?: number }) => {
  const subtotal = Math.max(0, Math.round(Number(row.finalPrice) || 0))
  const discount = Math.min(subtotal, Math.max(0, Math.round(Number(row.discountAmount) || 0)))

  return Math.max(0, subtotal - discount + Math.round(Number(row.gstAmount) || 0))
}

export const refundFromFee = (paid: unknown, fee: unknown) => {
  const paidAmount = Math.max(0, Math.round(Number(paid) || 0))
  const returnFee = Math.min(paidAmount, Math.max(0, Math.round(Number(fee) || 0)))

  return { paidAmount, returnFee, refundAmount: paidAmount - returnFee }
}

export const settleCancel = (paid: unknown, returnFee?: unknown, refundAmount?: unknown) => {
  const paidAmount = Math.max(0, Math.round(Number(paid) || 0))
  const fee = Math.min(paidAmount, Math.max(0, Math.round(Number(returnFee) || 0)))
  const refund =
    refundAmount === undefined || refundAmount === null || refundAmount === ''
      ? paidAmount - fee
      : Math.min(paidAmount - fee, Math.max(0, Math.round(Number(refundAmount) || 0)))

  return { returnFee: fee, refundAmount: refund }
}

export const billSettlement = (paidBefore: number, billNow: number, feeInput: unknown, chargeInput: unknown) => {
  const paid = Math.max(0, Math.round(Number(paidBefore) || 0))
  const now = Math.max(0, Math.round(Number(billNow) || 0))
  const extra = Math.max(0, paid - now)
  const due = Math.max(0, now - paid)
  const fee = Math.min(extra, Math.max(0, Math.round(Number(feeInput) || 0)))
  const charge = Math.min(due, Math.max(0, Math.round(Number(chargeInput) || 0)))

  return { paid, billNow: now, extra, due, fee, refund: extra - fee, charge, stillDue: due - charge }
}
