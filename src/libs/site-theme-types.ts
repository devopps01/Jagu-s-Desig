export type ThemeFontOption = {
  id: string
  label: string
  family: string
  google: string
}

export type SiteThemeSettings = {
  logoUrl: string
  logoAlt: string
  logoHeight: number
  bg: string
  paper: string
  ink: string
  muted: string
  accent: string
  purple: string
  gold: string
  headingFont: string
  bodyFont: string
  buttonRadius: number
  cardRadius: number
}

export const THEME_SERIF_FONTS: ThemeFontOption[] = [
  { id: 'cormorant', label: 'Cormorant Garamond', family: '"Cormorant Garamond", Georgia, serif', google: 'Cormorant+Garamond:wght@500;600' },
  { id: 'playfair', label: 'Playfair Display', family: '"Playfair Display", Georgia, serif', google: 'Playfair+Display:wght@500;600;700' },
  { id: 'libre', label: 'Libre Baskerville', family: '"Libre Baskerville", Georgia, serif', google: 'Libre+Baskerville:wght@400;700' },
  { id: 'lora', label: 'Lora', family: 'Lora, Georgia, serif', google: 'Lora:wght@500;600;700' },
  { id: 'eb-garamond', label: 'EB Garamond', family: '"EB Garamond", Georgia, serif', google: 'EB+Garamond:wght@500;600;700' }
]

export const THEME_SANS_FONTS: ThemeFontOption[] = [
  { id: 'dm-sans', label: 'DM Sans', family: '"DM Sans", "Segoe UI", sans-serif', google: 'DM+Sans:wght@400;500;600' },
  { id: 'manrope', label: 'Manrope', family: 'Manrope, "Segoe UI", sans-serif', google: 'Manrope:wght@400;500;600' },
  { id: 'outfit', label: 'Outfit', family: 'Outfit, "Segoe UI", sans-serif', google: 'Outfit:wght@400;500;600' },
  { id: 'source-sans', label: 'Source Sans 3', family: '"Source Sans 3", "Segoe UI", sans-serif', google: 'Source+Sans+3:wght@400;500;600' },
  { id: 'nunito', label: 'Nunito Sans', family: '"Nunito Sans", "Segoe UI", sans-serif', google: 'Nunito+Sans:wght@400;500;600' }
]

export const defaultSiteThemeSettings = (): SiteThemeSettings => ({
  logoUrl: '/images/brand/jagu-logo.png',
  logoAlt: "Jagu's Designing — Chaniya Choli",
  logoHeight: 108,
  bg: '#fff4f8',
  paper: '#fffafc',
  ink: '#2a1220',
  muted: '#8a4d66',
  accent: '#d82460',
  purple: '#7a1458',
  gold: '#c9a24a',
  headingFont: 'cormorant',
  bodyFont: 'dm-sans',
  buttonRadius: 12,
  cardRadius: 16
})

export const themeFontById = (id: string, list: ThemeFontOption[]) =>
  list.find(item => item.id === id) || list[0]

export const themeGoogleFontsHref = (theme: SiteThemeSettings) => {
  const heading = themeFontById(theme.headingFont, THEME_SERIF_FONTS)
  const body = themeFontById(theme.bodyFont, THEME_SANS_FONTS)
  const families = [heading.google, body.google].map(item => `family=${item}`).join('&')

  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

export const themeCssVars = (theme: SiteThemeSettings): Record<string, string> => {
  const heading = themeFontById(theme.headingFont, THEME_SERIF_FONTS)
  const body = themeFontById(theme.bodyFont, THEME_SANS_FONTS)

  return {
    '--vn-bg': theme.bg,
    '--vn-paper': theme.paper,
    '--vn-ink': theme.ink,
    '--vn-muted': theme.muted,
    '--vn-accent': theme.accent,
    '--vn-purple': theme.purple,
    '--vn-gold': theme.gold,
    '--vn-line': `${theme.accent}29`,
    '--vn-control-radius': `${theme.buttonRadius}px`,
    '--vn-card-radius': `${theme.cardRadius}px`,
    '--font-vn-serif': heading.family,
    '--font-vn-sans': body.family
  }
}
