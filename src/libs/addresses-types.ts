export const MAX_SAVED_ADDRESSES = 8

export type SavedAddress = {
  id: string
  label: string
  name: string
  phone: string
  address: string
  locality: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}
