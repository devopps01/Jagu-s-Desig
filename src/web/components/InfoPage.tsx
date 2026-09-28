import Link from 'next/link'
import type { ReactNode } from 'react'

export type InfoBlock = {
  title: string
  paragraphs?: string[]
  list?: string[]
}

const InfoPage = ({
  kicker = 'Information',
  title,
  intro,
  blocks,
  actions
}: {
  kicker?: string
  title: string
  intro?: string
  blocks: InfoBlock[]
  actions?: ReactNode
}) => (
  <section className='vn-section vn-policy'>
    <div className='vn-page-hero'>
      <p className='vn-hero-kicker'>{kicker}</p>
      <h1>{title}</h1>
      <div className='vn-rule' />
      {intro ? <p>{intro}</p> : null}
    </div>
    <div className='vn-policy-prose'>
      {blocks.map(block => (
        <article key={block.title}>
          <h2>{block.title}</h2>
          {block.paragraphs?.map(text => (
            <p key={text}>{text}</p>
          ))}
          {block.list?.length ? (
            <ul>
              {block.list.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
    {actions ? <div className='vn-account-actions vn-policy-actions'>{actions}</div> : null}
    <p className='vn-policy-more'>
      Questions? Write on <Link href='/contact'>Contact us</Link> or track a bill on <Link href='/track-order'>Track order</Link>.
    </p>
  </section>
)

export default InfoPage
