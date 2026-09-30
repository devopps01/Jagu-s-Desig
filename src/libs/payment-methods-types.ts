export type PaymentMethodType = 'cod' | 'upi' | 'bank' | 'online' | 'razorpay' | 'other'
export type PaymentMethodStatus = 'active' | 'inactive'

export type PaymentMethod = {
  id: string
  title: string
  type: PaymentMethodType
  details: string
  instructions: string
  sortOrder: number
  status: PaymentMethodStatus
}

export const PAYMENT_METHOD_TYPES: { id: PaymentMethodType; label: string }[] = [
  { id: 'cod', label: 'Cash on delivery' },
  { id: 'upi', label: 'UPI' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'online', label: 'Online / card' },
  { id: 'razorpay', label: 'Razorpay (UPI, card, EMI)' },
  { id: 'other', label: 'Other' }
]

export const paymentMethodTypeLabel = (type: string) =>
  PAYMENT_METHOD_TYPES.find(item => item.id === type)?.label || type

export const paymentMethodIcon = (type: string) => {
  if (type === 'cod') return 'tabler-cash'
  if (type === 'upi') return 'tabler-qrcode'
  if (type === 'bank') return 'tabler-building-bank'
  if (type === 'online' || type === 'razorpay') return 'tabler-credit-card'

  return 'tabler-wallet'
}
