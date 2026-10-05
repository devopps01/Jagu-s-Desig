'use client'

import { useLayoutEffect } from 'react'

/**
 * When the page is opened inside the Website editor iframe with ?editorDevice=desktop|mobile,
 * force the layout viewport so CSS breakpoints match Desktop / Mobile toggle.
 */
const EditorDeviceBoot = () => {
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const device = params.get('editorDevice')
    const width = Number(params.get('editorW') || (device === 'mobile' ? 390 : 1440))
    const height = Number(params.get('editorH') || (device === 'mobile' ? 844 : 0))

    if (device !== 'desktop' && device !== 'mobile') return

    document.documentElement.dataset.editorDevice = device

    let meta = document.querySelector('meta[name="viewport"]')

    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'viewport')
      document.head.appendChild(meta)
    }

    if (device === 'desktop') {
      meta.setAttribute('content', `width=${width || 1440}, initial-scale=1`)
      document.documentElement.style.minWidth = `${width || 1440}px`
      document.documentElement.style.maxWidth = ''
      document.documentElement.style.width = ''
      document.body.style.minWidth = `${width || 1440}px`
      document.body.style.maxWidth = ''
      document.body.style.width = ''
    } else {
      const phoneW = width || 390
      const phoneH = height || 844

      meta.setAttribute('content', `width=${phoneW}, initial-scale=1, maximum-scale=1`)
      document.documentElement.dataset.editorH = String(phoneH)
      document.documentElement.style.width = `${phoneW}px`
      document.documentElement.style.minWidth = `${phoneW}px`
      document.documentElement.style.maxWidth = `${phoneW}px`
      document.documentElement.style.overflowX = 'hidden'
      document.body.style.width = `${phoneW}px`
      document.body.style.minWidth = `${phoneW}px`
      document.body.style.maxWidth = `${phoneW}px`
      document.body.style.overflowX = 'hidden'
    }

    window.dispatchEvent(new Event('resize'))
  }, [])

  return null
}

export default EditorDeviceBoot
