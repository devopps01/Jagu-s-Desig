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

import {
  createContactFaq,
  createContactHelpCard,
  createContactTopic,
  type ContactFaq,
  type ContactHelpCard,
  type ContactSettings,
  type ContactTopic
} from '@/libs/contact-types'

type PanelId = 'copy' | 'help' | 'topics' | 'reach' | 'surat' | 'bangalore' | 'form' | 'map' | 'faq'

type Props = {
  settings: ContactSettings
  onChange: (next: ContactSettings) => void
  onFocusPreview?: (id: PanelId) => void
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

const ItemBox = ({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) => (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
    <Box className='mb-2 flex items-center justify-between'>
      <Typography variant='caption' color='text.secondary'>
        {title}
      </Typography>
      <IconButton size='small' color='error' onClick={onRemove} aria-label='Remove'>
        <i className='tabler-trash' />
      </IconButton>
    </Box>
    <Stack spacing={2}>{children}</Stack>
  </Box>
)

const ContactPageEditor = ({ settings, onChange, onFocusPreview }: Props) => {
  const [selectedId, setSelectedId] = useState<PanelId | null>('copy')
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const patch = (partial: Partial<ContactSettings>) => onChange({ ...settings, ...partial })
  const setField = (key: keyof ContactSettings, value: string) => patch({ [key]: value } as Partial<ContactSettings>)

  const patchHelp = (id: string, partial: Partial<ContactHelpCard>) =>
    patch({ helpCards: settings.helpCards.map(card => (card.id === id ? { ...card, ...partial } : card)) })

  const patchTopic = (id: string, partial: Partial<ContactTopic>) =>
    patch({ topics: settings.topics.map(topic => (topic.id === id ? { ...topic, ...partial } : topic)) })

  const patchFaq = (id: string, partial: Partial<ContactFaq>) =>
    patch({ faqs: settings.faqs.map(faq => (faq.id === id ? { ...faq, ...partial } : faq)) })

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
    setSelectedId('copy')
  }, [])

  return (
    <Box>
      <Typography variant='subtitle2' className='mbe-1'>
        Contact page sections
      </Typography>
      <Typography variant='caption' color='text.secondary' className='block mbe-3'>
        Open settings under each card to change section text, cards, FAQ and contact details. Live preview updates on the right.
      </Typography>

      <Alert severity='info' sx={{ mb: 2 }}>
        You can edit every Contact UI section here — not only phone and address.
      </Alert>

      <Stack spacing={2}>
        <SectionCard
          id='copy'
          icon='tabler-heading'
          title='Page intro'
          hint='Top kicker, headline and intro text'
          chips={['Header']}
          active={selectedId === 'copy'}
          onOpen={() => focusPanel('copy')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.copy = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Small heading (kicker)' value={settings.kicker} onChange={event => setField('kicker', event.target.value)} />
            <TextField fullWidth label='Headline' value={settings.headline} onChange={event => setField('headline', event.target.value)} />
            <TextField fullWidth multiline minRows={3} label='Intro' value={settings.intro} onChange={event => setField('intro', event.target.value)} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='help'
          icon='tabler-heart-handshake'
          title='How we help'
          hint='Support cards under the intro'
          chips={[`${settings.helpCards.length} cards`]}
          active={selectedId === 'help'}
          onOpen={() => focusPanel('help')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.help = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Section note' value={settings.helpNote} onChange={event => setField('helpNote', event.target.value)} />
            <TextField fullWidth label='Section title' value={settings.helpTitle} onChange={event => setField('helpTitle', event.target.value)} />
            <Box className='flex justify-end'>
              <Button size='small' startIcon={<i className='tabler-plus' />} onClick={() => patch({ helpCards: [...settings.helpCards, createContactHelpCard()] })}>
                Add card
              </Button>
            </Box>
            {settings.helpCards.map((card, index) => (
              <ItemBox
                key={card.id}
                title={`Card ${index + 1}`}
                onRemove={() => patch({ helpCards: settings.helpCards.filter(row => row.id !== card.id) })}
              >
                <FormControlLabel
                  control={<Switch checked={card.enabled !== false} onChange={event => patchHelp(card.id, { enabled: event.target.checked })} />}
                  label='Show card'
                />
                <TextField fullWidth label='Icon class' helperText='Example: tabler-brand-whatsapp' value={card.icon} onChange={event => patchHelp(card.id, { icon: event.target.value })} />
                <TextField fullWidth label='Title' value={card.title} onChange={event => patchHelp(card.id, { title: event.target.value })} />
                <TextField fullWidth multiline minRows={2} label='Text' value={card.copy} onChange={event => patchHelp(card.id, { copy: event.target.value })} />
              </ItemBox>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          id='topics'
          icon='tabler-shield-check'
          title='Quality · Security · Care'
          hint='Expectation topic columns'
          chips={[`${settings.topics.length} topics`]}
          active={selectedId === 'topics'}
          onOpen={() => focusPanel('topics')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.topics = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Section note' value={settings.topicsNote} onChange={event => setField('topicsNote', event.target.value)} />
            <TextField fullWidth label='Section title' value={settings.topicsTitle} onChange={event => setField('topicsTitle', event.target.value)} />
            <Box className='flex justify-end'>
              <Button size='small' startIcon={<i className='tabler-plus' />} onClick={() => patch({ topics: [...settings.topics, createContactTopic()] })}>
                Add topic
              </Button>
            </Box>
            {settings.topics.map((topic, index) => (
              <ItemBox
                key={topic.id}
                title={`Topic ${index + 1}`}
                onRemove={() => patch({ topics: settings.topics.filter(row => row.id !== topic.id) })}
              >
                <FormControlLabel
                  control={<Switch checked={topic.enabled !== false} onChange={event => patchTopic(topic.id, { enabled: event.target.checked })} />}
                  label='Show topic'
                />
                <TextField fullWidth label='Icon class' value={topic.icon} onChange={event => patchTopic(topic.id, { icon: event.target.value })} />
                <TextField fullWidth label='Title' value={topic.title} onChange={event => patchTopic(topic.id, { title: event.target.value })} />
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  label='Bullet points'
                  helperText='One point per line.'
                  value={topic.points}
                  onChange={event => patchTopic(topic.id, { points: event.target.value })}
                />
              </ItemBox>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          id='reach'
          icon='tabler-phone'
          title='Reach us'
          hint='Phone, WhatsApp, email, hours and reply card'
          chips={['Phone', 'WhatsApp']}
          active={selectedId === 'reach'}
          onOpen={() => focusPanel('reach')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.reach = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Email' value={settings.email} onChange={event => setField('email', event.target.value)} />
            <TextField fullWidth label='Surat phone' value={settings.phone} onChange={event => setField('phone', event.target.value)} />
            <TextField
              fullWidth
              label='WhatsApp number'
              helperText='Digits only with country code, e.g. 919033301412'
              value={settings.whatsapp}
              onChange={event => setField('whatsapp', event.target.value)}
            />
            <TextField fullWidth label='Hours title' value={settings.hoursTitle} onChange={event => setField('hoursTitle', event.target.value)} />
            <TextField fullWidth label='Store hours' value={settings.hours} onChange={event => setField('hours', event.target.value)} />
            <TextField fullWidth label='Hours note' value={settings.hoursNote} onChange={event => setField('hoursNote', event.target.value)} />
            <TextField fullWidth label='Reply card title' value={settings.replyTitle} onChange={event => setField('replyTitle', event.target.value)} />
            <TextField fullWidth multiline minRows={2} label='Reply card text' value={settings.replyText} onChange={event => setField('replyText', event.target.value)} />
            <TextField fullWidth label='WhatsApp button' value={settings.whatsappButtonLabel} onChange={event => setField('whatsappButtonLabel', event.target.value)} />
            <TextField fullWidth label='Email button' value={settings.emailButtonLabel} onChange={event => setField('emailButtonLabel', event.target.value)} />
            <TextField fullWidth label='Video button' value={settings.videoButtonLabel} onChange={event => setField('videoButtonLabel', event.target.value)} />
            <TextField fullWidth label='Video button link' value={settings.videoButtonHref} onChange={event => setField('videoButtonHref', event.target.value)} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='surat'
          icon='tabler-building-store'
          title='Surat atelier'
          hint='Main store address and Google Maps pin'
          chips={['Map']}
          active={selectedId === 'surat'}
          onOpen={() => focusPanel('surat')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.surat = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Title' value={settings.suratTitle} onChange={event => setField('suratTitle', event.target.value)} />
            <TextField fullWidth multiline minRows={3} label='Address' value={settings.suratAddress} onChange={event => setField('suratAddress', event.target.value)} />
            <TextField fullWidth label='Map search' value={settings.suratMapQuery} onChange={event => setField('suratMapQuery', event.target.value)} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='bangalore'
          icon='tabler-map-pin'
          title='Second store'
          hint='Leave address blank to hide on the website'
          chips={[settings.bangaloreAddress ? 'Shown' : 'Hidden']}
          active={selectedId === 'bangalore'}
          onOpen={() => focusPanel('bangalore')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.bangalore = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Title' value={settings.bangaloreTitle} onChange={event => setField('bangaloreTitle', event.target.value)} />
            <TextField fullWidth label='Phone' value={settings.bangalorePhone} onChange={event => setField('bangalorePhone', event.target.value)} />
            <TextField fullWidth multiline minRows={3} label='Address' value={settings.bangaloreAddress} onChange={event => setField('bangaloreAddress', event.target.value)} />
            <TextField fullWidth label='Map search' value={settings.bangaloreMapQuery} onChange={event => setField('bangaloreMapQuery', event.target.value)} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='form'
          icon='tabler-mail'
          title='Contact form'
          hint='Form headings, topics list and success message'
          chips={['Form']}
          active={selectedId === 'form'}
          onOpen={() => focusPanel('form')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.form = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Form kicker' value={settings.formKicker} onChange={event => setField('formKicker', event.target.value)} />
            <TextField fullWidth label='Form title' value={settings.formTitle} onChange={event => setField('formTitle', event.target.value)} />
            <TextField fullWidth label='Submit button' value={settings.formSubmitLabel} onChange={event => setField('formSubmitLabel', event.target.value)} />
            <TextField fullWidth label='Form note' value={settings.formNote} onChange={event => setField('formNote', event.target.value)} />
            <TextField fullWidth label='Success title' value={settings.formSuccessTitle} onChange={event => setField('formSuccessTitle', event.target.value)} />
            <TextField fullWidth multiline minRows={2} label='Success text' value={settings.formSuccessText} onChange={event => setField('formSuccessText', event.target.value)} />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label='Topic dropdown options'
              helperText='One topic per line.'
              value={settings.subjects}
              onChange={event => setField('subjects', event.target.value)}
            />
          </Stack>
        </SectionCard>

        <SectionCard
          id='map'
          icon='tabler-map'
          title='Live map'
          hint='Map section headings'
          chips={['Map']}
          active={selectedId === 'map'}
          onOpen={() => focusPanel('map')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.map = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Section note' value={settings.mapNote} onChange={event => setField('mapNote', event.target.value)} />
            <TextField fullWidth label='Section title' value={settings.mapTitle} onChange={event => setField('mapTitle', event.target.value)} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='faq'
          icon='tabler-help'
          title='FAQ'
          hint='Questions accordion at the bottom'
          chips={[`${settings.faqs.length} items`]}
          active={selectedId === 'faq'}
          onOpen={() => focusPanel('faq')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.faq = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Section note' value={settings.faqNote} onChange={event => setField('faqNote', event.target.value)} />
            <TextField fullWidth label='Section title' value={settings.faqTitle} onChange={event => setField('faqTitle', event.target.value)} />
            <Box className='flex justify-end'>
              <Button size='small' startIcon={<i className='tabler-plus' />} onClick={() => patch({ faqs: [...settings.faqs, createContactFaq()] })}>
                Add question
              </Button>
            </Box>
            {settings.faqs.map((faq, index) => (
              <ItemBox key={faq.id} title={`FAQ ${index + 1}`} onRemove={() => patch({ faqs: settings.faqs.filter(row => row.id !== faq.id) })}>
                <FormControlLabel
                  control={<Switch checked={faq.enabled !== false} onChange={event => patchFaq(faq.id, { enabled: event.target.checked })} />}
                  label='Show question'
                />
                <TextField fullWidth label='Question' value={faq.question} onChange={event => patchFaq(faq.id, { question: event.target.value })} />
                <TextField fullWidth multiline minRows={3} label='Answer' value={faq.answer} onChange={event => patchFaq(faq.id, { answer: event.target.value })} />
              </ItemBox>
            ))}
          </Stack>
        </SectionCard>
      </Stack>
    </Box>
  )
}

export default ContactPageEditor
