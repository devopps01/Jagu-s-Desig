'use client'

import { STORE_PHONE_DISPLAY } from '@/libs/contact-types'
import { useStoreContact } from '@web/lib/store-contact'

const WhatsAppFloat = () => {
  const { phone, whatsappHref } = useStoreContact()

  return (
    <a
      className='vn-wa-float'
      href={whatsappHref(`Hello Jagu’s Designing, I would like to enquire.`)}
      target='_blank'
      rel='noreferrer'
      aria-label={`WhatsApp ${phone || STORE_PHONE_DISPLAY}`}
    >
      <i className='tabler-brand-whatsapp' />
      <span className='vn-wa-float-copy'>
        <strong>WhatsApp</strong>
        <em>{phone || STORE_PHONE_DISPLAY}</em>
      </span>
    </a>
  )
}

export default WhatsAppFloat
