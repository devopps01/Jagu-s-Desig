'use client'

import { useState } from 'react'
import Link from 'next/link'

import { htmlToText, type StoreProduct } from '@web/data/catalog'
import { useLoginModal } from '@web/context/LoginModalContext'

type Tab = 'details' | 'review' | 'returns'

const bulletsFromHtml = (html: string) => {
  const items = [...String(html || '').matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map(match => htmlToText(match[1]))
    .filter(Boolean)

  if (items.length) return items

  const paragraphs = [...String(html || '').matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map(match => htmlToText(match[1]))
    .filter(Boolean)

  if (paragraphs.length) return paragraphs

  const plain = htmlToText(html)

  return plain ? plain.split(/(?<=\.)\s+/).map(line => line.trim()).filter(line => line.length > 12) : []
}

const specRows = (product: StoreProduct) =>
  [
    {
      label: 'Product code',
      value: product.slug
        .split('-')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    },
    { label: 'Country of manufacture', value: 'India' },
    { label: 'Wash care', value: 'Dry wash only' },
    { label: 'Colour', value: product.color },
    { label: 'Fabric', value: product.fabric },
    { label: 'Work type', value: [product.craft, product.design].filter(Boolean).join(', ') },
    { label: 'Style', value: product.styles?.length ? product.styles.join(', ') : product.style }
  ].filter(row => row.value)

const returnPoints = [
  'Cancel while the order is new, confirmed or packed. After it ships, wait for delivery and use Return.',
  'Returns are open for 7 days after delivery. The piece should be unused, unwashed and unaltered, with tags and packing.',
  'Photograph a quality or damage issue and send the request from My orders or Track order. Do not post a parcel back before we approve it.',
  'Quality faults are exchanged. A size swap depends on stock. If we cannot swap, we refund after the piece is checked.',
  'Worn, washed or altered garments are not taken back, except a proven fault from our side. Custom work that has started cannot be cancelled unless we made an error.',
  'For the full policy, visit Return & exchange.'
]

const ProductInfoTabs = ({ product }: { product: StoreProduct }) => {
  const { user, openLogin } = useLoginModal()
  const [tab, setTab] = useState<Tab>('details')
  const bullets = bulletsFromHtml(product.description || '')
  const saved = (product.details || []).filter(row => row.label && row.value)
  const rows = saved.length ? saved : specRows(product)

  return (
    <section className='vn-pdp-tabs' aria-label='Product information'>
      <div className='vn-pdp-tablist' role='tablist'>
        {(
          [
            ['details', 'Product Details'],
            ['review', 'Review'],
            ['returns', 'Return Policy']
          ] as const
        ).map(([id, label]) => (
          <button key={id} type='button' role='tab' aria-selected={tab === id} className={tab === id ? 'is-on' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <div className='vn-pdp-detail' role='tabpanel'>
          {rows.length ? (
            <table>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label}>
                    <th>{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {bullets.length ? (
            <ul>
              {bullets.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Each piece is cut and finished in our Surat atelier. Ask us on WhatsApp for fabric, work and fit before you order.</p>
          )}
        </div>
      ) : null}

      {tab === 'review' ? (
        <div className='vn-pdp-tab-card' role='tabpanel'>
          <h2>Write Your Own Review</h2>
          {user ? (
            <p>
              You are signed in. Share how the piece looked, the fit and the work.
              <Link href='#reviews'> Go to reviews</Link>
            </p>
          ) : (
            <p>
              Only registered users can write reviews. Please{' '}
              <button type='button' onClick={openLogin}>
                Sign in
              </button>{' '}
              or{' '}
              <button type='button' onClick={openLogin}>
                create an account
              </button>
            </p>
          )}
        </div>
      ) : null}

      {tab === 'returns' ? (
        <div className='vn-pdp-returns' role='tabpanel'>
          <ul>
            {returnPoints.map(point => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <Link href='/returns'>Return & exchange policy</Link>
        </div>
      ) : null}
    </section>
  )
}

export default ProductInfoTabs
