'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  defaultSiteThemeSettings,
  themeCssVars,
  themeGoogleFontsHref,
  type SiteThemeSettings
} from '@/libs/site-theme-types'

type SiteThemeContextValue = {
  theme: SiteThemeSettings
}

const SiteThemeContext = createContext<SiteThemeContextValue>({
  theme: defaultSiteThemeSettings()
})

const applyThemeToDocument = (theme: SiteThemeSettings) => {
  const root = document.documentElement
  const vars = themeCssVars(theme)

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  let link = document.getElementById('jagu-theme-fonts') as HTMLLinkElement | null

  if (!link) {
    link = document.createElement('link')
    link.id = 'jagu-theme-fonts'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }

  link.href = themeGoogleFontsHref(theme)

  let meta = document.querySelector('meta[name="theme-color"]')

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', theme.bg)
}

export const SiteThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<SiteThemeSettings>(defaultSiteThemeSettings())

  useEffect(() => {
    let draft = false

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'jagu-theme-draft' && event.data.settings) {
        draft = true
        setTheme(event.data.settings)
      }
    }

    window.addEventListener('message', onMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'jagu-theme-ready' }, window.location.origin)
    }

    fetch('/api/web/site-theme')
      .then(res => res.json())
      .then(json => {
        if (!draft && json && typeof json === 'object') setTheme({ ...defaultSiteThemeSettings(), ...json })
      })
      .catch(() => undefined)

    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const value = useMemo(() => ({ theme }), [theme])

  return <SiteThemeContext.Provider value={value}>{children}</SiteThemeContext.Provider>
}

export const useSiteTheme = () => useContext(SiteThemeContext)
