import data from '@web/data/india-places.json'

export const INDIA_STATES = data.states as string[]

const citiesByState = data.cities as Record<string, string[]>

const STATE_ALIASES: Record<string, string> = {
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  uttaranchal: 'Uttarakhand',
  'nct of delhi': 'Delhi',
  'nct delhi': 'Delhi',
  'new delhi': 'Delhi',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'jammu & kashmir': 'Jammu and Kashmir',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'andaman & nicobar': 'Andaman and Nicobar Islands',
  'andaman and nicobar island': 'Andaman and Nicobar Islands'
}

const CITY_ALIASES: Record<string, string> = {
  bangalore: 'Bengaluru',
  bengaluru: 'Bengaluru',
  bombay: 'Mumbai',
  calcutta: 'Kolkata',
  madras: 'Chennai',
  gurgaon: 'Gurugram',
  gurugram: 'Gurugram',
  baroda: 'Vadodara',
  trivandrum: 'Thiruvananthapuram',
  pondicherry: 'Puducherry',
  allahabad: 'Prayagraj',
  belgaum: 'Belagavi',
  mysore: 'Mysuru',
  mangalore: 'Mangaluru',
  trichy: 'Tiruchirappalli',
  tuticorin: 'Thoothukudi',
  cochin: 'Kochi',
  vizag: 'Visakhapatnam',
  waltair: 'Visakhapatnam'
}

const norm = (value: string) => String(value || '').replace(/\s+/g, ' ').trim()
const key = (value: string) => norm(value).toLowerCase()

const uniqueSorted = (list: string[]) => [...new Set(list.map(norm).filter(Boolean))].sort((a, b) => a.localeCompare(b))

export const matchState = (value: string) => {
  const k = key(value)

  if (!k) return ''
  if (STATE_ALIASES[k]) return STATE_ALIASES[k]

  return INDIA_STATES.find(item => key(item) === k) || INDIA_STATES.find(item => key(item).includes(k) || k.includes(key(item))) || ''
}

export const citiesForState = (state: string, extra: string[] = []) => {
  const matched = matchState(state)
  const list = matched ? citiesByState[matched] || [] : Object.values(citiesByState).flat()

  return uniqueSorted([...list, ...extra])
}

export const stateForCity = (city: string) => {
  const k = key(CITY_ALIASES[key(city)] || city)

  if (!k) return ''

  const hit = Object.entries(citiesByState).find(([, cities]) => cities.some(item => key(item) === k))

  return hit?.[0] || ''
}

export const matchCity = (value: string, state = '', extra: string[] = []) => {
  const k = key(value)

  if (!k) return ''

  const aliased = CITY_ALIASES[k]
  const pool = citiesForState(state, extra)
  const wanted = key(aliased || value)
  const exact = pool.find(item => key(item) === wanted || key(item) === k)

  if (exact) return exact

  return pool.find(item => key(item).startsWith(k) || k.startsWith(key(item))) || ''
}

export const filterOptions = (options: string[], query: string) => {
  const q = key(query)

  if (!q) return options

  const starts = options.filter(item => key(item).startsWith(q))
  const contains = options.filter(item => !key(item).startsWith(q) && key(item).includes(q))

  return [...starts, ...contains]
}

export const resolveIndiaPlace = (input: { city?: string; state?: string }, extra: string[] = []) => {
  let state = matchState(input.state || '')
  let city = matchCity(input.city || '', state, extra)

  if (!state && (city || input.city)) state = stateForCity(city || input.city || '')
  if (state && input.city && !city) city = matchCity(input.city, '', extra) || norm(input.city)

  return { state, city }
}
