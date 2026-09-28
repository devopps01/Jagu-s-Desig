'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import FilterSelect from '@web/components/FilterSelect'
import { INDIA_STATES, citiesForState, matchCity, matchState, stateForCity } from '@/libs/india-places'

type PlacePatch = {
  city?: string
  state?: string
  pincode?: string
  locality?: string
}

type IndiaPlaceFieldsProps = {
  city: string
  state: string
  pincode: string
  onChange: (patch: PlacePatch) => void
  required?: boolean
}

const IndiaPlaceFields = ({ city, state, pincode, onChange, required = true }: IndiaPlaceFieldsProps) => {
  const onChangeRef = useRef(onChange)
  const extraRef = useRef<string[]>([])
  const lastPin = useRef('')
  const [extraCities, setExtraCities] = useState<string[]>([])
  const [pinNote, setPinNote] = useState('')
  const [pinBusy, setPinBusy] = useState(false)

  onChangeRef.current = onChange
  extraRef.current = extraCities

  const resolvedState = matchState(state) || state
  const cityOptions = useMemo(() => citiesForState(resolvedState, extraCities), [extraCities, resolvedState])

  useEffect(() => {
    const pin = pincode.replace(/\D/g, '').slice(0, 6)

    if (pin.length !== 6) {
      lastPin.current = ''

      return
    }

    if (pin === lastPin.current) return

    const timer = window.setTimeout(() => {
      lastPin.current = pin
      setPinBusy(true)
      setPinNote('Finding city and state…')

      fetch(`/api/web/location?pincode=${pin}`)
        .then(async res => {
          const json = await res.json()

          if (!res.ok) throw new Error(json.message || 'Could not look up this pincode')

          const nextState = matchState(json.state || '') || json.state || ''
          const extra = extraRef.current
          const nextCity = matchCity(json.city || '', nextState, extra) || json.city || ''

          if (nextCity && !citiesForState(nextState, extra).includes(nextCity)) {
            setExtraCities(current => (current.includes(nextCity) ? current : [...current, nextCity]))
          }

          onChangeRef.current({
            pincode: json.pincode || pin,
            state: nextState,
            city: nextCity,
            locality: json.locality || undefined
          })
          setPinNote(`Selected ${[nextCity, nextState].filter(Boolean).join(', ')}`)
        })
        .catch(error => {
          lastPin.current = ''
          setPinNote(error instanceof Error ? error.message : 'Could not look up this pincode')
        })
        .finally(() => setPinBusy(false))
    }, 280)

    return () => window.clearTimeout(timer)
  }, [pincode])

  const setStateValue = (next: string) => {
    const matched = matchState(next) || next
    const kept = matchCity(city, matched, extraCities)

    setPinNote('')
    onChange({ state: matched, city: kept })
  }

  const setCityValue = (next: string) => {
    const matchedCity = matchCity(next, resolvedState, extraCities) || next
    const fromCity = stateForCity(matchedCity)
    const nextState = resolvedState || fromCity

    if (matchedCity && !citiesForState(nextState, extraCities).includes(matchedCity)) {
      setExtraCities(current => (current.includes(matchedCity) ? current : [...current, matchedCity]))
    }

    setPinNote('')
    onChange({ city: matchedCity, state: nextState || state })
  }

  return (
    <div className='vn-place-fields'>
      <div className='vn-field-row vn-field-row-3'>
        <label className='vn-field'>
          <span>Pincode</span>
          <input
            required={required}
            autoComplete='postal-code'
            inputMode='numeric'
            maxLength={6}
            pattern='\d{6}'
            value={pincode}
            onChange={event => {
              setPinNote('')
              setPinBusy(false)
              onChange({ pincode: event.target.value.replace(/\D/g, '').slice(0, 6) })
            }}
          />
        </label>
        <label className='vn-field'>
          <span>State</span>
          <FilterSelect
            required={required}
            name='state'
            autoComplete='address-level1'
            placeholder='Search state'
            value={resolvedState}
            options={INDIA_STATES}
            onChange={setStateValue}
          />
        </label>
        <label className='vn-field'>
          <span>City</span>
          <FilterSelect
            required={required}
            name='city'
            autoComplete='address-level2'
            placeholder={resolvedState ? 'Search city' : 'Search any city'}
            value={city}
            options={cityOptions}
            onChange={setCityValue}
          />
        </label>
      </div>
      {pinNote ? (
        <p className={/no post office|could not|enter a/i.test(pinNote) ? 'vn-checkout-error' : 'vn-checkout-ok'}>
          {pinBusy ? 'Finding city and state…' : pinNote}
        </p>
      ) : null}
    </div>
  )
}

export default IndiaPlaceFields
