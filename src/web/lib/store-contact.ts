'use client'

import { useEffect, useState } from 'react'

import {
  STORE_PHONE_DISPLAY,
  STORE_WHATSAPP,
  storeTelHref,
  storeWhatsAppHref,
  toWhatsAppDigits
} from '@/libs/contact-types'

export const useStoreContact = () => {
  const [phone, setPhone] = useState(STORE_PHONE_DISPLAY)
  const [whatsapp, setWhatsapp] = useState(STORE_WHATSAPP)

  useEffect(() => {
    fetch('/api/web/contact')
      .then(res => res.json())
      .then(data => {
        if (data.phone) setPhone(String(data.phone))
        if (data.whatsapp) setWhatsapp(toWhatsAppDigits(String(data.whatsapp)))
      })
      .catch(() => undefined)
  }, [])

  return {
    phone,
    whatsapp,
    telHref: storeTelHref(phone),
    whatsappHref: (text?: string) => storeWhatsAppHref(text, whatsapp)
  }
}
