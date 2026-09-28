import { discountPercent } from '@web/data/catalog'

const Money = ({ value, strike = false }: { value: number; strike?: boolean }) => (
  <span className={`vn-money${strike ? ' is-mrp' : ''}`}>
    <strong>₹</strong>
    {value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
)

export const ProductPrices = ({
  sellingPrice,
  sellingMrp,
  rentPrice,
  rentMrp,
  listingType,
  compareAt,
  fallback
}: {
  sellingPrice?: number
  sellingMrp?: number
  rentPrice?: number
  rentMrp?: number
  listingType?: 'sale' | 'rent' | 'both'
  compareAt?: number
  fallback?: number
}) => {
  const isRent = listingType === 'rent'
  const price = isRent ? rentPrice || fallback || 0 : sellingPrice || fallback || rentPrice || 0
  const mrp = isRent ? rentMrp || compareAt || 0 : sellingMrp || compareAt || rentMrp || 0

  if (!price) return null

  const off = discountPercent(mrp, price)
  const saved = off ? Math.max(0, mrp - price) : 0

  return (
    <div className='vn-price'>
      <div className='vn-price-row'>
        <Money value={price} />
        {off ? (
          <>
            <span className='vn-compare'>
              <Money value={mrp} strike />
            </span>
            <span className='vn-off'>{off}% off</span>
          </>
        ) : null}
      </div>
      {saved ? <p className='vn-price-save'>You save ₹ {saved.toLocaleString('en-IN')}</p> : null}
    </div>
  )
}

export default ProductPrices
