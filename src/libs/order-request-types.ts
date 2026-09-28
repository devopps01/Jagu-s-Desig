export type OrderRequestType = 'cancel' | 'return'
export type OrderRequestStatus = 'requested' | 'approved' | 'rejected' | 'completed'

export type OrderRequestReason =
  | 'changed_mind'
  | 'wrong_item'
  | 'delay'
  | 'size_fit'
  | 'quality'
  | 'damaged'
  | 'not_as_shown'
  | 'other'

export const cancelReasons: { id: OrderRequestReason; label: string }[] = [
  { id: 'changed_mind', label: 'Changed my mind' },
  { id: 'wrong_item', label: 'Ordered by mistake' },
  { id: 'delay', label: 'Taking too long' },
  { id: 'other', label: 'Other' }
]

export const returnReasons: { id: OrderRequestReason; label: string }[] = [
  { id: 'size_fit', label: 'Size or fit issue' },
  { id: 'quality', label: 'Quality issue' },
  { id: 'damaged', label: 'Arrived damaged' },
  { id: 'not_as_shown', label: 'Not as shown' },
  { id: 'other', label: 'Other' }
]

export const RETURN_DAYS = 7

export const daysSince = (value?: Date | string) => {
  if (!value) return 999

  return Math.floor((Date.now() - new Date(value).getTime()) / (24 * 60 * 60 * 1000))
}

export const canCancelOrder = (status: string, requestStatus?: string) =>
  ['pending', 'confirmed', 'packed'].includes(status) && !['requested', 'approved'].includes(requestStatus || '')

export const canReturnOrder = (status: string, deliveredAt?: Date | string, requestStatus?: string) =>
  status === 'delivered' &&
  daysSince(deliveredAt) <= RETURN_DAYS &&
  !['requested', 'approved'].includes(requestStatus || '')

/** Delivered orders can leave/update a product review. */
export const canReviewOrder = (status: string) => status === 'delivered'
