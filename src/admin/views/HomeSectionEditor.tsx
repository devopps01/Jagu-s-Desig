'use client'

import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { HOME_FILTERS, homeSectionMeta, sectionAllowsItems, type HomeItem, type HomeSection } from '@/libs/home-types'

export type HomeProductOption = { slug: string; title: string; image?: string; collections?: string[] }

const labelFromSlug = (slug: string) =>
  slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

type Props = {
  section: HomeSection
  products: HomeProductOption[]
  productSearch: string
  pickerCollection: string
  onProductSearch: (value: string) => void
  onPickerCollection: (value: string) => void
  onUpdateSection: (id: string, patch: Partial<HomeSection>) => void
  onUpdateItem: (sectionId: string, itemId: string, patch: Partial<HomeItem>) => void
  onAddItem: (sectionId: string) => void
  onRequestRemoveItem: (sectionId: string, itemId: string, title: string) => void
  onMoveItem: (sectionId: string, itemId: string, direction: -1 | 1) => void
  onToggleProduct: (sectionId: string, slug: string) => void
  onMoveSelectedProduct: (sectionId: string, slug: string, direction: -1 | 1) => void
  onPickMedia: (sectionId: string, itemId?: string, field?: 'image' | 'imageMobile') => void
}

const ImagePickField = ({
  label,
  hint,
  value,
  onChange,
  onChoose
}: {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
  onChoose: () => void
}) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      p: 2,
      bgcolor: 'background.paper'
    }}
  >
    <Typography className='font-medium mbe-1'>{label}</Typography>
    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
      {hint}
    </Typography>
    {value ? (
      <Box
        component='img'
        src={value}
        alt={label}
        sx={{
          width: '100%',
          height: 140,
          objectFit: 'cover',
          borderRadius: 2,
          mb: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          display: 'block'
        }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height: 140,
          borderRadius: 2,
          mb: 1.5,
          border: '1px dashed',
          borderColor: 'divider',
          display: 'grid',
          placeItems: 'center',
          color: 'text.secondary',
          bgcolor: 'action.hover'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <i className='tabler-photo text-2xl block mbe-1' />
          <Typography variant='caption'>No image yet</Typography>
        </Box>
      </Box>
    )}
    <TextField fullWidth size='small' label='Image URL' value={value} onChange={event => onChange(event.target.value)} sx={{ mb: 1.5 }} />
    <Stack spacing={1} sx={{ width: '100%' }}>
      <Button
        size='small'
        variant='contained'
        fullWidth
        onClick={onChoose}
        startIcon={<i className='tabler-photo-up' />}
        sx={{ justifyContent: 'center', px: 2, whiteSpace: 'normal', lineHeight: 1.3 }}
      >
        Choose image
      </Button>
      {value ? (
        <Button
          size='small'
          color='secondary'
          variant='outlined'
          fullWidth
          onClick={() => onChange('')}
          sx={{ justifyContent: 'center', px: 2 }}
        >
          Clear
        </Button>
      ) : null}
    </Stack>
  </Box>
)

const HomeSectionEditor = ({
  section,
  products,
  productSearch,
  pickerCollection,
  onProductSearch,
  onPickerCollection,
  onUpdateSection,
  onUpdateItem,
  onAddItem,
  onRequestRemoveItem,
  onMoveItem,
  onToggleProduct,
  onMoveSelectedProduct,
  onPickMedia
}: Props) => {
  const meta = homeSectionMeta(section.type)
  const canEditItems = sectionAllowsItems(section.type) || section.items.length > 0

  const collectionOptions = (() => {
    const fromProducts = new Map<string, string>()

    products.forEach(product => {
      ;(product.collections || []).forEach(slug => {
        if (!slug || fromProducts.has(slug)) return
        fromProducts.set(slug, labelFromSlug(slug))
      })
    })

    const base = HOME_FILTERS.map(filter => ({ slug: filter.slug, label: filter.label, hint: filter.hint }))
    const extra = [...fromProducts.entries()]
      .filter(([slug]) => !base.some(item => item.slug === slug))
      .map(([slug, label]) => ({ slug, label, hint: 'From your catalog' }))

    return [...base, ...extra]
  })()

  const selectedRows = section.productSlugs
    .map(slug => products.find(product => product.slug === slug) || { slug, title: slug, image: '', collections: [] as string[] })
    .filter(Boolean)

  const query = productSearch.trim().toLowerCase()
  const pickerRows = products.filter(product => {
    const inCollection =
      pickerCollection === 'all' ||
      pickerCollection === 'latest' ||
      (product.collections || []).includes(pickerCollection)

    if (!inCollection) return false
    if (!query) return true

    return (
      product.title.toLowerCase().includes(query) ||
      product.slug.toLowerCase().includes(query) ||
      (product.collections || []).some(item => item.toLowerCase().includes(query))
    )
  })

  return (
    <Stack spacing={3} onClick={event => event.stopPropagation()}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
      >
        <i className={`${meta.icon} text-xl`} />
        <Box>
          <Typography className='font-medium leading-tight'>Edit settings</Typography>
          <Typography variant='caption' sx={{ opacity: 0.85 }}>{meta.label} · changes show live on the right</Typography>
        </Box>
      </Box>

      <FormControlLabel
        control={<Switch checked={section.enabled} onChange={event => onUpdateSection(section.id, { enabled: event.target.checked })} />}
        label='Show this section'
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label='Width' placeholder='1200' value={section.width} onChange={event => onUpdateSection(section.id, { width: event.target.value })} helperText='Number is px. Or 100%.' />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label='Height' placeholder='320' value={section.height} onChange={event => onUpdateSection(section.id, { height: event.target.value })} helperText='Minimum height.' />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label='Gap' placeholder='16' value={section.gap} onChange={event => onUpdateSection(section.id, { gap: event.target.value })} helperText='Space between items.' />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TextField fullWidth label='Padding' placeholder='24' value={section.padding} onChange={event => onUpdateSection(section.id, { padding: event.target.value })} helperText='Space inside the section.' />
        </Grid>
      </Grid>

      {section.type !== 'hero' && section.type !== 'trust' && section.type !== 'reviews' ? (
        <Stack spacing={3}>
          <Stack spacing={1.5}>
            <FormControlLabel control={<Switch checked={section.showTitle} onChange={event => onUpdateSection(section.id, { showTitle: event.target.checked })} />} label='Show title' />
            <TextField fullWidth label='Title' value={section.title} onChange={event => onUpdateSection(section.id, { title: event.target.value })} />
          </Stack>
          <Stack spacing={1.5}>
            <FormControlLabel control={<Switch checked={section.showNote} onChange={event => onUpdateSection(section.id, { showNote: event.target.checked })} />} label='Show note' />
            <TextField fullWidth label='Note' value={section.note} onChange={event => onUpdateSection(section.id, { note: event.target.value })} />
          </Stack>
          {section.type === 'fan' ? (
            <TextField
              fullWidth
              label='Default link'
              value={section.href}
              onChange={event => onUpdateSection(section.id, { href: event.target.value })}
              helperText='Used when a card has no link of its own. Example: /collections/festive'
            />
          ) : null}
          {section.type === 'navratri' ? (
            <Stack spacing={1.5}>
              <FormControlLabel
                control={<Switch checked={section.showText} onChange={event => onUpdateSection(section.id, { showText: event.target.checked })} />}
                label='Show “more looks” header'
              />
              <TextField
                fullWidth
                label='More looks title'
                value={section.text}
                onChange={event => onUpdateSection(section.id, { text: event.target.value })}
                helperText='Example: Beyond the garba circle'
              />
              <TextField
                fullWidth
                label='More looks note'
                value={section.buttonLabel}
                onChange={event => onUpdateSection(section.id, { buttonLabel: event.target.value })}
                helperText='Example: Wedding, engagement and after-aarti looks'
              />
            </Stack>
          ) : null}
          {section.type !== 'festivities' && section.type !== 'fan' && section.type !== 'navratri' ? (
            <>
              <Stack spacing={1.5}>
                <FormControlLabel control={<Switch checked={section.showText} onChange={event => onUpdateSection(section.id, { showText: event.target.checked })} />} label='Show text' />
                <TextField fullWidth multiline minRows={2} label='Text' value={section.text} onChange={event => onUpdateSection(section.id, { text: event.target.value })} />
              </Stack>
              <Stack spacing={2}>
                <FormControlLabel control={<Switch checked={section.showButton} onChange={event => onUpdateSection(section.id, { showButton: event.target.checked })} />} label='Show button' />
                <TextField fullWidth label='Button name' value={section.buttonLabel} onChange={event => onUpdateSection(section.id, { buttonLabel: event.target.value })} />
                <TextField fullWidth label='Button link' value={section.href} onChange={event => onUpdateSection(section.id, { href: event.target.value })} />
              </Stack>
            </>
          ) : null}
          {section.type === 'video' || section.type === 'story' || section.image || section.imageMobile ? (
            <Stack spacing={2.5}>
              <Typography variant='subtitle2'>Section images</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ImagePickField
                    label='Desktop / Windows image'
                    hint='Shown on computer and large screens.'
                    value={section.image}
                    onChange={value => onUpdateSection(section.id, { image: value })}
                    onChoose={() => onPickMedia(section.id, undefined, 'image')}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <ImagePickField
                    label='Mobile / Android image'
                    hint='Shown on phone. If empty, desktop image is used.'
                    value={section.imageMobile}
                    onChange={value => onUpdateSection(section.id, { imageMobile: value })}
                    onChoose={() => onPickMedia(section.id, undefined, 'imageMobile')}
                  />
                </Grid>
              </Grid>
            </Stack>
          ) : null}
        </Stack>
      ) : null}

      {section.type === 'cards' && section.layout === 'occasions' ? (
        <Stack spacing={2.5}>
          <Alert severity='info'>
            On the website, tapping an occasion shows that collection&apos;s products below, with a <strong>View more</strong> button to the collection page. Set each card&apos;s link like <code>/collections/wedding</code>.
          </Alert>
          <TextField
            fullWidth
            type='number'
            label='Products under selected occasion'
            value={section.limit}
            onChange={event => onUpdateSection(section.id, { limit: Number(event.target.value) })}
            helperText='How many products to show under the selected occasion card.'
          />
          <TextField
            fullWidth
            label='View more button text'
            value={section.buttonLabel || 'View more'}
            onChange={event => onUpdateSection(section.id, { buttonLabel: event.target.value, showButton: true })}
          />
        </Stack>
      ) : null}

      {section.type === 'products' ? (
        <Stack spacing={3}>
          <Box>
            <Typography variant='subtitle2' sx={{ mb: 1.5 }}>Which products to show</Typography>
            <Stack direction='row' spacing={1.5} useFlexGap flexWrap='wrap'>
              <Button
                variant={section.productMode === 'filter' ? 'contained' : 'outlined'}
                startIcon={<i className='tabler-filter' />}
                onClick={() => onUpdateSection(section.id, { productMode: 'filter' })}
              >
                Collection / filter
              </Button>
              <Button
                variant={section.productMode === 'selected' ? 'contained' : 'outlined'}
                startIcon={<i className='tabler-checkbox' />}
                onClick={() => onUpdateSection(section.id, { productMode: 'selected' })}
              >
                Pick products
              </Button>
            </Stack>
          </Box>

          {section.productMode === 'filter' ? (
            <Stack spacing={3}>
              {section.filterSlug === 'best-sellers' ? (
                <Alert severity='info'>
                  Products marked <strong>Most selling</strong> in Admin → Products appear here.
                </Alert>
              ) : null}
              {section.filterSlug === 'trending' ? (
                <Alert severity='info'>
                  Products marked <strong>Trending</strong> in Admin → Products appear here.
                </Alert>
              ) : null}
              <Typography variant='body2' color='text.secondary'>
                Choose one collection. Website will show products from that collection.
              </Typography>
              <Grid container spacing={2.5}>
                {collectionOptions.map(option => {
                  const active = section.filterSlug === option.slug

                  return (
                    <Grid key={option.slug} size={{ xs: 12, sm: 6 }}>
                      <Box
                        onClick={() => onUpdateSection(section.id, { productMode: 'filter', filterSlug: option.slug, href: `/collections/${option.slug === 'latest' ? 'all' : option.slug}` })}
                        sx={{
                          cursor: 'pointer',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: active ? 'primary.main' : 'divider',
                          bgcolor: active ? 'action.selected' : 'background.paper',
                          p: 2,
                          height: '100%'
                        }}
                      >
                        <Box className='flex items-center gap-3'>
                          <Box sx={{ width: 34, height: 34, borderRadius: 1.25, display: 'grid', placeItems: 'center', bgcolor: active ? 'primary.main' : 'action.hover', color: active ? 'primary.contrastText' : 'text.secondary', flexShrink: 0 }}>
                            <i
                              className={
                                option.slug === 'latest'
                                  ? 'tabler-clock'
                                  : option.slug === 'all'
                                    ? 'tabler-layout-grid'
                                    : option.slug === 'best-sellers'
                                      ? 'tabler-trophy'
                                      : option.slug === 'trending'
                                        ? 'tabler-trending-up'
                                        : 'tabler-tag'
                              }
                            />
                          </Box>
                          <Box>
                            <Typography className='font-medium leading-tight'>{option.label}</Typography>
                            <Typography variant='caption' color='text.secondary'>{option.hint || option.slug}</Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
              <TextField
                fullWidth
                type='number'
                label='How many products'
                value={section.limit}
                onChange={event => onUpdateSection(section.id, { limit: Number(event.target.value) })}
                helperText='Only for collection / filter mode.'
              />
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Alert severity='info'>
                Tick products one by one. Only the ticked products will show on the home page, in this order.
              </Alert>
              {selectedRows.length ? (
                <Box className='rounded border p-3'>
                  <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
                    Showing {selectedRows.length} selected product{selectedRows.length === 1 ? '' : 's'}
                  </Typography>
                  <Stack spacing={1.5}>
                    {selectedRows.map((product, index) => (
                      <Box key={product.slug} className='flex items-center gap-2 rounded border px-2 py-1.5'>
                        <Avatar src={product.image || undefined} variant='rounded' sx={{ width: 40, height: 40 }}>
                          <i className='tabler-photo' />
                        </Avatar>
                        <Box className='min-w-0 flex-1'>
                          <Typography className='truncate text-sm font-medium'>{product.title}</Typography>
                          <Typography variant='caption' color='text.secondary'>#{index + 1}</Typography>
                        </Box>
                        <IconButton size='small' onClick={() => onMoveSelectedProduct(section.id, product.slug, -1)} aria-label='Move up'>
                          <i className='tabler-arrow-up' />
                        </IconButton>
                        <IconButton size='small' onClick={() => onMoveSelectedProduct(section.id, product.slug, 1)} aria-label='Move down'>
                          <i className='tabler-arrow-down' />
                        </IconButton>
                        <IconButton size='small' color='error' onClick={() => onToggleProduct(section.id, product.slug)} aria-label='Remove product'>
                          <i className='tabler-x' />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              ) : (
                <Alert severity='warning'>No product selected yet. Tick products below.</Alert>
              )}

              <TextField
                fullWidth
                label='Search products'
                placeholder='Name or collection'
                value={productSearch}
                onChange={event => onProductSearch(event.target.value)}
                InputProps={{ startAdornment: <i className='tabler-search mie-2 text-textSecondary' /> }}
              />
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>Filter list by collection</Typography>
                <Stack direction='row' spacing={1} useFlexGap flexWrap='wrap'>
                  <Chip
                    size='small'
                    label='All'
                    color={pickerCollection === 'all' ? 'primary' : 'default'}
                    variant={pickerCollection === 'all' ? 'filled' : 'outlined'}
                    onClick={() => onPickerCollection('all')}
                  />
                  {collectionOptions
                    .filter(option => option.slug !== 'latest' && option.slug !== 'all')
                    .map(option => (
                      <Chip
                        key={option.slug}
                        size='small'
                        label={option.label}
                        color={pickerCollection === option.slug ? 'primary' : 'default'}
                        variant={pickerCollection === option.slug ? 'filled' : 'outlined'}
                        onClick={() => onPickerCollection(option.slug)}
                      />
                    ))}
                </Stack>
              </Box>
              <Box className='max-h-[360px] overflow-auto rounded border'>
                {pickerRows.length ? pickerRows.map(product => {
                  const checked = section.productSlugs.includes(product.slug)

                  return (
                    <Box
                      key={product.slug}
                      onClick={() => onToggleProduct(section.id, product.slug)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        px: 1.5,
                        py: 1.25,
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        bgcolor: checked ? 'action.selected' : 'transparent',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <Checkbox checked={checked} tabIndex={-1} disableRipple />
                      <Avatar src={product.image || undefined} variant='rounded' sx={{ width: 44, height: 44 }}>
                        <i className='tabler-photo' />
                      </Avatar>
                      <Box className='min-w-0 flex-1'>
                        <Typography className='truncate font-medium'>{product.title}</Typography>
                        <Typography variant='caption' color='text.secondary' className='truncate block'>
                          {(product.collections || []).map(labelFromSlug).join(' · ') || 'No collection'}
                        </Typography>
                      </Box>
                      {checked ? <Chip size='small' color='primary' label='Selected' /> : null}
                    </Box>
                  )
                }) : (
                  <Box className='p-4'>
                    <Typography color='text.secondary'>No products match this search / collection.</Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          )}

          <TextField
            select
            fullWidth
            label='Layout'
            value={section.layout === 'grid' ? 'grid' : 'slider'}
            onChange={event => onUpdateSection(section.id, { layout: event.target.value === 'grid' ? 'grid' : 'slider' })}
          >
            <MenuItem value='slider'>Slider</MenuItem>
            <MenuItem value='grid'>Grid</MenuItem>
          </TextField>
        </Stack>
      ) : null}

      {canEditItems ? (
        <Stack spacing={3}>
          <Box className='flex flex-wrap items-center justify-between gap-2'>
            <Box>
              <Typography variant='subtitle2'>
                {section.type === 'festivities'
                  ? 'Festivity cards'
                  : section.type === 'fan'
                    ? 'Fan photos'
                    : section.type === 'navratri'
                      ? 'Stories & look cards'
                      : 'Items in this section'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {section.type === 'navratri'
                  ? 'Full story = image + copy + button. Small look card = image + short text. Add, remove or reorder.'
                  : section.type === 'festivities' || section.type === 'fan'
                    ? section.type === 'fan'
                      ? 'Up to 5 photos in the fan. Each: name, link, and image. Add, remove or reorder.'
                      : 'Each card: name, link, and image. Add, remove or reorder.'
                    : 'Add, remove or reorder. Only your items show on the website.'}
              </Typography>
            </Box>
            <Button variant='contained' startIcon={<i className='tabler-plus' />} onClick={() => onAddItem(section.id)}>
              Add item
            </Button>
          </Box>

          {section.items.length ? section.items.map((row, index) => (
            <Box key={row.id} className='rounded border p-4'>
              <Box className='mb-3 flex flex-wrap items-center justify-between gap-2'>
                <Typography variant='caption' color='text.secondary'>
                  Item {index + 1} of {section.items.length}
                </Typography>
                <Stack direction='row' spacing={0.5}>
                  <IconButton size='small' disabled={index === 0} onClick={() => onMoveItem(section.id, row.id, -1)} aria-label='Move item up'>
                    <i className='tabler-arrow-up' />
                  </IconButton>
                  <IconButton size='small' disabled={index === section.items.length - 1} onClick={() => onMoveItem(section.id, row.id, 1)} aria-label='Move item down'>
                    <i className='tabler-arrow-down' />
                  </IconButton>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => onRequestRemoveItem(section.id, row.id, row.title || `Item ${index + 1}`)}
                    aria-label='Remove item'
                  >
                    <i className='tabler-trash' />
                  </IconButton>
                </Stack>
              </Box>
              <Stack spacing={2.5}>
                <FormControlLabel control={<Switch checked={row.enabled} onChange={event => onUpdateItem(section.id, row.id, { enabled: event.target.checked })} />} label='Show this item' />
                {section.type === 'trust' || section.type === 'features' ? (
                  <TextField
                    fullWidth
                    label='Icon class'
                    value={row.icon}
                    onChange={event => onUpdateItem(section.id, row.id, { icon: event.target.value })}
                    helperText='Example: tabler-truck, tabler-sparkles'
                  />
                ) : null}
                <Stack spacing={1.5}>
                  <FormControlLabel control={<Switch checked={row.showTitle} onChange={event => onUpdateItem(section.id, row.id, { showTitle: event.target.checked })} />} label='Show name' />
                  <TextField fullWidth label='Name' value={row.title} onChange={event => onUpdateItem(section.id, row.id, { title: event.target.value })} />
                </Stack>
                {section.type === 'navratri' ? (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={row.showButton}
                          onChange={event =>
                            onUpdateItem(section.id, row.id, {
                              showButton: event.target.checked,
                              showKicker: event.target.checked ? row.showKicker || true : false,
                              buttonLabel: event.target.checked ? row.buttonLabel || 'Shop' : ''
                            })
                          }
                        />
                      }
                      label='Full story row (image + copy + button)'
                    />
                    {row.showButton ? (
                      <>
                        <Stack spacing={1.5}>
                          <FormControlLabel
                            control={<Switch checked={row.showKicker} onChange={event => onUpdateItem(section.id, row.id, { showKicker: event.target.checked })} />}
                            label='Show small heading'
                          />
                          <TextField fullWidth label='Small heading' value={row.kicker} onChange={event => onUpdateItem(section.id, row.id, { kicker: event.target.value })} />
                        </Stack>
                        <TextField
                          fullWidth
                          multiline
                          minRows={3}
                          label='Story text'
                          value={row.text}
                          onChange={event => onUpdateItem(section.id, row.id, { text: event.target.value })}
                          helperText='Use a blank line between paragraphs.'
                        />
                        <TextField fullWidth label='Button name' value={row.buttonLabel} onChange={event => onUpdateItem(section.id, row.id, { buttonLabel: event.target.value })} />
                        <TextField fullWidth label='Button link' value={row.href} onChange={event => onUpdateItem(section.id, row.id, { href: event.target.value })} />
                        <FormControlLabel
                          control={<Switch checked={row.showSecondButton} onChange={event => onUpdateItem(section.id, row.id, { showSecondButton: event.target.checked })} />}
                          label='Reverse layout (image on the right)'
                        />
                      </>
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          multiline
                          minRows={2}
                          label='Short text'
                          value={row.text}
                          onChange={event => onUpdateItem(section.id, row.id, { text: event.target.value })}
                        />
                        <TextField
                          fullWidth
                          label='Image link'
                          value={row.href}
                          onChange={event => onUpdateItem(section.id, row.id, { href: event.target.value })}
                          helperText='Optional. Opens when the look image is clicked.'
                        />
                      </>
                    )}
                  </>
                ) : section.type === 'festivities' || section.type === 'fan' ? (
                  <>
                    {section.type === 'fan' ? (
                      <TextField
                        fullWidth
                        label='Short description'
                        value={row.text}
                        onChange={event => onUpdateItem(section.id, row.id, { text: event.target.value })}
                        helperText='Used for image alt text / accessibility.'
                      />
                    ) : null}
                    <TextField
                      fullWidth
                      label='Link'
                      value={row.href}
                      onChange={event => onUpdateItem(section.id, row.id, { href: event.target.value })}
                      helperText={
                        section.type === 'fan'
                          ? 'Opens when this photo is clicked. Leave empty to use the section default link.'
                          : 'Opens when the card is clicked. Example: /collections/wedding'
                      }
                    />
                  </>
                ) : (
                  <>
                    <Stack spacing={1.5}>
                      <FormControlLabel control={<Switch checked={row.showKicker} onChange={event => onUpdateItem(section.id, row.id, { showKicker: event.target.checked })} />} label='Show small heading' />
                      <TextField fullWidth label='Small heading' value={row.kicker} onChange={event => onUpdateItem(section.id, row.id, { kicker: event.target.value })} />
                    </Stack>
                    <Stack spacing={1.5}>
                      <FormControlLabel control={<Switch checked={row.showText} onChange={event => onUpdateItem(section.id, row.id, { showText: event.target.checked })} />} label='Show text' />
                      <TextField fullWidth multiline minRows={2} label='Text' value={row.text} onChange={event => onUpdateItem(section.id, row.id, { text: event.target.value })} />
                    </Stack>
                    <Stack spacing={2}>
                      <FormControlLabel control={<Switch checked={row.showButton} onChange={event => onUpdateItem(section.id, row.id, { showButton: event.target.checked })} />} label='Show button' />
                      <TextField fullWidth label='Button name' value={row.buttonLabel} onChange={event => onUpdateItem(section.id, row.id, { buttonLabel: event.target.value })} />
                      <TextField fullWidth label='Link' value={row.href} onChange={event => onUpdateItem(section.id, row.id, { href: event.target.value })} />
                    </Stack>
                    <Stack spacing={2}>
                      <FormControlLabel control={<Switch checked={row.showSecondButton} onChange={event => onUpdateItem(section.id, row.id, { showSecondButton: event.target.checked })} />} label='Show second button' />
                      <TextField fullWidth label='Second button name' value={row.secondLabel} onChange={event => onUpdateItem(section.id, row.id, { secondLabel: event.target.value })} />
                      <TextField fullWidth label='Second button link' value={row.secondHref} onChange={event => onUpdateItem(section.id, row.id, { secondHref: event.target.value })} />
                    </Stack>
                  </>
                )}
                {section.type !== 'trust' ? (
                  <Stack spacing={2.5}>
                    <Typography variant='subtitle2'>Images</Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ImagePickField
                          label='Desktop / Windows image'
                          hint='Shown on computer and large screens.'
                          value={row.image}
                          onChange={value => onUpdateItem(section.id, row.id, { image: value })}
                          onChoose={() => onPickMedia(section.id, row.id, 'image')}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <ImagePickField
                          label='Mobile / Android image'
                          hint='Shown on phone. If empty, desktop image is used.'
                          value={row.imageMobile}
                          onChange={value => onUpdateItem(section.id, row.id, { imageMobile: value })}
                          onChoose={() => onPickMedia(section.id, row.id, 'imageMobile')}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          )) : (
            <Alert severity='info'>No items yet. Click Add item to create the first one.</Alert>
          )}

          <Button variant='outlined' startIcon={<i className='tabler-plus' />} onClick={() => onAddItem(section.id)}>
            Add another item
          </Button>
        </Stack>
      ) : null}
    </Stack>
  )
}

export default HomeSectionEditor
