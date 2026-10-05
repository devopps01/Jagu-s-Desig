'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import ResponsiveHomeImage from '@web/components/ResponsiveHomeImage'
import { defaultContentPage, paragraphsToList, type ContentPageSettings } from '@/libs/site-pages'

const CmsInfoPage = ({ page }: { page: string }) => {
  const [settings, setSettings] = useState<ContentPageSettings>(defaultContentPage(page))

  useEffect(() => {
    let draft = false

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'jagu-content-draft' && event.data.page === page && event.data.settings) {
        draft = true
        setSettings(event.data.settings)
      }
      if (event.data?.type === 'jagu-content-ready-ping') {
        window.parent.postMessage({ type: 'jagu-content-ready', page }, window.location.origin)
      }
      if (event.data?.type === 'jagu-content-scroll' && event.data.page === page && event.data.id) {
        const target = document.getElementById(`cms-${event.data.id}`)
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }

    window.addEventListener('message', onMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'jagu-content-ready', page }, window.location.origin)
    }

    fetch(`/api/web/content-page?page=${encodeURIComponent(page)}`)
      .then(res => res.json())
      .then(json => {
        if (!draft && json?.title) setSettings(json)
      })
      .catch(() => undefined)

    return () => window.removeEventListener('message', onMessage)
  }, [page])

  const blocks = settings.blocks.filter(block => block.enabled !== false)
  const actions = settings.actions.filter(action => action.enabled !== false && action.label)

  return (
    <>
      {settings.showBanner && (settings.bannerImage || settings.bannerImageMobile) ? (
        <section id='cms-banner' className='vn-banner' style={{ marginTop: 48 }}>
          <ResponsiveHomeImage image={settings.bannerImage} imageMobile={settings.bannerImageMobile} alt={settings.bannerTitle || settings.title} size='banner' />
          <div className='vn-banner-copy'>
            {settings.bannerKicker ? <p className='vn-hero-kicker'>{settings.bannerKicker}</p> : null}
            {settings.bannerTitle ? <h1>{settings.bannerTitle}</h1> : null}
            {settings.bannerText ? <p>{settings.bannerText}</p> : null}
            {settings.bannerButtonLabel ? (
              <Link className='vn-btn vn-btn-ghost' href={settings.bannerButtonHref || '/contact'}>
                {settings.bannerButtonLabel}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className='vn-section vn-policy'>
        <div id='cms-intro' className='vn-page-hero'>
          {settings.kicker ? <p className='vn-hero-kicker'>{settings.kicker}</p> : null}
          <h1>{settings.title}</h1>
          <div className='vn-rule' />
          {settings.intro ? <p>{settings.intro}</p> : null}
        </div>
        <div className='vn-policy-prose'>
          {blocks.map(block => {
            const paragraphs = paragraphsToList(block.paragraphs)
            const list = paragraphsToList(block.list)

            return (
              <article id={`cms-${block.id}`} key={block.id}>
                {block.title ? <h2>{block.title}</h2> : null}
                {paragraphs.map(text => (
                  <p key={text}>{text}</p>
                ))}
                {list.length ? (
                  <ul>
                    {list.map(item => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })}
        </div>
        {actions.length ? (
          <div id='cms-actions' className='vn-account-actions vn-policy-actions'>
            {actions.map(action => (
              <Link key={action.id} className={`vn-btn ${action.style === 'outline' ? 'vn-btn-outline' : 'vn-btn-solid'}`} href={action.href || '/'}>
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
        {settings.footerNote ? (
          <p id='cms-footer' className='vn-policy-more'>
            {settings.footerNote}
          </p>
        ) : null}
      </section>
    </>
  )
}

export default CmsInfoPage
