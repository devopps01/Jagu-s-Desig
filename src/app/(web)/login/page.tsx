'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import LoginForm from '@web/components/LoginForm'
import { useLoginModal } from '@web/context/LoginModalContext'

const LoginDesk = () => {
  const router = useRouter()
  const params = useSearchParams()
  const { user, ready } = useLoginModal()
  const next = params.get('next') || '/'

  useEffect(() => {
    if (ready && user) router.replace(next.startsWith('/') ? next : '/')
  }, [next, ready, router, user])

  return <LoginForm redirectTo={next} />
}

const Page = () => (
  <Suspense fallback={<section className='vn-section'>Loading…</section>}>
    <LoginDesk />
  </Suspense>
)

export default Page
