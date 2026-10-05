'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  THEME_SANS_FONTS,
  THEME_SERIF_FONTS,
  defaultSiteThemeSettings,
  type SiteThemeSettings
} from '@/libs/site-theme-types'

type Props = {
  settings: SiteThemeSettings
  onChange: (next: SiteThemeSettings) => void
  onPickLogo: () => void
}

const ColorField = ({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) => (
  <Stack direction='row' spacing={1.25} alignItems='center'>
    <Box
      component='input'
      type='color'
      value={/^#([0-9a-f]{6})$/i.test(value) ? value : '#ffffff'}
      onChange={event => onChange((event.target as HTMLInputElement).value)}
      sx={{
        width: 44,
        height: 40,
        p: 0.25,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        flexShrink: 0
      }}
    />
    <TextField
      fullWidth
      size='small'
      label={label}
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  </Stack>
)

const ThemeEditor = ({ settings, onChange, onPickLogo }: Props) => {
  const patch = (partial: Partial<SiteThemeSettings>) => onChange({ ...settings, ...partial })

  return (
    <Stack spacing={2.5}>
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
        <i className='tabler-palette text-xl' />
        <Box>
          <Typography className='font-medium leading-tight'>Theme settings</Typography>
          <Typography variant='caption' sx={{ opacity: 0.85 }}>
            Logo, colours, fonts — live on the right
          </Typography>
        </Box>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Typography className='font-medium mbe-1'>Logo</Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
          Used in header and footer.
        </Typography>
        {settings.logoUrl ? (
          <Box
            component='img'
            src={settings.logoUrl}
            alt={settings.logoAlt}
            sx={{
              width: '100%',
              maxHeight: 96,
              objectFit: 'contain',
              objectPosition: 'left center',
              mb: 1.5,
              p: 1,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: settings.bg
            }}
          />
        ) : null}
        <TextField
          fullWidth
          size='small'
          label='Logo URL'
          value={settings.logoUrl}
          onChange={event => patch({ logoUrl: event.target.value })}
          sx={{ mb: 1.25 }}
        />
        <TextField
          fullWidth
          size='small'
          label='Logo alt text'
          value={settings.logoAlt}
          onChange={event => patch({ logoAlt: event.target.value })}
          sx={{ mb: 1.25 }}
        />
        <TextField
          fullWidth
          size='small'
          type='number'
          label='Logo height (px)'
          value={settings.logoHeight}
          onChange={event => patch({ logoHeight: Number(event.target.value) || 108 })}
          sx={{ mb: 1.25 }}
        />
        <Stack spacing={1}>
          <Button fullWidth size='small' variant='contained' startIcon={<i className='tabler-photo-up' />} onClick={onPickLogo}>
            Choose logo
          </Button>
          {settings.logoUrl && settings.logoUrl !== defaultSiteThemeSettings().logoUrl ? (
            <Button
              fullWidth
              size='small'
              variant='outlined'
              color='secondary'
              onClick={() => patch({ logoUrl: defaultSiteThemeSettings().logoUrl })}
            >
              Reset default logo
            </Button>
          ) : null}
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Typography className='font-medium mbe-1'>Colours</Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
          Background, text and accent across the website.
        </Typography>
        <Stack spacing={1.25}>
          <ColorField label='Page background' value={settings.bg} onChange={value => patch({ bg: value })} />
          <ColorField label='Card / paper' value={settings.paper} onChange={value => patch({ paper: value })} />
          <ColorField label='Main text' value={settings.ink} onChange={value => patch({ ink: value })} />
          <ColorField label='Muted text' value={settings.muted} onChange={value => patch({ muted: value })} />
          <ColorField label='Accent / pink' value={settings.accent} onChange={value => patch({ accent: value })} />
          <ColorField label='Deep purple' value={settings.purple} onChange={value => patch({ purple: value })} />
          <ColorField label='Gold' value={settings.gold} onChange={value => patch({ gold: value })} />
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Typography className='font-medium mbe-1'>Fonts</Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
          Headings and body text.
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            select
            fullWidth
            size='small'
            label='Heading font'
            value={settings.headingFont}
            onChange={event => patch({ headingFont: event.target.value })}
          >
            {THEME_SERIF_FONTS.map(font => (
              <MenuItem key={font.id} value={font.id}>
                {font.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            size='small'
            label='Body font'
            value={settings.bodyFont}
            onChange={event => patch({ bodyFont: event.target.value })}
          >
            {THEME_SANS_FONTS.map(font => (
              <MenuItem key={font.id} value={font.id}>
                {font.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
        <Typography className='font-medium mbe-1'>Shape</Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
          Corner roundness for buttons and cards.
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            fullWidth
            size='small'
            type='number'
            label='Button radius (px)'
            value={settings.buttonRadius}
            onChange={event => patch({ buttonRadius: Number(event.target.value) || 0 })}
          />
          <TextField
            fullWidth
            size='small'
            type='number'
            label='Card radius (px)'
            value={settings.cardRadius}
            onChange={event => patch({ cardRadius: Number(event.target.value) || 0 })}
          />
        </Stack>
      </Box>

      <Button
        fullWidth
        variant='outlined'
        color='secondary'
        startIcon={<i className='tabler-refresh' />}
        onClick={() => onChange(defaultSiteThemeSettings())}
      >
        Reset theme defaults
      </Button>
    </Stack>
  )
}

export default ThemeEditor
