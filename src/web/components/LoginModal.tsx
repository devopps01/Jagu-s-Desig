'use client'

import LoginForm from '@web/components/LoginForm'
import { useLoginModal } from '@web/context/LoginModalContext'

const LoginModal = () => {
  const { isOpen, closeLogin, refreshUser } = useLoginModal()

  if (!isOpen) return null

  return (
    <div className='vn-modal-backdrop' onClick={closeLogin}>
      <div className='vn-modal' onClick={event => event.stopPropagation()}>
        <div className='vn-modal-head'>
          <h2>Login</h2>
          <button className='vn-icon-btn' type='button' onClick={closeLogin} aria-label='Close'>
            <i className='tabler-x' />
          </button>
        </div>
        <p>Sign in with your email and a 1-minute OTP to keep your bag, orders and offers.</p>
        <LoginForm
          variant='modal'
          onSuccess={() => {
            void refreshUser()
            closeLogin()
          }}
        />
      </div>
    </div>
  )
}

export default LoginModal
