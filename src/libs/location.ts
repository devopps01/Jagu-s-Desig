import { matchCity, matchState } from '@/libs/india-places'

export type PlaceAddress = {
  address: string
  locality: string
  city: string
  state: string
  pincode: string
}

type NominatimAddress = {
  house_number?: string
  road?: string
  neighbourhood?: string
  suburb?: string
  village?: string
  town?: string
  city?: string
  county?: string
  state_district?: string
  state?: string
  postcode?: string
}

type NominatimResult = {
  display_name?: string
  address?: NominatimAddress
}

const joinParts = (parts: (string | undefined)[]) =>
  parts
    .map(part => part?.trim())
    .filter(Boolean)
    .join(', ')

export const reverseGeocode = async (lat: number, lng: number): Promise<PlaceAddress> => {
  const url = new URL('https://nominatim.openstreetmap.org/reverse')

  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('lat', String(lat))
  url.searchParams.set('lon', String(lng))
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('zoom', '18')

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'JagusDesigningCheckout/1.0'
    },
    cache: 'no-store'
  })

  if (!res.ok) throw new Error('Could not read this location')

  const json = (await res.json()) as NominatimResult
  const item = json.address || {}
  const rawCity = item.city || item.town || item.village || item.county || ''
  const rawState = item.state || ''
  const state = matchState(rawState) || rawState
  const city = matchCity(rawCity, state) || rawCity
  const locality = item.suburb || item.neighbourhood || item.village || item.state_district || ''
  const address = joinParts([item.house_number, item.road, locality]) || json.display_name || ''

  return {
    address,
    locality,
    city,
    state,
    pincode: (item.postcode || '').replace(/\s+/g, '')
  }
}

type PostalOffice = {
  Name?: string
  District?: string
  Block?: string
  State?: string
  Pincode?: string
  DeliveryStatus?: string
}

type PostalLookup = {
  Status?: string
  PostOffice?: PostalOffice[] | null
}

export const lookupPincode = async (pin: string): Promise<PlaceAddress> => {
  const pincode = String(pin || '').replace(/\D/g, '').slice(0, 6)

  if (pincode.length !== 6) throw new Error('Enter a 6-digit pincode')

  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store'
  })

  if (!res.ok) throw new Error('Could not look up this pincode')

  const json = (await res.json()) as PostalLookup[]
  const row = Array.isArray(json) ? json[0] : null
  const offices = row?.PostOffice || []

  if (row?.Status !== 'Success' || !offices.length) throw new Error('No post office found for this pincode')

  const office = offices.find(item => item.DeliveryStatus === 'Delivery') || offices[0]
  const state = matchState(office.State || '') || office.State || ''
  const district = office.District || office.Block || ''
  const city = matchCity(district, state) || district
  const locality = office.Name && office.Name !== city ? office.Name : ''

  return {
    address: '',
    locality,
    city,
    state,
    pincode: office.Pincode || pincode
  }
}
