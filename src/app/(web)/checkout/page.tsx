'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

import { discountPercent, formatPrice } from '@web/data/catalog'
import { lineUnitPrice, useCart } from '@web/context/CartContext'
import { useLoginModal } from '@web/context/LoginModalContext'
import { AddressBook } from '@web/components/AddressBook'
import IndiaPlaceFields from '@web/components/IndiaPlaceFields'
import OrderReceived, { type OrderReceipt } from '@web/components/OrderReceived'
import type { SavedAddress } from '@/libs/addresses-types'
import { paymentMethodIcon, type PaymentMethod } from '@/libs/payment-methods-types'
import { offerAmount, type OfferType } from '@/libs/offers'
import { calcGstAmount, defaultGstSettings, type GstSettings } from '@/libs/gst-types'
import { loadRazorpay, openRazorpayCheckout, nationalMobile, razorpayContact } from '@web/lib/razorpay-checkout'

type AppliedDiscount = {
  code: string
  type: OfferType
  value: number
  label: string
  amount?: number
}

const money = (value: number) => Math.round((Number(value) || 0) * 100) / 100

const CheckoutPage = () => {
  const { lines, count, clearCart, setQty, removeItem } = useCart()
  const { user, ready, openLogin } = useLoginModal()
  const [placed, setPlaced] = useState(false)
  const [placedPaid, setPlacedPaid] = useState(false)
  const [placedNo, setPlacedNo] = useState('')
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [askPhone, setAskPhone] = useState(false)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState<AppliedDiscount | null>(null)
  const [couponError, setCouponError] = useState('')
  const [gst, setGst] = useState<GstSettings>(defaultGstSettings)
  const [locateStatus, setLocateStatus] = useState('')
  const [locating, setLocating] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    locality: '',
    city: '',
    state: '',
    pincode: ''
  })

  const breakdown = useMemo(() => {
    const sellingTotal = money(
      lines.reduce((sum, line) => sum + lineUnitPrice(line) * line.qty, 0)
    )
    const mrpTotal = money(
      lines.reduce((sum, line) => {
        const unit = lineUnitPrice(line)
        const mrp = line.product.sellingMrp && line.product.sellingMrp > unit ? line.product.sellingMrp : unit

        return sum + mrp * line.qty
      }, 0)
    )
    const productDiscount = money(Math.max(0, mrpTotal - sellingTotal))
    const couponDiscount = coupon
      ? money(offerAmount(sellingTotal, coupon.type, coupon.value) || coupon.amount || 0)
      : 0
    const shipping = 0
    const taxable = money(Math.max(0, sellingTotal - couponDiscount))
    const gstAmount = calcGstAmount(taxable, gst)
    const payable = money(Math.max(0, taxable + shipping + gstAmount))
    const saved = money(productDiscount + couponDiscount)

    return {
      mrpTotal,
      sellingTotal,
      productDiscount,
      couponDiscount,
      shipping,
      taxable,
      gstAmount,
      gstRate: gst.enabled ? gst.rate : 0,
      gstLabel: gst.label || 'GST',
      gstEnabled: gst.enabled && gstAmount > 0,
      payable,
      saved
    }
  }, [coupon, gst, lines])

  const selectedMethod = methods.find(item => item.id === paymentMethodId)

  const snapshotReceipt = (orderNo: string, paid: boolean): OrderReceipt => ({
    orderNo,
    paid,
    method: selectedMethod?.title || (paid ? 'Razorpay' : 'Cash on delivery'),
    items: lines.map(line => {
      const unit = lineUnitPrice(line)

      return {
        title: line.product.title,
        image: line.product.image,
        qty: line.qty,
        size: line.size || '',
        unit,
        lineTotal: money(unit * line.qty)
      }
    }),
    subtotal: breakdown.sellingTotal,
    discount: breakdown.couponDiscount,
    discountCode: coupon?.code || '',
    productSavings: breakdown.productDiscount,
    gst: breakdown.gstAmount,
    gstRate: breakdown.gstRate,
    gstLabel: breakdown.gstLabel,
    shipping: breakdown.shipping,
    total: breakdown.payable,
    name: form.name.trim(),
    phone: razorpayContact(form.phone) || form.phone,
    address: [form.address, form.locality, form.city, form.state, form.pincode].filter(Boolean).join(', ')
  })

  useEffect(() => {
    void loadRazorpay().catch(() => {})
  }, [])

  useEffect(() => {
    const upiMethod: PaymentMethod = {
      id: 'razorpay-upi',
      title: 'UPI',
      type: 'razorpay',
      details: 'GPay, PhonePe, Paytm or any UPI ID',
      instructions: 'Razorpay opens on UPI. Scan the QR or pay from your UPI app.',
      sortOrder: 0,
      status: 'active'
    }
    const razorpayMethod: PaymentMethod = {
      id: 'razorpay',
      title: 'Card or netbanking',
      type: 'razorpay',
      details: 'Debit card, credit card, EMI and netbanking',
      instructions: 'A secure Razorpay window opens. Login is not required.',
      sortOrder: 1,
      status: 'active'
    }

    Promise.all([
      fetch('/api/web/payment-methods').then(res => res.json()).catch(() => []),
      fetch('/api/web/payments/razorpay/config').then(res => res.json()).catch(() => ({ enabled: false }))
    ]).then(([json, config]) => {
      const rows = Array.isArray(json) ? (json as PaymentMethod[]) : []
      const enabled = Boolean(config?.enabled)
      const listed = rows.filter(item => {
        if (item.type === 'razorpay') return enabled
        if (enabled && (item.type === 'upi' || item.type === 'bank' || item.type === 'online')) return false

        return item.type === 'cod' || item.type === 'other'
      })

      if (enabled && !listed.some(item => item.id === 'razorpay')) listed.unshift(razorpayMethod)
      if (enabled && !listed.some(item => item.id === 'razorpay-upi')) listed.unshift(upiMethod)

      setMethods(listed)
      setPaymentMethodId(listed.find(item => item.id === 'razorpay-upi')?.id || listed.find(item => item.type === 'razorpay')?.id || listed[0]?.id || '')
    })

    fetch('/api/web/gst')
      .then(res => res.json())
      .then(json => setGst({ ...defaultGstSettings, ...json }))
      .catch(() => setGst(defaultGstSettings))
  }, [])

  const fillFromCoords = async (lat: number, lng: number) => {
    const res = await fetch(`/api/web/location?lat=${lat}&lng=${lng}`)
    const json = await res.json()

    if (!res.ok) throw new Error(json.message || 'Could not read this location')

    setForm(current => ({
      ...current,
      address: json.address || current.address,
      locality: json.locality || current.locality,
      city: json.city || current.city,
      state: json.state || current.state,
      pincode: json.pincode || current.pincode
    }))
    setLocateStatus('Address filled from your location. Edit if needed.')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateStatus('Location is not supported in this browser.')

      return
    }

    setLocating(true)
    setLocateStatus('Allow location access to auto-fill your address.')
    navigator.geolocation.getCurrentPosition(
      position => {
        void fillFromCoords(position.coords.latitude, position.coords.longitude)
          .catch(error => setLocateStatus(error instanceof Error ? error.message : 'Could not auto-fill address'))
          .finally(() => setLocating(false))
      },
      error => {
        setLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          setLocateStatus('Location permission denied. Enable it in the browser, or fill the address yourself.')
        } else {
          setLocateStatus('Could not get your location. Fill the address yourself.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  const applySavedAddress = useCallback((item: SavedAddress) => {
    setSelectedAddressId(item.id)
    setForm(current => ({
      name: item.name,
      phone: item.phone,
      email: current.email,
      address: item.address,
      locality: item.locality,
      city: item.city,
      state: item.state,
      pincode: item.pincode
    }))
  }, [])

  useEffect(() => {
    if (!user?.email) return

    setForm(current => (current.email ? current : { ...current, email: user.email }))
  }, [user?.email])

  useEffect(() => {
    if (!count || placed || !ready || user) return

    useCurrentLocation()
    // Guests only: ask once. Logged-in customers pick a saved address instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, placed, ready, user])

  const applyCoupon = async () => {
    setCouponError('')

    const res = await fetch('/api/web/discounts/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponInput, subtotal: breakdown.sellingTotal })
    })
    const json = await res.json()

    if (!json.ok) {
      setCoupon(null)
      setCouponError(json.message || 'Could not apply code')

      return
    }

    setCoupon({
      code: json.code,
      type: json.type === 'fixed' ? 'fixed' : 'percent',
      value: Number(json.value) || 0,
      amount: Number(json.amount) || 0,
      label: json.label || (json.type === 'fixed' ? `₹${json.value} off` : `${json.value}% off`)
    })
    setCouponInput('')
  }

  const payWithRazorpay = async () => {
    setSaving(true)

    const address = form.address.trim() || [form.locality, form.city, form.state, form.pincode].filter(Boolean).join(', ')

    const start = await fetch('/api/web/payments/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: { ...form, address, phone: razorpayContact(form.phone) },
        items: lines.map(line => ({ slug: line.product.slug, qty: line.qty, size: line.size || '' })),
        discountCode: coupon?.code || ''
      })
    })
    const payload = await start.json()

    if (!start.ok) {
      setSaving(false)
      setError(payload.message || 'Could not start payment')

      return
    }

    try {
      await loadRazorpay()
    } catch (loadError) {
      setSaving(false)
      setError(loadError instanceof Error ? loadError.message : 'Could not load the secure payment window')

      return
    }

    const contact = razorpayContact(form.phone)
    const email = (form.email || user?.email || '').trim()

    if (!contact || !email.includes('@')) {
      setSaving(false)
      if (!contact) setAskPhone(true)
      setError(!contact ? '' : 'Enter an email in Delivery details so payment can open.')

      return
    }

    let settled = false
    const upi = selectedMethod?.id === 'razorpay-upi'
    const checkout = openRazorpayCheckout({
      key: payload.keyId,
      amount: payload.amount,
      currency: 'INR',
      name: "Jagu's Designing",
      description: upi ? 'UPI payment' : 'Chaniya choli order',
      order_id: payload.orderId,
      remember_customer: false,
      prefill: {
        name: form.name.trim(),
        contact: `+91${contact}`,
        email,
        ...(upi ? { method: 'upi' as const } : {})
      },
      readonly: { name: true, contact: true, email: true },
      ...(upi
        ? {
            config: {
              display: {
                blocks: {
                  upi: {
                    name: 'Pay by UPI',
                    instruments: [
                      {
                        method: 'upi',
                        flows: ['intent', 'qr'],
                        apps: ['google_pay', 'phonepe', 'paytm', 'bhim']
                      }
                    ]
                  }
                },
                sequence: ['block.upi'],
                preferences: { show_default_blocks: false }
              }
            }
          }
        : {}),
      theme: { color: '#d82460' },
      method: { upi: true, card: !upi, netbanking: !upi, wallet: !upi, emi: !upi, paylater: false },
      modal: {
        ondismiss: () => {
          if (settled) return
          setSaving(false)
          setError('Payment window was closed. Your order was not placed.')
        }
      },
      handler: response => {
        settled = true
        void fetch('/api/web/payments/razorpay/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(response)
        })
          .then(async res => {
            const json = await res.json()

            if (!res.ok) {
              setSaving(false)
              setError(json.message || 'Payment could not be confirmed')

              return
            }

            setPlacedPaid(true)
            setPlaced(true)
            setPlacedNo(json.orderNo || '')
            setReceipt(snapshotReceipt(json.orderNo || '', true))
            clearCart()
            setSaving(false)
          })
          .catch(() => {
            setSaving(false)
            setError('Payment was received but the order could not be confirmed. Please contact the atelier with your payment reference.')
          })
      }
    })

    checkout.on('payment.failed', failed => {
      settled = true
      setSaving(false)
      setError(failed.error?.description || 'Payment failed. No order was placed.')
    })
    checkout.open()
  }

  const placeOrder = async () => {
    setError('')
    setSaving(true)

    const payOnline = selectedMethod?.type !== 'cod'

    if (!payOnline && !paymentMethodId) {
      setError('Choose a payment method')

      return
    }

    if (payOnline) {
      const phone = razorpayContact(form.phone)
      const missing = !form.name.trim() ? 'name' : !phone ? 'phone' : null

      if (missing === 'phone' || !phone) {
        setSaving(false)
        setAskPhone(true)

        return
      }

      if (missing) {
        setSaving(false)
        setError(missing === 'name' ? 'Enter your full name in Delivery details.' : '')

        return
      }

      if (!form.city.trim() || !form.state.trim() || form.pincode.replace(/\D/g, '').length !== 6) {
        setSaving(false)
        setError('Enter pincode, city and state, then Place order opens Razorpay.')

        return
      }

      await payWithRazorpay()

      return
    }

    setSaving(true)

    const res = await fetch('/api/web/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: form,
        items: lines.map(line => {
          const unit = lineUnitPrice(line)

          return {
            slug: line.product.slug,
            title: line.product.title,
            image: line.product.image,
            qty: line.qty,
            unit,
            mrp: line.product.sellingMrp || unit,
            lineTotal: unit * line.qty,
            size: line.size || ''
          }
        }),
        subtotal: breakdown.sellingTotal,
        productSavings: breakdown.productDiscount,
        discountCode: coupon?.code || '',
        paymentMethodId
      })
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not place order')

      return
    }

    setPlaced(true)
    setPlacedNo(json.orderNo || '')
    setReceipt(snapshotReceipt(json.orderNo || '', false))
    clearCart()
  }

  if (!count && !placed) {
    return (
      <section className='vn-section vn-checkout-page'>
        <div className='vn-page-hero'>
          <h1>Checkout</h1>
          <div className='vn-rule' />
        </div>
        <div className='vn-drawer-empty vn-cart-page-empty'>
          <p>Your bag is empty</p>
          <Link className='vn-btn vn-btn-solid' href='/collections/all'>
            Continue shopping
          </Link>
        </div>
      </section>
    )
  }

  if (placed && receipt) {
    return <OrderReceived receipt={receipt} />
  }

  if (placed) {
    return (
      <section className='vn-section vn-checkout-page'>
        <div className='vn-page-hero'>
          <h1>Order received</h1>
          <div className='vn-rule' />
        </div>
        <div className='vn-drawer-empty vn-cart-page-empty'>
          <p>Thank you{placedNo ? `. Order ${placedNo}` : ''}. {placedPaid ? 'Your Razorpay payment is confirmed.' : 'We will confirm on WhatsApp or phone shortly.'}</p>
          <div className='vn-account-actions' style={{ justifyContent: 'center' }}>
            {placedNo ? (
              <Link className='vn-btn vn-btn-solid' href={`/track-order?order=${placedNo}`}>
                Track order
              </Link>
            ) : null}
            <Link className='vn-btn vn-btn-outline' href='/account?tab=orders'>
              My orders
            </Link>
            <Link className='vn-btn vn-btn-outline' href='/collections/all'>
              Continue shopping
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className='vn-section vn-cart-wrap vn-checkout-page'>
      <div className='vn-page-hero'>
        <p className='vn-section-note'>Secure checkout</p>
        <h1>Checkout</h1>
        <div className='vn-rule' />
      </div>
      <div className='vn-checkout'>
        <div className='vn-checkout-main'>
          <section className='vn-checkout-card'>
            <h2>Your pieces</h2>
            <div className='vn-checkout-products'>
              {lines.map(line => {
                const unit = lineUnitPrice(line)
                const mrp = line.product.sellingMrp || 0
                const off = discountPercent(mrp, unit)

                return (
                  <article key={line.id} className='vn-checkout-product'>
                    <Link href={`/products/${line.product.slug}`} className='vn-cart-thumb'>
                      <img src={line.product.image} alt={line.product.title} />
                    </Link>
                    <div>
                      <h3>
                        <Link href={`/products/${line.product.slug}`}>{line.product.title}</Link>
                      </h3>
                      {line.size ? <p className='vn-cart-meta'>Size {line.size}</p> : null}
                      <p className='vn-cart-unit'>
                        {off ? <span className='vn-cart-mrp'>{formatPrice(mrp)}</span> : null}
                        <span>{formatPrice(unit)}</span>
                        {off ? <span className='vn-off'>{off}% off</span> : null}
                      </p>
                      <div className='vn-checkout-tools'>
                        <div className='vn-qty'>
                          <button type='button' aria-label='Decrease quantity' onClick={() => setQty(line.id, line.qty - 1)}>
                            −
                          </button>
                          <span>{line.qty}</span>
                          <button type='button' aria-label='Increase quantity' onClick={() => setQty(line.id, line.qty + 1)}>
                            +
                          </button>
                        </div>
                        <button className='vn-cart-remove' type='button' onClick={() => removeItem(line.id)} aria-label='Remove'>
                          <i className='tabler-trash' />
                        </button>
                      </div>
                    </div>
                    <strong>{formatPrice(unit * line.qty)}</strong>
                  </article>
                )
              })}
            </div>
          </section>

          <section className='vn-checkout-card'>
            <h2>Delivery address</h2>
            {user ? (
              <>
                <p className='vn-drawer-note'>Pick a saved address, or add a new one. Confirm the fields below for this order.</p>
                <AddressBook mode='pick' selectedId={selectedAddressId} onSelect={applySavedAddress} />
              </>
            ) : (
              <div className='vn-address-login'>
                <p className='vn-drawer-note'>Log in to pick from saved addresses, or fill the form below for this order.</p>
                <button className='vn-btn vn-btn-outline' type='button' onClick={openLogin}>
                  Login to use saved addresses
                </button>
              </div>
            )}
          </section>

          <form
            className='vn-checkout-form'
            noValidate
            onSubmit={event => {
              event.preventDefault()
              void placeOrder()
            }}
          >
            <div className='vn-checkout-block'>
              <h2>{user ? 'Confirm this order' : 'Delivery details'}</h2>
              <p className='vn-drawer-note'>
                {user
                  ? 'These details go on the bill. Edit them here if this order needs a small change.'
                  : 'Enter the delivery address. You can edit anything after auto-fill.'}
              </p>

              <div className='vn-field-row'>
                <label className='vn-field' data-pay='name'>
                  <span>Full name</span>
                  <input autoComplete='name' value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
                </label>
                <label className='vn-field'>
                  <span>Email</span>
                  <input type='email' autoComplete='email' value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} />
                </label>
              </div>

              <div className='vn-locate'>
                <button className='vn-btn vn-btn-outline vn-locate-btn' type='button' onClick={useCurrentLocation} disabled={locating}>
                  <i className='tabler-map-pin' />
                  {locating ? 'Detecting location…' : 'Use my location'}
                </button>
                {locateStatus ? <p className={locateStatus.includes('denied') || locateStatus.includes('Could not') ? 'vn-checkout-error' : 'vn-checkout-ok'}>{locateStatus}</p> : null}
              </div>

              <label className='vn-field'>
                <span>House / street</span>
                <textarea rows={3} autoComplete='street-address' value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} />
              </label>

              <label className='vn-field'>
                <span>Area / locality</span>
                <input autoComplete='address-level3' value={form.locality} onChange={event => setForm(current => ({ ...current, locality: event.target.value }))} />
              </label>

              <div data-pay='place'>
              <IndiaPlaceFields
                city={form.city}
                state={form.state}
                pincode={form.pincode}
                required={false}
                onChange={patch =>
                  setForm(current => ({
                    ...current,
                    city: patch.city !== undefined ? patch.city : current.city,
                    state: patch.state !== undefined ? patch.state : current.state,
                    pincode: patch.pincode !== undefined ? patch.pincode : current.pincode,
                    locality: current.locality || patch.locality || ''
                  }))
                }
              />
              </div>
            </div>

            <div className='vn-checkout-block'>
              <h2>Payment method</h2>
              <p className='vn-drawer-note'>
                {selectedMethod?.type === 'razorpay'
                  ? 'Pay now with UPI, card, netbanking or EMI. Razorpay opens in its own window. You do not need to log in.'
                  : 'Choose how you will pay. The atelier can change these options from the admin panel.'}
              </p>
              {methods.length ? (
                <div className='vn-pay-list'>
                  {methods.map(method => (
                    <label key={method.id} className={`vn-pay-card${paymentMethodId === method.id ? ' is-on' : ''}`}>
                      <input
                        type='radio'
                        name='paymentMethod'
                        value={method.id}
                        checked={paymentMethodId === method.id}
                        onChange={() => setPaymentMethodId(method.id)}
                      />
                      <span>
                        <strong>
                          <i className={method.id === 'razorpay-upi' ? 'tabler-qrcode' : paymentMethodIcon(method.type)} />
                          {method.title}
                        </strong>
                        {method.details ? <em>{method.details}</em> : null}
                        {method.instructions ? <small>{method.instructions}</small> : null}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className='vn-checkout-error'>No payment method is available right now. Please write to the atelier.</p>
              )}
            </div>

            {selectedMethod?.type !== 'cod' ? (
              <label className={`vn-field${askPhone && !razorpayContact(form.phone) ? ' is-missing' : ''}`}>
                <span>Mobile number</span>
                <input
                  inputMode='tel'
                  autoComplete='tel'
                  placeholder='8488973133 or +91 8488973133'
                  value={nationalMobile(form.phone)}
                  onChange={event => {
                    setAskPhone(false)
                    setError('')
                    setForm(current => ({ ...current, phone: nationalMobile(event.target.value) }))
                  }}
                />
                {askPhone && !razorpayContact(form.phone) ? (
                  <small className='vn-checkout-error'>Use a 10-digit mobile. +91 is added automatically.</small>
                ) : (
                  <small className='vn-drawer-note'>{razorpayContact(form.phone) ? `Paying with +91 ${razorpayContact(form.phone)}` : 'You can type +91. Only the 10-digit number is kept.'}</small>
                )}
              </label>
            ) : null}

            {error ? <p className='vn-checkout-error'>{error}</p> : null}
            <button className='vn-btn vn-btn-solid vn-drawer-cta' type='button' disabled={saving || !methods.length} onClick={() => void placeOrder()}>
              {saving ? (selectedMethod?.type === 'cod' ? 'Placing order…' : 'Opening payment…') : `Place order · ${formatPrice(breakdown.payable)}`}
            </button>
            {selectedMethod?.type !== 'cod' ? (
              <p className='vn-drawer-note'>Place order opens Razorpay so you can pay by UPI, card, netbanking or EMI.</p>
            ) : null}
            <Link className='vn-btn vn-btn-outline vn-drawer-cta' href='/cart'>
              Back to cart
            </Link>
          </form>
        </div>

        <aside className='vn-cart-summary'>
          <h2>Order summary</h2>
          {!coupon ? (
            <div className='vn-coupon'>
              <input
                placeholder='Discount code'
                value={couponInput}
                onChange={event => setCouponInput(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    void applyCoupon()
                  }
                }}
              />
              <button className='vn-btn vn-btn-outline' type='button' onClick={() => void applyCoupon()}>
                Apply
              </button>
            </div>
          ) : null}
          {couponError ? <p className='vn-checkout-error'>{couponError}</p> : null}
          <div className='vn-totals'>
            <div className='vn-totals-row'>
              <span>Items</span>
              <strong>
                {count} {count === 1 ? 'item' : 'items'}
              </strong>
            </div>
            {breakdown.productDiscount ? (
              <div className='vn-totals-row is-mrp'>
                <span>MRP</span>
                <strong>{formatPrice(breakdown.mrpTotal)}</strong>
              </div>
            ) : null}
            {breakdown.productDiscount ? (
              <div className='vn-totals-row is-save'>
                <span>Product discount</span>
                <strong>− {formatPrice(breakdown.productDiscount)}</strong>
              </div>
            ) : null}
            <div className='vn-totals-row'>
              <span>Item total</span>
              <strong>{formatPrice(breakdown.sellingTotal)}</strong>
            </div>
            {coupon ? (
              <div className='vn-totals-row is-save'>
                <span className='vn-coupon-line'>
                  <span>
                    Coupon {coupon.code}
                    {coupon.label ? ` · ${coupon.label}` : ''}
                  </span>
                  <button className='vn-text-btn' type='button' onClick={() => setCoupon(null)}>
                    Remove
                  </button>
                </span>
                <strong>− {formatPrice(breakdown.couponDiscount)}</strong>
              </div>
            ) : null}
            <div className='vn-totals-row'>
              <span>Shipping</span>
              <strong>{breakdown.shipping ? formatPrice(breakdown.shipping) : 'Free'}</strong>
            </div>
            {breakdown.gstEnabled ? (
              <div className='vn-totals-row'>
                <span>
                  {breakdown.gstLabel} ({breakdown.gstRate}%)
                </span>
                <strong>{formatPrice(breakdown.gstAmount)}</strong>
              </div>
            ) : null}
            <div className='vn-totals-row'>
              <span>Payment</span>
              <strong>{selectedMethod?.title || '—'}</strong>
            </div>
            <div className='vn-totals-row is-total'>
              <span>To pay</span>
              <strong>{formatPrice(breakdown.payable)}</strong>
            </div>
          </div>
          {breakdown.saved ? (
            <p className='vn-checkout-ok vn-save-note'>You save {formatPrice(breakdown.saved)} on this order</p>
          ) : null}
          <p className='vn-drawer-note vn-summary-tax'>
            {breakdown.gstEnabled
              ? `${breakdown.gstLabel} at ${breakdown.gstRate}% is added on the taxable amount after discounts.`
              : 'Product discount is already taken off the selling price.'}
          </p>
        </aside>
      </div>
    </section>
  )
}

export default CheckoutPage
