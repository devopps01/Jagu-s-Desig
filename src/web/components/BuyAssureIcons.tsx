const icon = (src: string) => (
  <span className='vn-buy-icon-well'>
    <img className='vn-buy-icon' src={src} alt='' />
  </span>
)

export const HandmadeIcon = () => icon('/images/trust/trust-handmade.png?v=2')
export const ShippingIcon = () => icon('/images/trust/trust-shipping.png?v=2')
export const ExchangeIcon = () => icon('/images/trust/trust-exchange.png?v=2')
export const GlobalIcon = () => icon('/images/trust/trust-global.png?v=2')
