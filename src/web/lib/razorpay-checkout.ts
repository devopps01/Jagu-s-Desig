type RazorpaySuccess = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayFailure = {
  error?: { description?: string }
}

type RazorpayInstance = {
  open: () => void
  on: (event: 'payment.failed', handler: (payload: RazorpayFailure) => void) => void
}

type RazorpayCheckoutOptions = {
  key: string
  amount: number
  currency: 'INR'
  name: string
  description: string
  order_id: string
  prefill?: { name?: string; contact?: string; email?: string; method?: 'upi' | 'card' | 'netbanking' }
  config?: {
    display: {
      blocks: Record<string, { name: string; instruments: { method: string; flows?: string[]; apps?: string[] }[] }>
      sequence: string[]
      preferences: { show_default_blocks: boolean }
    }
  }
  readonly?: { name?: boolean; contact?: boolean; email?: boolean }
  hidden?: { contact?: boolean; email?: boolean }
  remember_customer?: boolean
  theme?: { color?: string }
  method?: Record<string, boolean>
  handler: (response: RazorpaySuccess) => void
  modal?: { ondismiss?: () => void }
}

export const nationalMobile = (phone: string) => {
  let digits = phone.replace(/\D/g, '')

  if (digits.startsWith('91') && digits.length > 10) digits = digits.slice(2)
  if (digits.startsWith('0')) digits = digits.slice(1)

  return digits.slice(0, 10)
}

export const razorpayContact = (phone: string) => {
  const local = nationalMobile(phone)

  return /^[6-9]\d{9}$/.test(local) ? local : ''
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance
  }
}

export const loadRazorpay = () =>
  new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve()

      return
    }

    const script = document.createElement('script')

    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load the secure payment window'))
    document.body.appendChild(script)
  })

export const openRazorpayCheckout = (options: RazorpayCheckoutOptions) => {
  if (!window.Razorpay) throw new Error('Could not load the secure payment window')

  return new window.Razorpay(options)
}
