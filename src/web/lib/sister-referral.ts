const KEY = 'jd-sister-code'

export const rememberSisterCode = (code: string) => {
  if (typeof window === 'undefined') return

  const value = code.trim()

  if (value) sessionStorage.setItem(KEY, value)
  else sessionStorage.removeItem(KEY)
}

export const forgetSisterCode = () => {
  if (typeof window === 'undefined') return

  sessionStorage.removeItem(KEY)
}

export const captureSisterCodeFromUrl = () => {
  if (typeof window === 'undefined') return ''

  const fromUrl = (new URLSearchParams(window.location.search).get('sister') || '').trim()

  if (fromUrl) sessionStorage.setItem(KEY, fromUrl)

  return fromUrl || sessionStorage.getItem(KEY) || ''
}
