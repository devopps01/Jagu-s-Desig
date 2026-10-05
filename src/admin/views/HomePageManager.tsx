'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

import ConfirmActionDialog from '@admin/views/ConfirmActionDialog'
import ContactPageEditor from '@admin/views/ContactPageEditor'
import ContentPageEditor from '@admin/views/ContentPageEditor'
import HomeSectionEditor, { type HomeProductOption } from '@admin/views/HomeSectionEditor'
import MediaPickerModal, { type PickedMedia } from '@admin/views/MediaPickerModal'
import SiteChromeEditor from '@admin/views/SiteChromeEditor'
import ThemeEditor from '@admin/views/ThemeEditor'
import { defaultContactSettings, type ContactSettings } from '@/libs/contact-types'
import { defaultSiteChromeSettings, mergeSiteChromeSettings, type SiteChromeSettings } from '@/libs/site-chrome-types'
import { defaultSiteThemeSettings, type SiteThemeSettings } from '@/libs/site-theme-types'
import {
  HOME_SECTION_TYPES,
  createHomeItem,
  createHomeSection,
  defaultFanItems,
  defaultFestivityItems,
  defaultHomePageSettings,
  defaultNavratriItems,
  homeSectionMeta,
  type HomeItem,
  type HomePageSettings,
  type HomeSection,
  type HomeSectionType
} from '@/libs/home-types'
import {
  SITE_PAGES,
  createContentAction,
  createContentBlock,
  defaultContentPage,
  getSitePage,
  type ContentPageSettings
} from '@/libs/site-pages'

const thumbBox = {
  width: '100%',
  height: 36,
  borderRadius: 1,
  overflow: 'hidden',
  bgcolor: 'action.hover',
  border: '1px solid',
  borderColor: 'divider',
  p: 0.5,
  display: 'flex',
  alignItems: 'stretch',
  gap: 0.4
} as const

const Block = ({ w = '100%', h = '100%', soft = false }: { w?: string | number; h?: string | number; soft?: boolean }) => (
  <Box sx={{ width: w, height: h, borderRadius: 0.75, bgcolor: soft ? 'action.selected' : 'primary.main', opacity: soft ? 0.55 : 0.85 }} />
)

const SectionThumb = ({ type }: { type: HomeSectionType }) => {
  if (type === 'hero') {
    return (
      <Box sx={thumbBox}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5, pr: 1 }}>
          <Block w='70%' h={6} />
          <Block w='45%' h={4} soft />
          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.25 }}>
            <Block w={28} h={8} />
            <Block w={22} h={8} soft />
          </Box>
        </Box>
        <Block w='42%' h='100%' soft />
      </Box>
    )
  }

  if (type === 'trust') {
    return (
      <Box sx={{ ...thumbBox, alignItems: 'center', justifyContent: 'space-between', px: 1 }}>
        {[0, 1, 2, 3].map(item => (
          <Box key={item} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, flex: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main', opacity: 0.8 }} />
            <Block w='70%' h={3} soft />
          </Box>
        ))}
      </Box>
    )
  }

  if (type === 'products') {
    return (
      <Box sx={thumbBox}>
        {[0, 1, 2, 3].map(item => (
          <Box key={item} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Block h={28} soft />
            <Block h={4} />
            <Block h={3} soft />
          </Box>
        ))}
      </Box>
    )
  }

  if (type === 'cards') {
    return (
      <Box sx={thumbBox}>
        {[0, 1, 2].map(item => (
          <Box key={item} sx={{ flex: 1, position: 'relative' }}>
            <Block h='100%' soft />
            <Box sx={{ position: 'absolute', left: 4, right: 4, bottom: 4 }}>
              <Block h={5} />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  if (type === 'video') {
    return (
      <Box sx={{ ...thumbBox, alignItems: 'center' }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5, pr: 0.5 }}>
          <Block w='55%' h={5} soft />
          <Block w='80%' h={7} />
          <Block w={36} h={8} />
        </Box>
        <Box sx={{ width: '40%', height: '100%', borderRadius: 1, bgcolor: 'primary.main', opacity: 0.75, display: 'grid', placeItems: 'center' }}>
          <i className='tabler-player-play text-white text-sm' />
        </Box>
      </Box>
    )
  }

  if (type === 'story') {
    return (
      <Box sx={thumbBox}>
        <Block w='46%' h='100%' soft />
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.5 }}>
          <Block w='40%' h={4} soft />
          <Block w='85%' h={6} />
          <Block w='95%' h={3} soft />
          <Block w='70%' h={3} soft />
          <Block w={34} h={7} />
        </Box>
      </Box>
    )
  }

  if (type === 'features') {
    return (
      <Box sx={{ ...thumbBox, alignItems: 'center' }}>
        {[0, 1, 2, 3].map(item => (
          <Box key={item} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 16, height: 16, borderRadius: 1, bgcolor: 'primary.main', opacity: 0.8 }} />
            <Block w='80%' h={3} />
            <Block w='60%' h={2} soft />
          </Box>
        ))}
      </Box>
    )
  }

  if (type === 'festivities') {
    return (
      <Box sx={{ ...thumbBox, alignItems: 'end' }}>
        <Block w='22%' h='70%' soft />
        <Block w='34%' h='100%' />
        <Block w='22%' h='70%' soft />
        <Block w='22%' h='55%' soft />
      </Box>
    )
  }

  if (type === 'fan') {
    return (
      <Box sx={{ ...thumbBox, alignItems: 'end', justifyContent: 'center' }}>
        <Box sx={{ width: '28%', height: '72%', borderRadius: 1, bgcolor: 'action.selected', transform: 'rotate(-12deg) translateY(4px)' }} />
        <Box sx={{ width: '34%', height: '92%', borderRadius: 1, bgcolor: 'primary.main', opacity: 0.85, zIndex: 1 }} />
        <Box sx={{ width: '28%', height: '72%', borderRadius: 1, bgcolor: 'action.selected', transform: 'rotate(12deg) translateY(4px)' }} />
      </Box>
    )
  }

  if (type === 'navratri') {
    return (
      <Box sx={thumbBox}>
        {[0, 1].map(item => (
          <Box key={item} sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
            <Block w='42%' h='100%' soft />
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0.4 }}>
              <Block h={4} soft />
              <Block h={5} />
              <Block h={3} soft />
            </Box>
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box sx={{ ...thumbBox, alignItems: 'center' }}>
      {[0, 1, 2].map(item => (
        <Box key={item} sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.4, p: 0.25 }}>
          <Box sx={{ display: 'flex', gap: 0.3 }}>
            {[0, 1, 2, 3, 4].map(star => (
              <Box key={star} sx={{ width: 5, height: 5, borderRadius: '1px', bgcolor: 'warning.main', opacity: 0.9 }} />
            ))}
          </Box>
          <Block h={3} soft />
          <Block h={3} soft />
          <Block w='50%' h={3} />
        </Box>
      ))}
    </Box>
  )
}

const HomePageManager = () => {
  const [pageId, setPageId] = useState('home')
  const activePage = getSitePage(pageId)
  const [settings, setSettings] = useState<HomePageSettings>(defaultHomePageSettings())
  const [contentSettings, setContentSettings] = useState<ContentPageSettings>(defaultContentPage('about'))
  const [contactSettings, setContactSettings] = useState<ContactSettings>(defaultContactSettings)
  const [chromeSettings, setChromeSettings] = useState<SiteChromeSettings>(defaultSiteChromeSettings())
  const [themeSettings, setThemeSettings] = useState<SiteThemeSettings>(defaultSiteThemeSettings())
  const [products, setProducts] = useState<HomeProductOption[]>([])
  const [mediaFor, setMediaFor] = useState<{ sectionId: string; itemId?: string; field: 'image' | 'imageMobile' } | null>(null)
  const [contentMediaField, setContentMediaField] = useState<'bannerImage' | 'bannerImageMobile' | null>(null)
  const [themeLogoPick, setThemeLogoPick] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>('hero')
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [addType, setAddType] = useState<HomeSectionType>('products')
  const [productSearch, setProductSearch] = useState('')
  const [pickerCollection, setPickerCollection] = useState('all')
  const [confirm, setConfirm] = useState<{ title: string; message: string; action: () => void } | null>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const previewShellRef = useRef<HTMLDivElement>(null)
  const localEdit = useRef(false)
  const contentEdit = useRef(false)
  const contactEdit = useRef(false)
  const chromeEdit = useRef(false)
  const themeEdit = useRef(false)
  const [previewReady, setPreviewReady] = useState(false)
  const [previewShell, setPreviewShell] = useState({ width: 900, height: 800 })
  const [zoomMode, setZoomMode] = useState<'fit' | number>('fit')
  const [frameSrc, setFrameSrc] = useState('about:blank')
  const [frameViewport, setFrameViewport] = useState(0)
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Real CSS viewport inside iframe (scaled only visually — media queries use this width)
  const designWidth = device === 'mobile' ? 390 : 1440
  // Typical Android phone viewport height (Pixel-class)
  const designHeight = device === 'mobile' ? 844 : 0
  const shellInnerW = Math.max(320, previewShell.width)
  const shellInnerH = Math.max(420, previewShell.height)
  // Desktop: fill shell width. Mobile: fit phone 390×844 inside shell (never stretch to 200%+).
  const fitScale =
    device === 'mobile'
      ? Math.min(shellInnerW / designWidth, shellInnerH / designHeight)
      : shellInnerW / designWidth
  const previewScale = zoomMode === 'fit' ? fitScale : zoomMode
  const frameHeight =
    device === 'mobile'
      ? designHeight
      : Math.max(480, Math.round(shellInnerH / Math.max(previewScale, 0.2)))
  const stageWidth = Math.round(designWidth * previewScale)
  const stageHeight = Math.round(frameHeight * previewScale)

  useEffect(() => {
    setZoomMode('fit')
  }, [device])

  useEffect(() => {
    const el = previewShellRef.current

    if (!el || typeof ResizeObserver === 'undefined') return

    const measure = () => {
      setPreviewShell({ width: Math.max(320, el.clientWidth), height: Math.max(420, el.clientHeight) })
    }

    measure()
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    window.addEventListener('resize', measure)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [device, pageId])

  useEffect(() => {
    setPreviewReady(false)
    setFrameSrc('about:blank')
    setFrameViewport(0)

    const timer = window.setTimeout(() => {
      const url = new URL(activePage.path || '/', window.location.origin)

      url.searchParams.set('editorDevice', device)
      url.searchParams.set('editorW', String(designWidth))
      if (device === 'mobile') url.searchParams.set('editorH', String(designHeight))
      setFrameSrc(`${url.pathname}${url.search}`)
    }, 40)

    return () => window.clearTimeout(timer)
  }, [activePage.path, device, designWidth, designHeight, pageId])

  const nudgeZoom = (direction: -1 | 1) => {
    const base = zoomMode === 'fit' ? fitScale : zoomMode
    const maxZoom = device === 'mobile' ? 1.15 : 1.5
    const next = Math.min(maxZoom, Math.max(0.2, Number((base + direction * 0.08).toFixed(2))))

    setZoomMode(next)
  }

  const onPreviewLoad = () => {
    setPreviewReady(true)

    try {
      const win = frameRef.current?.contentWindow
      const doc = win?.document
      const width = win?.innerWidth || 0

      setFrameViewport(width)

      if (!doc?.documentElement) return

      // Desktop: force layout width when the host browser is still “phone-sized”.
      if (device === 'desktop' && width > 0 && width < 1100) {
        doc.documentElement.style.minWidth = `${designWidth}px`
        doc.body.style.minWidth = `${designWidth}px`
        doc.documentElement.style.maxWidth = ''
        doc.body.style.maxWidth = ''
      }

      // Android / mobile: lock the document to the phone width so layout matches 390px.
      if (device === 'mobile') {
        doc.documentElement.style.width = `${designWidth}px`
        doc.documentElement.style.maxWidth = `${designWidth}px`
        doc.documentElement.style.minWidth = `${designWidth}px`
        doc.body.style.width = `${designWidth}px`
        doc.body.style.maxWidth = `${designWidth}px`
        doc.body.style.minWidth = `${designWidth}px`
        doc.documentElement.style.overflowX = 'hidden'
        doc.body.style.overflowX = 'hidden'
      }
    } catch {
      setFrameViewport(designWidth)
    }
  }

  useEffect(() => {
    fetch('/api/admin/home-page')
      .then(res => res.json())
      .then(json => {
        if (localEdit.current || !json?.sections) return

        const sections = json.sections.map((section: HomeSection) => {
          if (Array.isArray(section.items) && section.items.length > 0) return section
          if (section.type === 'festivities') return { ...section, items: defaultFestivityItems() }
          if (section.type === 'fan') return { ...section, items: defaultFanItems() }
          if (section.type === 'navratri') return { ...section, items: defaultNavratriItems() }

          return section
        })

        setSettings({ ...json, sections })
      })
      .catch(() => undefined)

    fetch('/api/web/products')
      .then(res => res.json())
      .then(json => {
        const rows = Array.isArray(json) ? json : []

        setProducts(
          rows
            .map((row: { slug?: string; title?: string; image?: string; collections?: string[] }) => ({
              slug: String(row.slug || ''),
              title: String(row.title || row.slug || ''),
              image: String(row.image || ''),
              collections: Array.isArray(row.collections) ? row.collections.map(String) : []
            }))
            .filter((row: HomeProductOption) => row.slug)
        )
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (activePage.kind !== 'content') return

    contentEdit.current = false
    setContentSettings(defaultContentPage(pageId))
    fetch(`/api/admin/content-page?page=${encodeURIComponent(pageId)}`)
      .then(res => res.json())
      .then(json => {
        if (!contentEdit.current && json?.title) setContentSettings(json)
      })
      .catch(() => undefined)
    setPreviewReady(false)
  }, [pageId, activePage.kind])

  useEffect(() => {
    if (activePage.kind !== 'contact' && activePage.kind !== 'header' && activePage.kind !== 'footer') return

    contactEdit.current = false
    fetch('/api/admin/contact-settings')
      .then(res => res.json())
      .then(json => {
        if (!contactEdit.current && json && typeof json === 'object') {
          setContactSettings({ ...defaultContactSettings, ...json })
        }
      })
      .catch(() => undefined)
    setPreviewReady(false)
  }, [pageId, activePage.kind])

  useEffect(() => {
    if (activePage.kind !== 'header' && activePage.kind !== 'footer') return

    chromeEdit.current = false
    fetch('/api/admin/site-chrome')
      .then(res => res.json())
      .then(json => {
        if (!chromeEdit.current && json && typeof json === 'object') {
          setChromeSettings(mergeSiteChromeSettings(json))
        }
      })
      .catch(() => undefined)
    setPreviewReady(false)
  }, [pageId, activePage.kind])

  useEffect(() => {
    if (activePage.kind !== 'theme') return

    themeEdit.current = false
    fetch('/api/admin/site-theme')
      .then(res => res.json())
      .then(json => {
        if (!themeEdit.current && json && typeof json === 'object') {
          setThemeSettings({ ...defaultSiteThemeSettings(), ...json })
        }
      })
      .catch(() => undefined)
    setPreviewReady(false)
  }, [pageId, activePage.kind])

  const updateSection = (id: string, patch: Partial<HomeSection>) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section => (section.id === id ? { ...section, ...patch } : section))
    }))
  }

  const toggleProduct = (sectionId: string, slug: string) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section => {
        if (section.id !== sectionId) return section

        const exists = section.productSlugs.includes(slug)
        const productSlugs = exists ? section.productSlugs.filter(item => item !== slug) : [...section.productSlugs, slug]

        return {
          ...section,
          productMode: 'selected',
          productSlugs,
          limit: Math.max(productSlugs.length || 1, section.limit || 8)
        }
      })
    }))
  }

  const moveSelectedProduct = (sectionId: string, slug: string, direction: -1 | 1) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section => {
        if (section.id !== sectionId) return section

        const next = [...section.productSlugs]
        const index = next.indexOf(slug)
        const target = index + direction

        if (index < 0 || target < 0 || target >= next.length) return section
        ;[next[index], next[target]] = [next[target], next[index]]

        return { ...section, productSlugs: next }
      })
    }))
  }

  const updateItem = (sectionId: string, itemId: string, patch: Partial<HomeItem>) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.map(item => (item.id === itemId ? { ...item, ...patch } : item)) }
          : section
      )
    }))
  }

  const addItem = (sectionId: string) => {
    localEdit.current = true
    const section = settings.sections.find(row => row.id === sectionId)
    const created = createHomeItem({
      title:
        section?.type === 'festivities'
          ? 'New look'
          : section?.type === 'fan'
            ? 'New photo'
            : section?.type === 'navratri'
              ? 'New story'
              : 'New item',
      showTitle: true,
      showText:
        section?.type === 'features' ||
        section?.type === 'hero' ||
        section?.type === 'navratri',
      showKicker: section?.type === 'hero' || section?.type === 'navratri',
      showButton:
        section?.type === 'hero' ||
        section?.type === 'cards' ||
        section?.type === 'festivities' ||
        section?.type === 'navratri',
      buttonLabel: section?.type === 'navratri' ? 'Shop' : '',
      href:
        section?.type === 'festivities'
          ? '/collections/all'
          : section?.type === 'fan'
            ? section.href || '/collections/festive'
            : section?.type === 'navratri'
              ? '/collections/festive'
              : '',
      icon: section?.type === 'trust' ? 'tabler-shield-check' : 'tabler-sparkles'
    })

    setSettings(current => ({
      sections: current.sections.map(row => (row.id === sectionId ? { ...row, items: [...row.items, created] } : row))
    }))
  }

  const removeItem = (sectionId: string, itemId: string) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section =>
        section.id === sectionId ? { ...section, items: section.items.filter(item => item.id !== itemId) } : section
      )
    }))
  }

  const moveItem = (sectionId: string, itemId: string, direction: -1 | 1) => {
    localEdit.current = true
    setSettings(current => ({
      sections: current.sections.map(section => {
        if (section.id !== sectionId) return section

        const next = [...section.items]
        const index = next.findIndex(item => item.id === itemId)
        const target = index + direction

        if (index < 0 || target < 0 || target >= next.length) return section
        ;[next[index], next[target]] = [next[target], next[index]]

        return { ...section, items: next }
      })
    }))
  }

  const addSection = (type = addType) => {
    localEdit.current = true
    const created = createHomeSection(type)

    setSettings(current => ({ sections: [...current.sections, created] }))
    setSelectedId(created.id)
    setAddType(type)
  }

  const removeSection = (id: string) => {
    const target = settings.sections.find(section => section.id === id)

    if (!target || target.locked) return

    setConfirm({
      title: 'Remove this section?',
      message: `“${target.title || target.id}” will be removed from the home page. Built-in sections cannot be removed — this is a section you added.`,
      action: () => {
        localEdit.current = true
        setSettings(current => ({ sections: current.sections.filter(section => section.id !== id) }))
        setSelectedId(current => (current === id ? null : current))
      }
    })
  }

  const requestRemoveItem = (sectionId: string, itemId: string, title: string) => {
    setConfirm({
      title: 'Remove this item?',
      message: `“${title}” will be removed from this section. You can add it again later if needed.`,
      action: () => removeItem(sectionId, itemId)
    })
  }

  const move = (index: number, direction: -1 | 1) => {
    localEdit.current = true
    setSettings(current => {
      const next = [...current.sections]
      const target = index + direction
      if (target < 0 || target >= next.length) return current
      const [row] = next.splice(index, 1)
      next.splice(target, 0, row)
      return { sections: next }
    })
  }

  const saveContactSettings = async () => {
    const res = await fetch('/api/admin/contact-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contactSettings)
    })
    const json = await res.json()

    if (!res.ok) throw new Error(json.message || 'Could not save contact details')

    setContactSettings({ ...defaultContactSettings, ...json })
    return json
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')

    if (activePage.kind === 'theme') {
      try {
        const res = await fetch('/api/admin/site-theme', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(themeSettings)
        })
        const json = await res.json()

        if (!res.ok) throw new Error(json.message || 'Could not save theme')

        setThemeSettings({ ...defaultSiteThemeSettings(), ...json })
        setSaving(false)
        setMessage('Theme saved. Logo, colours and fonts are updated on the website.')
      } catch (err) {
        setSaving(false)
        setError(err instanceof Error ? err.message : 'Could not save')
      }
      return
    }

    if (activePage.kind === 'header' || activePage.kind === 'footer') {
      try {
        const chromeRes = await fetch('/api/admin/site-chrome', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(chromeSettings)
        })
        const chromeJson = await chromeRes.json()

        if (!chromeRes.ok) throw new Error(chromeJson.message || 'Could not save header/footer')

        await saveContactSettings()
        setChromeSettings(mergeSiteChromeSettings(chromeJson))
        setSaving(false)
        setMessage(
          activePage.kind === 'header'
            ? 'Header saved. Announcement bar, phone and floating WhatsApp are updated.'
            : 'Footer saved. Links, text and atelier details are updated.'
        )
      } catch (err) {
        setSaving(false)
        setError(err instanceof Error ? err.message : 'Could not save')
      }
      return
    }

    if (activePage.kind === 'contact') {
      try {
        await saveContactSettings()
        setSaving(false)
        setMessage('Contact page saved. Header WhatsApp, footer and Contact Us now use these details.')
      } catch (err) {
        setSaving(false)
        setError(err instanceof Error ? err.message : 'Could not save contact page')
      }
      return
    }

    if (activePage.kind === 'content') {
      const res = await fetch('/api/admin/content-page', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contentSettings, page: pageId })
      })
      const json = await res.json()
      setSaving(false)
      if (!res.ok) {
        setError(json.message || 'Could not save page')
        return
      }
      setContentSettings(json)
      setMessage(`${activePage.label} page saved.`)
      return
    }

    const res = await fetch('/api/admin/home-page', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) {
      setError(json.message || 'Could not save home page')
      return
    }
    setSettings(json)
    setMessage('Home page saved.')
  }

  const pickMedia = (media: PickedMedia) => {
    if (themeLogoPick) {
      themeEdit.current = true
      setThemeSettings(current => ({ ...current, logoUrl: media.url }))
      setThemeLogoPick(false)
      return
    }

    if (contentMediaField) {
      contentEdit.current = true
      setContentSettings(current => ({ ...current, [contentMediaField]: media.url }))
      setContentMediaField(null)
      return
    }

    if (!mediaFor) return
    const patch = { [mediaFor.field]: media.url } as Partial<HomeSection> & Partial<HomeItem>

    if (mediaFor.itemId) updateItem(mediaFor.sectionId, mediaFor.itemId, patch)
    else updateSection(mediaFor.sectionId, patch)
    setMediaFor(null)
  }

  const pushPreview = () => {
    if (activePage.kind === 'home') {
      frameRef.current?.contentWindow?.postMessage({ type: 'jagu-home-draft', settings }, window.location.origin)
      return
    }

    if (activePage.kind === 'theme') {
      frameRef.current?.contentWindow?.postMessage({ type: 'jagu-theme-draft', settings: themeSettings }, window.location.origin)
      return
    }

    if (activePage.kind === 'content') {
      frameRef.current?.contentWindow?.postMessage(
        { type: 'jagu-content-draft', page: pageId, settings: contentSettings },
        window.location.origin
      )
      return
    }

    if (activePage.kind === 'contact') {
      frameRef.current?.contentWindow?.postMessage({ type: 'jagu-contact-draft', settings: contactSettings }, window.location.origin)
      return
    }

    if (activePage.kind === 'header' || activePage.kind === 'footer') {
      frameRef.current?.contentWindow?.postMessage(
        { type: 'jagu-chrome-draft', settings: mergeSiteChromeSettings(chromeSettings) },
        window.location.origin
      )
      frameRef.current?.contentWindow?.postMessage({ type: 'jagu-contact-draft', settings: contactSettings }, window.location.origin)
    }
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (
        event.data?.type === 'jagu-home-ready' ||
        event.data?.type === 'jagu-content-ready' ||
        event.data?.type === 'jagu-contact-ready' ||
        event.data?.type === 'jagu-chrome-ready' ||
        event.data?.type === 'jagu-theme-ready'
      ) {
        setPreviewReady(true)
      }
    }

    window.addEventListener('message', onMessage)

    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    if (!previewReady) return
    pushPreview()
  }, [settings, contentSettings, contactSettings, chromeSettings, themeSettings, previewReady, pageId])

  const selected = selectedId ? settings.sections.find(section => section.id === selectedId) || null : null

  const focusSection = (id: string, forceOpen = false) => {
    if (!forceOpen && selectedId === id) {
      setSelectedId(null)
      return
    }

    setSelectedId(id)
    frameRef.current?.contentWindow?.postMessage({ type: 'jagu-home-scroll', id }, window.location.origin)
    window.setTimeout(() => {
      sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  const closeSection = () => setSelectedId(null)

  return (
    <div className='flex h-[calc(100dvh-110px)] min-h-[560px] flex-col gap-3 overflow-hidden'>
      <div className='flex shrink-0 flex-wrap items-center justify-between gap-3'>
        <div>
          <Typography variant='h4'>Website editor</Typography>
          <Typography color='text.secondary'>Select a page on top. Edit on the left. Live preview stays on the right.</Typography>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <ToggleButtonGroup
            exclusive
            size='small'
            value={device}
            onChange={(_, value: 'desktop' | 'mobile' | null) => {
              if (value) setDevice(value)
            }}
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.75,
                py: 0.85,
                gap: 1,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&.Mui-selected': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '&:hover': { bgcolor: 'primary.dark' }
                }
              },
              '& i': {
                fontSize: '1.15rem',
                width: '1.15rem',
                height: '1.15rem',
                lineHeight: 1,
                flexShrink: 0
              }
            }}
          >
            <ToggleButton value='desktop' aria-label='Desktop preview'>
              <i className='tabler-device-desktop' />
              Desktop
            </ToggleButton>
            <ToggleButton value='mobile' aria-label='Mobile preview'>
              <i className='tabler-device-mobile' />
              Mobile
            </ToggleButton>
          </ToggleButtonGroup>
          <Button size='small' variant='outlined' onClick={() => nudgeZoom(-1)} startIcon={<i className='tabler-zoom-out' />}>
            Zoom out
          </Button>
          <Button size='small' variant={zoomMode === 'fit' ? 'contained' : 'outlined'} onClick={() => setZoomMode('fit')}>
            Fit {Math.round(previewScale * 100)}%
          </Button>
          <Button size='small' variant='outlined' onClick={() => nudgeZoom(1)} startIcon={<i className='tabler-zoom-in' />}>
            Zoom in
          </Button>
          <Button size='small' variant={zoomMode === 1 ? 'contained' : 'outlined'} onClick={() => setZoomMode(1)}>
            100%
          </Button>
          <Button
            variant='contained'
            disabled={saving}
            startIcon={<i className='tabler-device-floppy' />}
            onClick={() => void save()}
            sx={{
              '& .MuiButton-startIcon': { mr: 0.75 },
              '& .MuiButton-startIcon > i': {
                fontSize: '1.15rem',
                width: '1.15rem',
                height: '1.15rem',
                lineHeight: 1
              }
            }}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>

      <Card className='shrink-0' sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
          <Typography variant='subtitle2' className='mbe-2'>Select page</Typography>
          <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
            {SITE_PAGES.map(page => {
              const active = pageId === page.id

              return (
                <Chip
                  key={page.id}
                  clickable
                  color={active ? 'primary' : 'default'}
                  variant={active ? 'filled' : 'outlined'}
                  icon={<i className={page.icon} />}
                  label={page.label}
                  onClick={() => setPageId(page.id)}
                  sx={{
                    height: 36,
                    px: 0.5,
                    '& .MuiChip-icon': {
                      ml: 1,
                      mr: -0.25,
                      fontSize: '1.05rem',
                      width: '1.05rem',
                      height: '1.05rem'
                    }
                  }}
                />
              )
            })}
          </Stack>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5 }}>
            {activePage.hint} · Preview: {activePage.path}
          </Typography>
        </CardContent>
      </Card>

      {message ? <Alert severity='success'>{message}</Alert> : null}
      {error ? <Alert severity='error'>{error}</Alert> : null}
      <div className='grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(240px,30%)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,26%)_minmax(0,1fr)]'>
        <div className='min-h-0 overflow-auto pe-1'>
          {activePage.kind === 'theme' ? (
            <ThemeEditor
              settings={themeSettings}
              onChange={next => {
                themeEdit.current = true
                setThemeSettings(next)
              }}
              onPickLogo={() => setThemeLogoPick(true)}
            />
          ) : null}

          {activePage.kind === 'header' || activePage.kind === 'footer' ? (
            <SiteChromeEditor
              mode={activePage.kind}
              chrome={chromeSettings}
              contact={contactSettings}
              onChromeChange={next => {
                chromeEdit.current = true
                setChromeSettings(mergeSiteChromeSettings(next))
              }}
              onContactChange={next => {
                contactEdit.current = true
                setContactSettings(next)
              }}
            />
          ) : null}

          {activePage.kind === 'contact' ? (
            <ContactPageEditor
              settings={contactSettings}
              onChange={next => {
                contactEdit.current = true
                setContactSettings(next)
              }}
              onFocusPreview={id => {
                frameRef.current?.contentWindow?.postMessage({ type: 'jagu-contact-scroll', id }, window.location.origin)
              }}
            />
          ) : null}

          {activePage.kind === 'content' ? (
            <ContentPageEditor
              settings={contentSettings}
              pageLabel={activePage.label}
              onChange={next => {
                contentEdit.current = true
                setContentSettings(next)
              }}
              onPickMedia={field => setContentMediaField(field)}
              onFocusPreview={id => {
                frameRef.current?.contentWindow?.postMessage({ type: 'jagu-content-scroll', page: pageId, id }, window.location.origin)
              }}
              onAddBlock={() => {
                contentEdit.current = true
                setContentSettings(current => ({ ...current, blocks: [...current.blocks, createContentBlock()] }))
              }}
              onRemoveBlock={id => {
                setConfirm({
                  title: 'Remove this section?',
                  message: 'This content block will be removed from the page.',
                  action: () => {
                    contentEdit.current = true
                    setContentSettings(current => ({ ...current, blocks: current.blocks.filter(block => block.id !== id) }))
                  }
                })
              }}
              onAddAction={() => {
                contentEdit.current = true
                setContentSettings(current => ({ ...current, actions: [...current.actions, createContentAction()] }))
              }}
              onRemoveAction={id => {
                setConfirm({
                  title: 'Remove this button?',
                  message: 'This button will be removed from the page.',
                  action: () => {
                    contentEdit.current = true
                    setContentSettings(current => ({ ...current, actions: current.actions.filter(action => action.id !== id) }))
                  }
                })
              }}
            />
          ) : null}

          {activePage.kind === 'home' ? (
            <Box>
          <Typography variant='subtitle2' className='mbe-2'>Page sections</Typography>
          <Stack spacing={2} className='mbe-3'>
            {settings.sections.map((section, index) => {
              const meta = homeSectionMeta(section.type)
              const active = selected?.id === section.id

              return (
                <Box
                  key={section.id}
                  ref={(node: HTMLDivElement | null) => {
                    sectionRefs.current[section.id] = node
                  }}
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: active ? 'primary.main' : 'divider',
                    bgcolor: 'background.paper',
                    overflow: 'hidden',
                    boxShadow: active ? 4 : 0,
                    transition: 'border-color .2s ease, box-shadow .2s ease'
                  }}
                >
                  <Box
                    onClick={() => focusSection(section.id)}
                    sx={{
                      cursor: 'pointer',
                      p: 1.75,
                      bgcolor: active ? 'action.selected' : 'transparent',
                      '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' }
                    }}
                  >
                    <Box className='flex items-start gap-3'>
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          display: 'grid',
                          placeItems: 'center',
                          bgcolor: active ? 'primary.main' : 'action.hover',
                          color: active ? 'primary.contrastText' : 'text.secondary',
                          flexShrink: 0
                        }}
                      >
                        <i className={`${meta.icon} text-xl`} />
                      </Box>
                      <Box className='min-w-0 flex-1'>
                        <Box className='flex flex-wrap items-center gap-1'>
                          <Typography className='font-medium leading-tight'>{section.title || meta.label}</Typography>
                          <Chip size='small' label={meta.label} variant='outlined' sx={{ height: 20 }} />
                          {section.locked ? <Chip size='small' label='Built in' sx={{ height: 20 }} /> : <Chip size='small' label='Custom' color='info' sx={{ height: 20 }} />}
                          {!section.enabled ? <Chip size='small' label='Hidden' color='warning' sx={{ height: 20 }} /> : null}
                        </Box>
                        <Typography variant='caption' color='text.secondary' className='block mbs-1'>
                          {meta.hint}
                        </Typography>
                        <Box className='mts-2'>
                          <SectionThumb type={section.type} />
                        </Box>
                        <Box className='mt-2 flex items-center gap-1'>
                          <IconButton size='small' onClick={event => { event.stopPropagation(); move(index, -1) }} aria-label='Move up'>
                            <i className='tabler-arrow-up' />
                          </IconButton>
                          <IconButton size='small' onClick={event => { event.stopPropagation(); move(index, 1) }} aria-label='Move down'>
                            <i className='tabler-arrow-down' />
                          </IconButton>
                          {section.locked ? null : (
                            <IconButton size='small' color='error' onClick={event => { event.stopPropagation(); removeSection(section.id) }} aria-label='Remove section'>
                              <i className='tabler-trash' />
                            </IconButton>
                          )}
                          <Chip
                            size='small'
                            color={active ? 'primary' : 'default'}
                            variant={active ? 'filled' : 'outlined'}
                            clickable
                            onClick={event => {
                              event.stopPropagation()
                              if (active) closeSection()
                              else focusSection(section.id, true)
                            }}
                            icon={<i className={active ? 'tabler-chevron-up' : 'tabler-chevron-down'} />}
                            label={active ? 'Close settings' : 'Open settings'}
                            sx={{ ml: 'auto', height: 24 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Collapse in={active} timeout='auto' unmountOnExit>
                    <Divider />
                    <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50') }}>
                      <HomeSectionEditor
                        section={section}
                        products={products}
                        productSearch={productSearch}
                        pickerCollection={pickerCollection}
                        onProductSearch={setProductSearch}
                        onPickerCollection={setPickerCollection}
                        onUpdateSection={updateSection}
                        onUpdateItem={updateItem}
                        onAddItem={addItem}
                        onRequestRemoveItem={requestRemoveItem}
                        onMoveItem={moveItem}
                        onToggleProduct={toggleProduct}
                        onMoveSelectedProduct={moveSelectedProduct}
                        onPickMedia={(sectionId, itemId, field = 'image') => setMediaFor({ sectionId, itemId, field })}
                      />
                    </Box>
                  </Collapse>
                </Box>
              )
            })}
          </Stack>

          <Card sx={{ borderRadius: 2 }}>
            <CardContent
              sx={{
                px: 2,
                py: 1.75,
                '&:last-child': { pb: 1.75 }
              }}
            >
              <Typography variant='subtitle2' sx={{ mb: 0.25 }}>
                Add section
              </Typography>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
                Extra sections can be removed later.
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 1.25,
                  width: '100%'
                }}
              >
                {HOME_SECTION_TYPES.map((option, index) => {
                  const active = addType === option.type
                  const isLastOdd = index === HOME_SECTION_TYPES.length - 1 && HOME_SECTION_TYPES.length % 2 === 1

                  return (
                    <Box
                      key={option.type}
                      onClick={() => setAddType(option.type)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 1.5,
                        border: '1px solid',
                        borderColor: active ? 'primary.main' : 'divider',
                        bgcolor: active ? 'action.selected' : 'background.paper',
                        px: 1.25,
                        py: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.75,
                        gridColumn: isLastOdd ? '1 / -1' : 'auto'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: 1,
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                            bgcolor: active ? 'primary.main' : 'action.hover',
                            color: active ? 'primary.contrastText' : 'text.secondary'
                          }}
                        >
                          <i className={`${option.icon} text-base`} />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant='body2' className='font-medium leading-tight' noWrap>
                            {option.label}
                          </Typography>
                          <Typography variant='caption' color='text.secondary' noWrap sx={{ display: 'block', lineHeight: 1.2 }}>
                            {option.hint}
                          </Typography>
                        </Box>
                      </Box>
                      <SectionThumb type={option.type} />
                    </Box>
                  )
                })}
              </Box>
              <Button
                sx={{ mt: 1.5 }}
                fullWidth
                size='small'
                variant='contained'
                startIcon={<i className='tabler-plus' />}
                onClick={() => addSection(addType)}
              >
                Add {homeSectionMeta(addType).label}
              </Button>
            </CardContent>
          </Card>
            </Box>
          ) : null}
        </div>
        <div className='flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden'>
          <Box className='flex flex-wrap items-center justify-between gap-2'>
            <Typography variant='subtitle2'>Live website preview</Typography>
            <Box className='flex flex-wrap items-center gap-1'>
              <Chip size='small' icon={<i className={`${activePage.icon} text-base`} />} label={activePage.label} />
              <Chip
                size='small'
                color={device === 'desktop' && frameViewport > 0 && frameViewport < 1100 ? 'warning' : 'primary'}
                variant='filled'
                icon={<i className={device === 'mobile' ? 'tabler-device-mobile text-base' : 'tabler-device-desktop text-base'} />}
                label={
                  device === 'mobile'
                    ? `Android ${designWidth}×${designHeight} · zoom ${Math.round(previewScale * 100)}%`
                    : frameViewport
                      ? `Desktop ${frameViewport}px · zoom ${Math.round(previewScale * 100)}%`
                      : `Desktop ${designWidth}px · zoom ${Math.round(previewScale * 100)}%`
                }
              />
            </Box>
          </Box>
          <div
            ref={previewShellRef}
            className='min-h-0 min-w-0 flex-1 overflow-hidden'
            style={{ background: device === 'mobile' ? '#12151c' : '#fff4f8' }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                position: 'relative',
                display: 'grid',
                placeItems: device === 'mobile' ? 'center' : 'stretch'
              }}
            >
              <div
                style={{
                  width: stageWidth,
                  height: stageHeight,
                  overflow: 'hidden',
                  position: device === 'mobile' ? 'relative' : 'absolute',
                  top: device === 'mobile' ? undefined : 0,
                  left: device === 'mobile' ? undefined : 0,
                  borderRadius: device === 'mobile' ? 28 : 0,
                  boxShadow: device === 'mobile' ? '0 18px 48px rgba(0,0,0,0.45)' : 'none',
                  border: device === 'mobile' ? '10px solid #1f2430' : 'none',
                  boxSizing: 'content-box',
                  background: '#fff4f8'
                }}
              >
                <div
                  style={{
                    width: designWidth,
                    height: frameHeight,
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left'
                  }}
                >
                  <iframe
                    key={`${pageId}-${device}-${designWidth}`}
                    ref={frameRef}
                    title='Live website'
                    src={frameSrc}
                    onLoad={onPreviewLoad}
                    className='jagu-site-preview-frame'
                    width={designWidth}
                    height={frameHeight}
                    style={
                      {
                        '--jagu-preview-w': `${designWidth}px`,
                        '--jagu-preview-h': `${frameHeight}px`,
                        width: designWidth,
                        minWidth: designWidth,
                        maxWidth: designWidth,
                        height: frameHeight,
                        minHeight: frameHeight,
                        border: 0,
                        outline: 'none',
                        boxShadow: 'none',
                        display: 'block',
                        background: '#fff4f8'
                      } as CSSProperties
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <MediaPickerModal
        open={Boolean(mediaFor) || Boolean(contentMediaField) || themeLogoPick}
        file={null}
        onClose={() => {
          setMediaFor(null)
          setContentMediaField(null)
          setThemeLogoPick(false)
        }}
        onSelect={pickMedia}
      />
      <ConfirmActionDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message || ''}
        confirmLabel='Remove'
        cancelLabel='Keep'
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          confirm?.action()
          setConfirm(null)
        }}
      />
    </div>
  )
}

export default HomePageManager
