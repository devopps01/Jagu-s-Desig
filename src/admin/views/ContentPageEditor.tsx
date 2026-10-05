'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Collapse from '@mui/material/Collapse'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import type { ContentAction, ContentBlock, ContentPageSettings } from '@/libs/site-pages'

type PanelId = 'intro' | 'banner' | 'actions' | 'footer' | `block:${string}`

type Props = {
  settings: ContentPageSettings
  pageLabel: string
  onChange: (next: ContentPageSettings) => void
  onPickMedia: (field: 'bannerImage' | 'bannerImageMobile') => void
  onAddBlock: () => void
  onRemoveBlock: (id: string) => void
  onAddAction: () => void
  onRemoveAction: (id: string) => void
  onFocusPreview?: (id: string) => void
}

const ImageBox = ({
  label,
  hint,
  value,
  onChoose,
  onClear
}: {
  label: string
  hint: string
  value: string
  onChoose: () => void
  onClear: () => void
}) => (
  <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
    <Typography className='font-medium mbe-1'>{label}</Typography>
    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
      {hint}
    </Typography>
    {value ? (
      <Box component='img' src={value} alt={label} sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2, mb: 1.5, display: 'block' }} />
    ) : (
      <Box sx={{ height: 120, borderRadius: 2, mb: 1.5, border: '1px dashed', borderColor: 'divider', display: 'grid', placeItems: 'center', color: 'text.secondary' }}>
        No image
      </Box>
    )}
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Button size='small' variant='contained' fullWidth onClick={onChoose} sx={{ justifyContent: 'center', px: 2 }}>
        Choose image
      </Button>
      {value ? (
        <Button size='small' variant='outlined' color='secondary' fullWidth onClick={onClear} sx={{ justifyContent: 'center', px: 2 }}>
          Clear
        </Button>
      ) : null}
    </Stack>
  </Box>
)

const SectionCard = ({
  id,
  icon,
  title,
  hint,
  chips,
  active,
  onOpen,
  onClose,
  onRemove,
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
  onRemove?: () => void
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
          <Box className='mt-2 flex items-center gap-1'>
            {onRemove ? (
              <IconButton
                size='small'
                color='error'
                onClick={event => {
                  event.stopPropagation()
                  onRemove()
                }}
                aria-label='Remove section'
              >
                <i className='tabler-trash' />
              </IconButton>
            ) : null}
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
              sx={{ ml: 'auto', height: 24 }}
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

const ContentPageEditor = ({
  settings,
  pageLabel,
  onChange,
  onPickMedia,
  onAddBlock,
  onRemoveBlock,
  onAddAction,
  onRemoveAction,
  onFocusPreview
}: Props) => {
  const [selectedId, setSelectedId] = useState<PanelId | null>('intro')
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const blockCountRef = useRef(settings.blocks.length)

  const patch = (partial: Partial<ContentPageSettings>) => onChange({ ...settings, ...partial })

  const patchBlock = (id: string, partial: Partial<ContentBlock>) =>
    patch({
      blocks: settings.blocks.map(block => (block.id === id ? { ...block, ...partial } : block))
    })

  const patchAction = (id: string, partial: Partial<ContentAction>) =>
    patch({
      actions: settings.actions.map(action => (action.id === id ? { ...action, ...partial } : action))
    })

  const focusPanel = (id: PanelId, forceOpen = false) => {
    if (!forceOpen && selectedId === id) {
      setSelectedId(null)
      return
    }

    setSelectedId(id)
    onFocusPreview?.(id.startsWith('block:') ? id.slice(6) : id)
    window.setTimeout(() => {
      panelRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 80)
  }

  useEffect(() => {
    setSelectedId('intro')
    blockCountRef.current = settings.blocks.length
  }, [settings.page])

  useEffect(() => {
    if (settings.blocks.length > blockCountRef.current) {
      const last = settings.blocks[settings.blocks.length - 1]

      if (last) {
        const id = `block:${last.id}` as const
        setSelectedId(id)
        onFocusPreview?.(last.id)
        window.setTimeout(() => {
          panelRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }, 80)
      }
    }

    blockCountRef.current = settings.blocks.length
  }, [settings.blocks.length, onFocusPreview])

  return (
    <Box>
      <Typography variant='subtitle2' className='mbe-1'>
        {pageLabel} sections
      </Typography>
      <Typography variant='caption' color='text.secondary' className='block mbe-3'>
        Open settings under each section — same as Home. Live preview updates on the right.
      </Typography>

      <Alert severity='info' sx={{ mb: 2 }}>
        Edit one section at a time. Click Open settings to expand the full editor under that card.
      </Alert>

      <Stack spacing={2}>
        <SectionCard
          id='intro'
          icon='tabler-heading'
          title='Page intro'
          hint='Kicker, main title and intro text at the top of the page'
          chips={['Header']}
          active={selectedId === 'intro'}
          onOpen={() => focusPanel('intro')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.intro = node
          }}
        >
          <Stack spacing={2}>
            <TextField fullWidth label='Small heading (kicker)' value={settings.kicker} onChange={event => patch({ kicker: event.target.value })} />
            <TextField fullWidth label='Page title' value={settings.title} onChange={event => patch({ title: event.target.value })} />
            <TextField fullWidth multiline minRows={3} label='Intro' value={settings.intro} onChange={event => patch({ intro: event.target.value })} />
          </Stack>
        </SectionCard>

        <SectionCard
          id='banner'
          icon='tabler-photo'
          title='Top banner'
          hint='Optional full-width banner image above the page title'
          chips={[settings.showBanner ? 'On' : 'Off']}
          active={selectedId === 'banner'}
          onOpen={() => focusPanel('banner')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.banner = node
          }}
        >
          <Stack spacing={2}>
            <FormControlLabel
              control={<Switch checked={settings.showBanner} onChange={event => patch({ showBanner: event.target.checked })} />}
              label='Show top banner image'
            />
            {settings.showBanner ? (
              <>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <ImageBox
                      label='Desktop / Windows banner'
                      hint='Large screens'
                      value={settings.bannerImage}
                      onChoose={() => onPickMedia('bannerImage')}
                      onClear={() => patch({ bannerImage: '' })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <ImageBox
                      label='Mobile / Android banner'
                      hint='Phones. Empty = desktop image.'
                      value={settings.bannerImageMobile}
                      onChoose={() => onPickMedia('bannerImageMobile')}
                      onClear={() => patch({ bannerImageMobile: '' })}
                    />
                  </Grid>
                </Grid>
                <TextField fullWidth label='Banner kicker' value={settings.bannerKicker} onChange={event => patch({ bannerKicker: event.target.value })} />
                <TextField fullWidth label='Banner title' value={settings.bannerTitle} onChange={event => patch({ bannerTitle: event.target.value })} />
                <TextField fullWidth multiline minRows={2} label='Banner text' value={settings.bannerText} onChange={event => patch({ bannerText: event.target.value })} />
                <TextField fullWidth label='Banner button name' value={settings.bannerButtonLabel} onChange={event => patch({ bannerButtonLabel: event.target.value })} />
                <TextField fullWidth label='Banner button link' value={settings.bannerButtonHref} onChange={event => patch({ bannerButtonHref: event.target.value })} />
              </>
            ) : (
              <Typography variant='body2' color='text.secondary'>
                Turn the switch on to edit banner images and text.
              </Typography>
            )}
          </Stack>
        </SectionCard>

        <Box className='flex items-center justify-between gap-2 pt-1'>
          <Typography variant='subtitle2'>Content sections</Typography>
          <Button size='small' startIcon={<i className='tabler-plus' />} onClick={onAddBlock}>
            Add section
          </Button>
        </Box>

        {settings.blocks.map((block, index) => {
          const panelId = `block:${block.id}` as const
          const active = selectedId === panelId

          return (
            <SectionCard
              key={block.id}
              id={panelId}
              icon='tabler-article'
              title={block.title || `Section ${index + 1}`}
              hint='Heading, paragraphs and bullet list for this block'
              chips={[`Section ${index + 1}`, block.enabled === false ? 'Hidden' : 'Shown']}
              active={active}
              onOpen={() => focusPanel(panelId)}
              onClose={() => setSelectedId(null)}
              onRemove={() => onRemoveBlock(block.id)}
              cardRef={node => {
                panelRefs.current[panelId] = node
              }}
            >
              <Stack spacing={2}>
                <FormControlLabel
                  control={<Switch checked={block.enabled !== false} onChange={event => patchBlock(block.id, { enabled: event.target.checked })} />}
                  label='Show this section'
                />
                <TextField fullWidth label='Heading' value={block.title} onChange={event => patchBlock(block.id, { title: event.target.value })} />
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  label='Paragraphs'
                  helperText='Leave a blank line between paragraphs.'
                  value={block.paragraphs}
                  onChange={event => patchBlock(block.id, { paragraphs: event.target.value })}
                />
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label='Bullet list'
                  helperText='One item per line.'
                  value={block.list}
                  onChange={event => patchBlock(block.id, { list: event.target.value })}
                />
              </Stack>
            </SectionCard>
          )
        })}

        <SectionCard
          id='actions'
          icon='tabler-click'
          title='Buttons at bottom'
          hint='Call-to-action buttons under the page content'
          chips={[`${settings.actions.length} button${settings.actions.length === 1 ? '' : 's'}`]}
          active={selectedId === 'actions'}
          onOpen={() => focusPanel('actions')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.actions = node
          }}
        >
          <Stack spacing={2}>
            <Box className='flex justify-end'>
              <Button size='small' startIcon={<i className='tabler-plus' />} onClick={onAddAction}>
                Add button
              </Button>
            </Box>
            {settings.actions.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                No buttons yet. Add one for Shop / Contact links.
              </Typography>
            ) : null}
            {settings.actions.map((action, index) => (
              <Box key={action.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, bgcolor: 'background.paper' }}>
                <Box className='mb-2 flex items-center justify-between'>
                  <Typography variant='caption'>Button {index + 1}</Typography>
                  <IconButton size='small' color='error' onClick={() => onRemoveAction(action.id)} aria-label='Remove button'>
                    <i className='tabler-trash' />
                  </IconButton>
                </Box>
                <Stack spacing={2}>
                  <FormControlLabel
                    control={<Switch checked={action.enabled !== false} onChange={event => patchAction(action.id, { enabled: event.target.checked })} />}
                    label='Show button'
                  />
                  <TextField fullWidth label='Button name' value={action.label} onChange={event => patchAction(action.id, { label: event.target.value })} />
                  <TextField fullWidth label='Link' value={action.href} onChange={event => patchAction(action.id, { href: event.target.value })} />
                  <TextField
                    select
                    fullWidth
                    label='Style'
                    value={action.style}
                    onChange={event => patchAction(action.id, { style: event.target.value === 'outline' ? 'outline' : 'solid' })}
                  >
                    <MenuItem value='solid'>Filled</MenuItem>
                    <MenuItem value='outline'>Outline</MenuItem>
                  </TextField>
                </Stack>
              </Box>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          id='footer'
          icon='tabler-notes'
          title='Footer note'
          hint='Short line under the buttons'
          chips={['Footer']}
          active={selectedId === 'footer'}
          onOpen={() => focusPanel('footer')}
          onClose={() => setSelectedId(null)}
          cardRef={node => {
            panelRefs.current.footer = node
          }}
        >
          <TextField fullWidth multiline minRows={3} label='Footer note' value={settings.footerNote} onChange={event => patch({ footerNote: event.target.value })} />
        </SectionCard>
      </Stack>
    </Box>
  )
}

export default ContentPageEditor
