import { formatPrice } from '@web/data/catalog'

const OrderBill = ({
  subtotal,
  discountCode,
  discountAmount,
  shipping = 0,
  gstAmount = 0,
  gstRate = 0,
  gstLabel = 'GST',
  total
}: {
  subtotal?: number
  discountCode?: string
  discountAmount?: number
  shipping?: number
  gstAmount?: number
  gstRate?: number
  gstLabel?: string
  total: number
}) => (
  <div className='vn-totals'>
    {subtotal ? (
      <div className='vn-totals-row'>
        <span>Item total</span>
        <strong>{formatPrice(subtotal)}</strong>
      </div>
    ) : null}
    {discountAmount ? (
      <div className='vn-totals-row is-save'>
        <span>Coupon {discountCode || ''}</span>
        <strong>− {formatPrice(discountAmount)}</strong>
      </div>
    ) : null}
    <div className='vn-totals-row'>
      <span>Shipping</span>
      <strong>{shipping ? formatPrice(shipping) : 'Free'}</strong>
    </div>
    {gstAmount ? (
      <div className='vn-totals-row'>
        <span>
          {gstLabel}
          {gstRate ? ` (${gstRate}%)` : ''}
        </span>
        <strong>{formatPrice(gstAmount)}</strong>
      </div>
    ) : null}
    <div className='vn-totals-row is-total'>
      <span>To pay</span>
      <strong>{formatPrice(total)}</strong>
    </div>
  </div>
)

export default OrderBill
