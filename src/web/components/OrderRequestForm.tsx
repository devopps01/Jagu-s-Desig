'use client'

import { useState } from 'react'

import { cancelReasons, returnReasons, type OrderRequestType } from '@/libs/order-request-types'

const OrderRequestForm = ({
  type,
  orderId,
  orderNo,
  phone,
  onDone
}: {
  type: OrderRequestType
  orderId?: string
  orderNo?: string
  phone?: string
  onDone: () => void
}) => {
  const reasons = type === 'cancel' ? cancelReasons : returnReasons
  const [reason, setReason] = useState(reasons[0].id)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/web/orders/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, orderId, orderNo, phone, reason, note })
    })
    const json = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(json.message || 'Could not submit request')

      return
    }

    onDone()
  }

  return (
    <form
      className='vn-form vn-order-request'
      onSubmit={event => {
        event.preventDefault()
        void submit()
      }}
    >
      <select value={reason} onChange={event => setReason(event.target.value as typeof reason)}>
        {reasons.map(item => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <textarea
        rows={4}
        placeholder={type === 'cancel' ? 'Anything we should know?' : 'Describe the issue. Keep tags on if you can.'}
        value={note}
        onChange={event => setNote(event.target.value)}
      />
      {error ? <p className='vn-contact-error'>{error}</p> : null}
      <button className='vn-btn vn-btn-solid' type='submit' disabled={loading}>
        {loading ? 'Sending…' : type === 'cancel' ? 'Request cancel' : 'Request return'}
      </button>
    </form>
  )
}

export default OrderRequestForm
