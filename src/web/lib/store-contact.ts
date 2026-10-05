'use client'

import { useEffect, useState } from 'react'

import {
  STORE_PHONE_DISPLAY,
  STORE_WHATSAPP,
  storeTelHref,
  storeWhatsAppHref,
  toWhatsAppDigits,
  type ContactSettings
} from '@/libs/contact-types'

export const useStoreContact = () => {
  const [phone, setPhone] = useState(STORE_PHONE_DISPLAY)
  const [whatsapp, setWhatsapp] = useState(STORE_WHATSAPP)
  const [suratTitle, setSuratTitle] = useState("Jagu's Designing Collections")
  const [suratAddress, setSuratAddress] = useState('')

  useEffect(() => {
    let draft = false

    const apply = (data: Partial<ContactSettings>) => {
      if (data.phone) setPhone(String(data.phone))
      if (data.whatsapp) setWhatsapp(toWhatsAppDigits(String(data.whatsapp)))
      if (data.suratTitle) setSuratTitle(String(data.suratTitle))
      if (typeof data.suratAddress === 'string') setSuratAddress(String(data.suratAddress))
    }

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'jagu-contact-draft' && event.data.settings) {
        draft = true
        apply(event.data.settings)
      }
    }

    const onLive = (event: Event) => {
      const detail = (event as CustomEvent<Partial<ContactSettings>>).detail
      if (detail) {
        draft = true
        apply(detail)
      }
    }

    window.addEventListener('message', onMessage)
    window.addEventListener('jagu-contact-live', onLive)

    fetch('/api/web/contact')
      .then(res => res.json())
      .then(data => {
        if (!draft && data) apply(data)
      })
      .catch(() => undefined)

    return () => {
      window.removeEventListener('message', onMessage)
      window.removeEventListener('jagu-contact-live', onLive)
    }
  }, [])

  return {
    phone,
    whatsapp,
    suratTitle,
    suratAddress,
    telHref: storeTelHref(phone),
    whatsappHref: (text?: string) => storeWhatsAppHref(text, whatsapp)
  }
}
