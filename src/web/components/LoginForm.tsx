'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const LoginForm = ({
  variant = 'page',
  onSuccess,
  redirectTo = '/'
}: {
  variant?: 'page' | 'modal'
  onSuccess?: () => void
  redirectTo?: string
}) => {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return

    const timer = setInterval(() => setSecondsLeft(value => value - 1), 1000)

    return () => clearInterval(timer)
  }, [secondsLeft])

  const sendOtp = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const res = await fetch('/api/web/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.message || 'Could not send OTP')

      return
    }

    setStep('otp')
    setSecondsLeft(60)
    setMessage(data.message)
  }

  const verifyOtp = async () => {
    setLoading(true)
    setError('')

    const res = await fetch('/api/web/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    const data = await res.json()

    setLoading(false)

    if (!res.ok) {
      setError(data.message || 'OTP login failed')

      return
    }

    if (onSuccess) {
      onSuccess()

      return
    }

    router.replace(redirectTo.startsWith('/') ? redirectTo : '/')
    router.refresh()
  }

  const form = (
    <form
      className='vn-form'
      onSubmit={event => {
        event.preventDefault()
        if (step === 'email') void sendOtp()
        else void verifyOtp()
      }}
    >
      <input
        type='email'
        placeholder='Email'
        required
        value={email}
        onChange={event => setEmail(event.target.value)}
        disabled={step === 'otp'}
      />
      {step === 'otp' ? (
        <input
          inputMode='numeric'
          placeholder='6-digit OTP'
          required
          maxLength={6}
          value={otp}
          onChange={event => setOtp(event.target.value)}
        />
      ) : null}
      {message ? <p>{message}</p> : null}
      {error ? <p style={{ color: '#b42318' }}>{error}</p> : null}
      {step === 'otp' ? (
        <p>{secondsLeft > 0 ? `OTP expires in ${secondsLeft}s` : 'OTP expired. Request a new one.'}</p>
      ) : null}
      <button className='vn-btn vn-btn-solid' type='submit' disabled={loading}>
        {step === 'email' ? 'Send OTP' : 'Verify OTP'}
      </button>
      {step === 'otp' ? (
        <button className='vn-btn' type='button' disabled={loading || secondsLeft > 0} onClick={() => void sendOtp()}>
          Resend OTP
        </button>
      ) : null}
    </form>
  )

  if (variant === 'modal') {
    return form
  }

  return (
    <section className='vn-section'>
      <div className='vn-page-hero'>
        <h1>Login</h1>
        <div className='vn-rule' />
        <p>Sign in with your email and a 1-minute OTP</p>
      </div>
      {form}
    </section>
  )
}

export default LoginForm
