'use client'

import { STORE_PHONE_DISPLAY } from '@/libs/contact-types'
import { useSiteChrome } from '@web/lib/site-chrome'
import { useStoreContact } from '@web/lib/store-contact'

const WhatsAppFloat = () => {
  const { phone, whatsappHref } = useStoreContact()
  const { chrome } = useSiteChrome()

  if (!chrome.floatEnabled) return null

  return (
    <a
      className='vn-wa-float'
      href={whatsappHref(chrome.floatMessage)}
      target='_blank'
      rel='noreferrer'
      aria-label={`${chrome.floatLabel} ${phone || STORE_PHONE_DISPLAY}`}
    >
      <i className='tabler-brand-whatsapp' />
      <span className='vn-wa-float-copy'>
        <strong>{chrome.floatLabel || 'WhatsApp'}</strong>
        <em>{phone || STORE_PHONE_DISPLAY}</em>
      </span>
    </a>
  )
}

export default WhatsAppFloat
