'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

import HomeHero from '@web/components/HomeHero'
import HomeLooks from '@web/components/HomeLooks'
import HomeNavratri from '@web/components/HomeNavratri'
import HomeOccasions from '@web/components/HomeOccasions'
import HomeStory from '@web/components/HomeStory'
import HomeTrust from '@web/components/HomeTrust'
import HomeVideoBanner from '@web/components/HomeVideoBanner'
import HomeFanLook from '@web/components/HomeFanLook'
import HomeFestivities from '@web/components/HomeFestivities'
import HomeFeatures from '@web/components/HomeFeatures'
import GoogleReviewsBlock from '@web/components/GoogleReviewsBlock'
import ScrollReveal from '@web/components/ScrollReveal'
import { ProductGrid, SectionHeader } from '@web/components/ProductGrid'
import ProductSlider from '@web/components/ProductSlider'
import { defaultHomePageSettings, type HomePageSettings, type HomeSection, cssSize } from '@/libs/home-types'
import { filterProductsForCollection, products as catalogProducts, type StoreProduct } from '@web/data/catalog'

const sectionStyle = (section?: HomeSection): CSSProperties => {
  if (!section) return {}

  const gap = cssSize(section.gap)

  return {
    width: '100%',
    maxWidth: cssSize(section.width),
    minHeight: cssSize(section.height),
    padding: cssSize(section.padding),
    marginLeft: section.width ? 'auto' : undefined,
    marginRight: section.width ? 'auto' : undefined,
    boxSizing: 'border-box',
    ['--home-gap' as string]: gap
  }
}

const HomeBlock = ({ id, section, children }: { id?: string; section?: HomeSection; children: ReactNode }) => (
  <div id={id ? `home-${id}` : undefined} className='vn-home-shell' style={sectionStyle(section)}>
    <ScrollReveal>{children}</ScrollReveal>
  </div>
)

const resolveProducts = (section: HomeSection, all: StoreProduct[]) => {
  const limit = Math.max(1, Math.min(48, section.limit || 8))

  if (section.productMode === 'selected') {
    const bySlug = new Map(all.map(item => [item.slug, item]))

    // Only the products you picked, in the same order you picked them.
    return section.productSlugs.map(slug => bySlug.get(slug)).filter(Boolean) as StoreProduct[]
  }

  const pool = filterProductsForCollection(all, section.filterSlug || 'latest')

  return pool.slice(0, limit)
}

const HomePage = () => {
  const [settings, setSettings] = useState<HomePageSettings>(defaultHomePageSettings())
  const [catalog, setCatalog] = useState<StoreProduct[]>([])

  useEffect(() => {
    let draft = false

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data?.type === 'jagu-home-draft' && event.data.settings?.sections) {
        draft = true
        setSettings(event.data.settings)
      }

      if (event.data?.type === 'jagu-home-scroll' && event.data.id) {
        document.getElementById(`home-${event.data.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }

    window.addEventListener('message', onMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'jagu-home-ready' }, window.location.origin)
    }

    fetch('/api/web/home-page')
      .then(res => res.json())
      .then(json => {
        if (!draft && json?.sections) setSettings(json)
      })
      .catch(() => undefined)

    fetch('/api/web/products')
      .then(res => res.json())
      .then(json => setCatalog(Array.isArray(json) && json.length ? json : catalogProducts))
      .catch(() => setCatalog(catalogProducts))

    return () => window.removeEventListener('message', onMessage)
  }, [])

  return (
    <div className='vn-home'>
      {settings.sections.filter(section => section.enabled).map(section => {
        if (section.type === 'hero') {
          const slides = section.items.filter(item => item.enabled).map(item => ({
            image: item.image,
            imageMobile: item.imageMobile,
            kicker: item.kicker,
            showKicker: item.showKicker,
            title: item.title,
            showTitle: item.showTitle,
            text: item.text,
            showText: item.showText,
            buttonLabel: item.buttonLabel,
            showButton: item.showButton,
            href: item.href,
            showSecondButton: item.showSecondButton,
            secondLabel: item.secondLabel,
            secondHref: item.secondHref
          }))

          return (
            <div id={`home-${section.id}`} key={section.id} className='vn-home-shell' style={sectionStyle(section)}>
              <HomeHero slides={slides.length ? slides : undefined} />
            </div>
          )
        }

        if (section.type === 'trust') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeTrust items={section.items.filter(item => item.enabled).map(item => ({ icon: item.icon, label: item.title, showTitle: item.showTitle }))} />
            </HomeBlock>
          )
        }

        if (section.type === 'products') {
          const picked = resolveProducts(section, catalog)

          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <section className='vn-section'>
                <SectionHeader
                  title={section.title}
                  note={section.note}
                  showTitle={section.showTitle}
                  showNote={section.showNote}
                  href={section.showButton ? section.href : undefined}
                  buttonLabel={section.buttonLabel}
                />
                {picked.length ? (section.layout === 'grid' ? <ProductGrid products={picked} /> : <ProductSlider products={picked} />) : null}
              </section>
            </HomeBlock>
          )
        }

        if (section.type === 'cards' && section.layout === 'occasions') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeOccasions
                title={section.title}
                note={section.note}
                showTitle={section.showTitle}
                showNote={section.showNote}
                items={section.items
                  .filter(item => item.enabled)
                  .map(item => ({
                    id: item.id,
                    title: item.title,
                    href: item.href,
                    image: item.image,
                    imageMobile: item.imageMobile,
                    showTitle: item.showTitle
                  }))}
                products={catalog}
                limit={section.limit || 8}
                viewMoreLabel={section.buttonLabel || 'View more'}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'cards') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeLooks
                items={section.items.filter(item => item.enabled).map(item => ({
                  title: item.title,
                  text: item.text,
                  href: item.href,
                  image: item.image,
                  imageMobile: item.imageMobile,
                  showTitle: item.showTitle,
                  showText: item.showText
                }))}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'festivities') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeFestivities
                title={section.showTitle ? section.title : ''}
                note={section.showNote ? section.note : ''}
                items={section.items}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'fan') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeFanLook
                note={section.showNote ? section.note : ''}
                title={section.showTitle ? section.title : ''}
                href={section.href || '/collections/festive'}
                items={section.items}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'video') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeVideoBanner
                eyebrow={section.note}
                showEyebrow={section.showNote}
                lineOne='Shop Via'
                lineTwo={section.title}
                showTitle={section.showTitle}
                text={section.text}
                showText={section.showText}
                buttonLabel={section.buttonLabel}
                showButton={section.showButton}
                href={section.href}
                image={section.image}
                imageMobile={section.imageMobile}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'story') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeStory
                kicker={section.note}
                showKicker={section.showNote}
                title={section.title}
                showTitle={section.showTitle}
                text={section.text}
                showText={section.showText}
                buttonLabel={section.buttonLabel}
                showButton={section.showButton}
                href={section.href}
                image={section.image}
                imageMobile={section.imageMobile}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'navratri') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeNavratri
                title={section.showTitle ? section.title : ''}
                note={section.showNote ? section.note : ''}
                moreTitle={section.showText !== false ? section.text || 'Beyond the garba circle' : ''}
                moreNote={
                  section.showText !== false
                    ? section.buttonLabel || 'Wedding, engagement and after-aarti looks'
                    : ''
                }
                showMoreHeader={section.showText !== false}
                items={section.items}
              />
            </HomeBlock>
          )
        }

        if (section.type === 'reviews') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <GoogleReviewsBlock />
            </HomeBlock>
          )
        }

        if (section.type === 'features') {
          return (
            <HomeBlock key={section.id} id={section.id} section={section}>
              <HomeFeatures
                items={section.items.filter(item => item.enabled).map(item => ({
                  icon: item.icon,
                  title: item.title,
                  text: item.text,
                  showTitle: item.showTitle,
                  showText: item.showText
                }))}
              />
            </HomeBlock>
          )
        }

        return null
      })}
    </div>
  )
}

export default HomePage
