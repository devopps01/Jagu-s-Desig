'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ContactSettings } from '@/libs/contact-types'
import { createFooterLink, type FooterLink, type SiteChromeSettings } from '@/libs/site-chrome-types'

type PanelId = string

type Props = {
  mode: 'header' | 'footer'
  chrome: SiteChromeSettings
  contact: ContactSettings
  onChromeChange: (next: SiteChromeSettings) => void
  onContactChange: (next: ContactSettings) => void
  onFocusPreview?: (id: string) => void
}

const SectionCard = ({
  id,
  icon,
  title,
  hint,
  chips,
  active,
  onOpen,
  onClose,
  children,
  cardRef
}: {
  id: string
  icon: string
  title: string
  hint: string
  chips?: string[]
  active: boolean
  onOpen: () => void
  onClose: () => void
  children: ReactNode
  cardRef?: (node: HTMLDivElement | null) => void
}) => (
  <Box
    ref={cardRef}
    data-panel={id}
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
      onClick={onOpen}
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
          <i className={`${icon} text-xl`} />
        </Box>
        <Box className='min-w-0 flex-1'>
          <Box className='flex flex-wrap items-center gap-1'>
            <Typography className='font-medium leading-tight'>{title}</Typography>
            {(chips || []).map(chip => (
              <Chip key={chip} size='small' label={chip} variant='outlined' sx={{ height: 20 }} />
            ))}
          </Box>
          <Typography variant='caption' color='text.secondary' className='block mbs-1'>
            {hint}
          </Typography>
          <Box className='mt-2 flex justify-end'>
            <Chip
              size='small'
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              clickable
              onClick={event => {
                event.stopPropagation()
                if (active) onClose()
                else onOpen()
              }}
              icon={<i className={active ? 'tabler-chevron-up' : 'tabler-chevron-down'} />}
              label={active ? 'Close settings' : 'Open settings'}
              sx={{ height: 24 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
    <Collapse in={active} timeout='auto' unmountOnExit>
      <Divider />
      <Box sx={{ p: 2, bgcolor: (theme) => (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'grey.50') }}>
        {children}
      </Box>
    </Collapse>
  </Box>
)

const FooterLinksEditor = ({
  title,
  links,
  onChange
}: {
  title: string
  links: FooterLink[]
  onChange: (next: FooterLink[]) => void
}) => {
  const update = (id: string, patch: Partial<FooterLink>) =>
    onChange(links.map(link => (link.id === id ? { ...link, ...patch } : link)))

  const move = (id: string, direction: -1 | 1) => {
    const index = links.findIndex(link => link.id === id)
    const target = index + direction

    if (index < 0 || target < 0 || target >= links.length) return

    const next = [...links]
    const [row] = next.splice(index, 1)

    next.splice(target, 0, row)
    onChange(next)
  }

  return (
    <Stack spacing={2}>
      <Box className='flex flex-wrap items-center justify-between gap-2'>
        <Typography variant='subtitle2'>{title}</Typography>
        <Button
          size='small'
          variant='contained'
          startIcon={<i className='tabler-plus' />}
          onClick={() => onChange([...links, createFooterLink({ label: 'New link', href: '/' })])}
        >
          Add link
        </Button>
      </Box>
      {links.length ? (
        links.map((link, index) => (
          <Box key={link.id} className='rounded border p-3'>
            <Box className='mb-2 flex flex-wrap items-center justify-between gap-2'>
              <Typography variant='caption' color='text.secondary'>
                Link {index + 1} of {links.length}
              </Typography>
              <Stack direction='row' spacing={0.5}>
                <IconButton size='small' disabled={index === 0} onClick={() => move(link.id, -1)} aria-label='Move up'>
                  <i className='tabler-arrow-up' />
                </IconButton>
                <IconButton
                  size='small'
                  disabled={index === links.length - 1}
                  onClick={() => move(link.id, 1)}
                  aria-label='Move down'
                >
                  <i className='tabler-arrow-down' />
                </IconButton>
                <IconButton
                  size='small'
                  color='error'
                  onClick={() => onChange(links.filter(row => row.id !== link.id))}
                  aria-label='Remove link'
                >
                  <i className='tabler-trash' />
                </IconButton>
              </Stack>
            </Box>
            <Stack spacing={1.5}>
              <FormControlLabel
                control={<Switch checked={link.enabled} onChange={event => update(link.id, { enabled: event.target.checked })} />}
                label='Show this link'
              />
              <TextField
                fullWidth
                size='small'
                label='Label'
                value={link.label}
                onChange={event => update(link.id, { label: event.target.value })}
              />
              <TextField
                fullWidth
                size='small'
                label='Link'
                value={link.href}
                onChange={event => update(link.id, { href: event.target.value })}
                helperText='Example: /returns · use __account__ for Login / My account'
              />
            </Stack>
          </Box>
        ))
      ) : (
        <Alert severity='info'>No links yet. Click Add link.</Alert>
      )}
    </Stack>
  )
}

const SiteChromeEditor = ({ mode, chrome, contact, onChromeChange, onContactChange, onFocusPreview }: Props) => {
  const [selectedId, setSelectedId] = useState<PanelId | null>(mode === 'header' ? 'announce' : 'footer-copy')
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const patchChrome = (partial: Partial<SiteChromeSettings>) => onChromeChange({ ...chrome, ...partial })
  const patchContact = (partial: Partial<ContactSettings>) => onContactChange({ ...contact, ...partial })

  const focusPanel = (id: PanelId) => {
    if (selectedId === id) {
      setSelectedId(null)
      return
    }

    setSelectedId(id)
    onFocusPreview?.(id)
    window.setTimeout(() => {
      panelRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  useEffect(() => {
    setSelectedId(mode === 'header' ? 'announce' : 'footer-copy')
  }, [mode])

  if (mode === 'header') {
    return (
      <Box>
        <Typography variant='subtitle2' className='mbe-1'>
          Header & WhatsApp float
        </Typography>
        <Typography variant='caption' color='text.secondary' className='block mbe-3'>
          Top ticker, phone/WhatsApp numbers and the floating WhatsApp button used on every page.
        </Typography>
        <Alert severity='info' sx={{ mb: 2 }}>
          WhatsApp number here updates the floating button, header icon, footer and Contact page together.
        </Alert>
        <Stack spacing={2}>
          <SectionCard
            id='announce'
            icon='tabler-speakerphone'
            title='Announcement bar'
            hint='Scrolling messages at the very top of the website'
            chips={[chrome.showAnnouncement ? 'On' : 'Off']}
            active={selectedId === 'announce'}
            onOpen={() => focusPanel('announce')}
            onClose={() => setSelectedId(null)}
            cardRef={node => {
              panelRefs.current.announce = node
            }}
          >
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={chrome.showAnnouncement} onChange={event => patchChrome({ showAnnouncement: event.target.checked })} />}
                label='Show announcement bar'
              />
              <TextField
                fullWidth
                multiline
                minRows={4}
                label='Messages'
                helperText='One message per line. They scroll in a loop.'
                value={chrome.announcements}
                onChange={event => patchChrome({ announcements: event.target.value })}
              />
            </Stack>
          </SectionCard>

          <SectionCard
            id='contact-numbers'
            icon='tabler-phone'
            title='Phone & WhatsApp number'
            hint='Used in header icons, footer and floating WhatsApp button'
            chips={['Global']}
            active={selectedId === 'contact-numbers'}
            onOpen={() => focusPanel('contact-numbers')}
            onClose={() => setSelectedId(null)}
            cardRef={node => {
              panelRefs.current['contact-numbers'] = node
            }}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                label='Display phone'
                helperText='Shown under the floating WhatsApp button and in the header tip.'
                value={contact.phone}
                onChange={event => patchContact({ phone: event.target.value })}
              />
              <TextField
                fullWidth
                label='WhatsApp number'
                helperText='Digits with country code, e.g. 919033301412 — this opens the chat.'
                value={contact.whatsapp}
                onChange={event => patchContact({ whatsapp: event.target.value })}
              />
            </Stack>
          </SectionCard>

          <SectionCard
            id='float'
            icon='tabler-brand-whatsapp'
            title='Floating WhatsApp button'
            hint='Green chat button fixed on every storefront page'
            chips={[chrome.floatEnabled ? 'On' : 'Off']}
            active={selectedId === 'float'}
            onOpen={() => focusPanel('float')}
            onClose={() => setSelectedId(null)}
            cardRef={node => {
              panelRefs.current.float = node
            }}
          >
            <Stack spacing={2}>
              <FormControlLabel
                control={<Switch checked={chrome.floatEnabled} onChange={event => patchChrome({ floatEnabled: event.target.checked })} />}
                label='Show floating WhatsApp button'
              />
              <TextField fullWidth label='Button label' value={chrome.floatLabel} onChange={event => patchChrome({ floatLabel: event.target.value })} />
              <TextField
                fullWidth
                multiline
                minRows={2}
                label='Pre-filled WhatsApp message'
                helperText='Opens in WhatsApp when a visitor taps the button.'
                value={chrome.floatMessage}
                onChange={event => patchChrome({ floatMessage: event.target.value })}
              />
            </Stack>
          </SectionCard>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant='subtitle2' className='mbe-1'>
        Footer sections
      </Typography>
      <Typography variant='caption' color='text.secondary' className='block mbe-3'>
        Brand text, each column link, and atelier details. Add / remove / reorder links live on the right.
      </Typography>
      <Stack spacing={2}>
        <SectionCard
          id='footer-copy'
          icon='tabler-align-left'
          title='Brand column'
          hint='Logo side tagline and copyright line'
          chips={['Footer']}
          active={selectedId === 'footer-copy'}
          onOpen={() => focusPanel('footer-copy')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current['footer-copy'] = node
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Tagline under logo'
              value={chrome.footerTagline}
              onChange={event => patchChrome({ footerTagline: event.target.value })}
            />
            <TextField
              fullWidth
              label='Copyright line'
              value={chrome.footerCopyright}
              onChange={event => patchChrome({ footerCopyright: event.target.value })}
            />
          </Stack>
        </SectionCard>

        <SectionCard
          id='footer-policy'
          icon='tabler-shield-check'
          title='Policy & Inquiry links'
          hint='Each link: label + URL. Add, remove or reorder.'
          chips={[`${(chrome.footerPolicyLinks || []).filter(item => item.enabled).length} links`]}
          active={selectedId === 'footer-policy'}
          onOpen={() => focusPanel('footer-policy')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current['footer-policy'] = node
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              label='Column title'
              value={chrome.footerPolicyTitle}
              onChange={event => patchChrome({ footerPolicyTitle: event.target.value })}
            />
            <FooterLinksEditor
              title='Links in this column'
              links={chrome.footerPolicyLinks || []}
              onChange={footerPolicyLinks => patchChrome({ footerPolicyLinks })}
            />
          </Stack>
        </SectionCard>

        <SectionCard
          id='footer-info'
          icon='tabler-info-circle'
          title='Information links'
          hint='About, video, track order, account — each editable'
          chips={[`${(chrome.footerInfoLinks || []).filter(item => item.enabled).length} links`]}
          active={selectedId === 'footer-info'}
          onOpen={() => focusPanel('footer-info')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current['footer-info'] = node
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              label='Column title'
              value={chrome.footerInfoTitle}
              onChange={event => patchChrome({ footerInfoTitle: event.target.value })}
            />
            <FooterLinksEditor
              title='Links in this column'
              links={chrome.footerInfoLinks || []}
              onChange={footerInfoLinks => patchChrome({ footerInfoLinks })}
            />
          </Stack>
        </SectionCard>

        <SectionCard
          id='footer-atelier'
          icon='tabler-building-store'
          title='Atelier details'
          hint='Address and phones shown in the footer Atelier column'
          chips={['From Contact']}
          active={selectedId === 'footer-atelier'}
          onOpen={() => focusPanel('footer-atelier')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current['footer-atelier'] = node
          }}
        >
          <Stack spacing={2}>
            <TextField
              fullWidth
              label='Column title'
              value={chrome.footerAtelierTitle}
              onChange={event => patchChrome({ footerAtelierTitle: event.target.value })}
            />
            <Alert severity='info'>These fields also update Contact page and header WhatsApp.</Alert>
            <TextField fullWidth label='Atelier title' value={contact.suratTitle} onChange={event => patchContact({ suratTitle: event.target.value })} />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label='Address'
              value={contact.suratAddress}
              onChange={event => patchContact({ suratAddress: event.target.value })}
            />
            <TextField fullWidth label='Display phone' value={contact.phone} onChange={event => patchContact({ phone: event.target.value })} />
            <TextField
              fullWidth
              label='WhatsApp number'
              helperText='Digits with country code, e.g. 919033301412'
              value={contact.whatsapp}
              onChange={event => patchContact({ whatsapp: event.target.value })}
            />
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  )
}

export default SiteChromeEditor
