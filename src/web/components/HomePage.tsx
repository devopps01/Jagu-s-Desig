'use client'

import { useEffect, useState, type ReactNode } from 'react'

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
import { withoutSareeWord } from '@/libs/public-label'
import { products as catalogProducts, type StoreProduct } from '@web/data/catalog'

const MIN_SPOTLIGHT = 10

const HomeBlock = ({ children }: { children: ReactNode }) => <ScrollReveal>{children}</ScrollReveal>

const withMinProducts = (live: StoreProduct[], min = MIN_SPOTLIGHT) => {
  if (live.length >= min) return live

  const seen = new Set(live.map(item => item.slug))
  const extra = catalogProducts
    .filter(item => !seen.has(item.slug))
    .map(item => ({ ...item, title: withoutSareeWord(item.title), imageAlt: item.imageAlt ? withoutSareeWord(item.imageAlt) : item.imageAlt }))

  return [...live.map(item => ({ ...item, title: withoutSareeWord(item.title) })), ...extra].slice(0, min)
}

const HomePage = () => {
  const [featured, setFeatured] = useState<StoreProduct[]>([])
  const [latest, setLatest] = useState<StoreProduct[]>([])

  useEffect(() => {
    fetch('/api/web/products')
      .then(res => res.json())
      .then(json => {
        const all = withMinProducts(Array.isArray(json) ? (json as StoreProduct[]) : [])
        const spotlightCount = Math.min(16, all.length)

        setFeatured(all.slice(0, spotlightCount))
        setLatest(all.slice(spotlightCount, spotlightCount + 8))
      })
      .catch(() => {
        const fallback = withMinProducts([])

        setFeatured(fallback.slice(0, MIN_SPOTLIGHT))
        setLatest(fallback.slice(MIN_SPOTLIGHT, MIN_SPOTLIGHT + 8))
      })
  }, [])

  return (
    <div className='vn-home'>
      <HomeHero />
      <HomeBlock>
        <HomeTrust />
      </HomeBlock>
      {featured.length ? (
        <HomeBlock>
          <section className='vn-section'>
            <SectionHeader title='In the spotlight' note='Pieces we love this season' href='/collections/all' />
            <ProductSlider products={featured} />
          </section>
        </HomeBlock>
      ) : null}
      <HomeBlock>
        <HomeOccasions />
      </HomeBlock>
      <HomeBlock>
        <HomeLooks />
      </HomeBlock>
      <HomeBlock>
        <HomeFestivities />
      </HomeBlock>
      <HomeBlock>
        <HomeFanLook />
      </HomeBlock>

      {latest.length ? (
        <HomeBlock>
          <section className='vn-section'>
            <SectionHeader title='New arrivals' note='Fresh from the atelier' href='/collections/all' />
            <ProductGrid products={latest} />
          </section>
        </HomeBlock>
      ) : null}
      <HomeBlock>
        <HomeVideoBanner />
      </HomeBlock>

      <HomeBlock>
        <HomeStory />
      </HomeBlock>
      <HomeBlock>
        <HomeNavratri />
      </HomeBlock>
      <HomeBlock>
        <GoogleReviewsBlock />
      </HomeBlock>
      <HomeBlock>
        <HomeFeatures />
      </HomeBlock>
    </div>
  )
}

export default HomePage
