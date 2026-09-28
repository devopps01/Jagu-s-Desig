export type GstSettings = {
  enabled: boolean
  rate: number
  label: string
}

export const defaultGstSettings: GstSettings = {
  enabled: false,
  rate: 5,
  label: 'GST'
}

export const money2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100

export const calcGstAmount = (taxable: number, settings: Pick<GstSettings, 'enabled' | 'rate'>) => {
  if (!settings.enabled) return 0

  const rate = Number(settings.rate) || 0

  if (rate <= 0 || taxable <= 0) return 0

  return money2((taxable * rate) / 100)
}
