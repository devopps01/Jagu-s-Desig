'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  announcementsToList,
  defaultSiteChromeSettings,
  mergeSiteChromeSettings,
  type SiteChromeSettings
} from '@/libs/site-chrome-types'

type SiteChromeContextValue = {
  chrome: SiteChromeSettings
  announcements: string[]
}

const SiteChromeContext = createContext<SiteChromeContextValue>({
  chrome: defaultSiteChromeSettings(),
  announcements: announcementsToList(defaultSiteChromeSettings().announcements)
})

export const SiteChromeProvider = ({ children }: { children: ReactNode }) => {
  const [chrome, setChrome] = useState<SiteChromeSettings>(defaultSiteChromeSettings())

  useEffect(() => {
    let draft = false

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'jagu-chrome-draft' && event.data.settings) {
        draft = true
        setChrome(mergeSiteChromeSettings(event.data.settings))
      }
      if (event.data?.type === 'jagu-contact-draft' && event.data.settings) {
        window.dispatchEvent(new CustomEvent('jagu-contact-live', { detail: event.data.settings }))
      }
    }

    window.addEventListener('message', onMessage)

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'jagu-chrome-ready' }, window.location.origin)
    }

    fetch('/api/web/site-chrome')
      .then(res => res.json())
      .then(json => {
        if (!draft && json && typeof json === 'object') setChrome(mergeSiteChromeSettings(json))
      })
      .catch(() => undefined)

    return () => window.removeEventListener('message', onMessage)
  }, [])

  const value = useMemo(
    () => ({
      chrome,
      announcements: chrome.showAnnouncement ? announcementsToList(chrome.announcements) : []
    }),
    [chrome]
  )

  return <SiteChromeContext.Provider value={value}>{children}</SiteChromeContext.Provider>
}

export const useSiteChrome = () => useContext(SiteChromeContext)
