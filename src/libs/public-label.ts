export const withoutSareeWord = (value: string) => {
  const raw = String(value || '')
  const next = raw
    .replace(/\bsarees\b/gi, '')
    .replace(/\bsaree\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.:;-])/g, '$1')
    .trim()

  if (!raw.trim()) return ''

  return next || 'Look'
}
