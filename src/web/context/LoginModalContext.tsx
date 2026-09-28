'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type WebUser = { id: string; email: string; referralCode?: string }

type LoginModalContextValue = {
  isOpen: boolean
  user: WebUser | null
  ready: boolean
  openLogin: () => void
  closeLogin: () => void
  refreshUser: () => Promise<void>
}

const LoginModalContext = createContext<LoginModalContextValue | null>(null)

export const LoginModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<WebUser | null>(null)
  const [ready, setReady] = useState(false)

  const refreshUser = async () => {
    const res = await fetch('/api/web/auth/me')

    if (!res.ok) {
      setUser(null)
      setReady(true)

      return
    }

    const data = await res.json()

    setUser(data.user)
    setReady(true)
  }

  useEffect(() => {
    void refreshUser()
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      user,
      ready,
      openLogin: () => setIsOpen(true),
      closeLogin: () => setIsOpen(false),
      refreshUser
    }),
    [isOpen, ready, user]
  )

  return <LoginModalContext.Provider value={value}>{children}</LoginModalContext.Provider>
}

export const useLoginModal = () => {
  const context = useContext(LoginModalContext)

  if (!context) {
    throw new Error('useLoginModal must be used inside LoginModalProvider')
  }

  return context
}
