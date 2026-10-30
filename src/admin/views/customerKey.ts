export const customerKey = (phone: string, name = '') => {
  const digits = (phone || '').replace(/\D/g, '')
  const key = digits.length >= 10 ? digits.slice(-10) : digits

  return key || name.trim().toLowerCase()
}
