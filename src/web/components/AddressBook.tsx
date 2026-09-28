'use client'

import { useEffect, useState } from 'react'

import type { SavedAddress } from '@/libs/addresses-types'
import IndiaPlaceFields from '@web/components/IndiaPlaceFields'

export type AddressFields = Omit<SavedAddress, 'id' | 'isDefault'> & { id?: string; isDefault?: boolean }

const blank = (): AddressFields => ({
  label: 'Home',
  name: '',
  phone: '',
  address: '',
  locality: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false
})

const formatLine = (item: Pick<SavedAddress, 'address' | 'locality' | 'city' | 'state' | 'pincode'>) =>
  [item.address, item.locality, item.city, item.state, item.pincode].filter(Boolean).join(', ')

type AddressBookProps = {
  mode: 'manage' | 'pick'
  selectedId?: string
  onSelect?: (address: SavedAddress) => void
  seed?: Partial<AddressFields>
}

export const AddressBook = ({ mode, selectedId, onSelect, seed }: AddressBookProps) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [form, setForm] = useState<AddressFields>(blank())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [locateStatus, setLocateStatus] = useState('')
  const [locating, setLocating] = useState(false)

  const load = async () => {
    const res = await fetch('/api/web/account/addresses', { credentials: 'include' })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))

      setError(json.message || 'Could not load saved addresses')
      setAddresses([])
      setLoading(false)

      return []
    }

    const json = await res.json()
    const rows = Array.isArray(json) ? (json as SavedAddress[]) : []

    setAddresses(rows)
    setLoading(false)

    return rows
  }

  useEffect(() => {
    void load().then(rows => {
      if (mode === 'manage' && !rows.length) {
        setForm({
          ...blank(),
          ...seed,
          isDefault: true
        })
        setOpen(true)
      }
    })
  }, [mode])

  useEffect(() => {
    if (editingId || form.address || !seed?.address) return

    setForm(current => ({
      ...current,
      name: current.name || seed.name || '',
      phone: current.phone || seed.phone || '',
      address: current.address || seed.address || '',
      city: current.city || seed.city || '',
      pincode: current.pincode || seed.pincode || ''
    }))
  }, [editingId, form.address, seed?.address, seed?.city, seed?.name, seed?.phone, seed?.pincode])

  useEffect(() => {
    if (mode !== 'pick' || !addresses.length || selectedId) return

    const preferred = addresses.find(item => item.isDefault) || addresses[0]

    onSelect?.(preferred)
  }, [addresses, mode, onSelect, selectedId])

  const startAdd = () => {
    setEditingId(null)
    setForm({ ...blank(), isDefault: !addresses.length })
    setOpen(true)
    setError('')
    setLocateStatus('')
  }

  const startEdit = (item: SavedAddress) => {
    setEditingId(item.id)
    setForm({ ...item })
    setOpen(true)
    setError('')
    setLocateStatus('')
  }

  const fillFromCoords = async (lat: number, lng: number) => {
    const res = await fetch(`/api/web/location?lat=${lat}&lng=${lng}`)
    const json = await res.json()

    if (!res.ok) throw new Error(json.message || 'Could not read this location')

    setForm(current => ({
      ...current,
      address: json.address || current.address,
      locality: json.locality || current.locality,
      city: json.city || current.city,
      state: json.state || current.state,
      pincode: json.pincode || current.pincode
    }))
    setLocateStatus('Address filled from your location. Edit if needed.')
  }

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocateStatus('Location is not supported in this browser.')

      return
    }

    setLocating(true)
    setLocateStatus('Allow location access to auto-fill your address.')
    navigator.geolocation.getCurrentPosition(
      position => {
        void fillFromCoords(position.coords.latitude, position.coords.longitude)
          .catch(err => setLocateStatus(err instanceof Error ? err.message : 'Could not auto-fill address'))
          .finally(() => setLocating(false))
      },
      err => {
        setLocating(false)
        if (err.code === err.PERMISSION_DENIED) {
          setLocateStatus('Location permission denied. Enable it in the browser, or fill the address yourself.')
        } else {
          setLocateStatus('Could not get your location. Fill the address yourself.')
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  const save = async () => {
    setSaving(true)
    setError('')

    const res = await fetch('/api/web/account/addresses', {
      method: editingId ? 'PATCH' : 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: editingId || undefined })
    })
    const json = await res.json()

    setSaving(false)

    if (!res.ok) {
      setError(json.message || 'Could not save address')

      return
    }

    const rows = Array.isArray(json) ? (json as SavedAddress[]) : await load()

    setAddresses(rows)
    setOpen(false)
    setForm(blank())
    setEditingId(null)

    const saved = rows.find(item => item.id === editingId) || rows[rows.length - 1]

    if (saved) onSelect?.(saved)
  }

  const setDefault = async (id: string) => {
    const res = await fetch('/api/web/account/addresses', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'default', id })
    })
    const json = await res.json()

    if (res.ok && Array.isArray(json)) setAddresses(json)
  }

  const remove = async (id: string) => {
    if (!window.confirm('Remove this address?')) return

    const res = await fetch(`/api/web/account/addresses?id=${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' })
    const json = await res.json()

    if (res.ok && Array.isArray(json)) setAddresses(json)
  }

  return (
    <div className='vn-address-book'>
      {loading ? <p className='vn-drawer-note'>Loading addresses…</p> : null}
      {error && !open ? <p className='vn-checkout-error'>{error}</p> : null}
      {!loading && addresses.length ? (
        <div className='vn-address-grid'>
          {addresses.map(item => (
            <article
              key={item.id}
              className={`vn-address-card${mode === 'pick' && selectedId === item.id ? ' is-on' : ''}`}
            >
              {mode === 'pick' ? (
                <button type='button' className='vn-address-pick' onClick={() => onSelect?.(item)}>
                  <strong>
                    {item.label}
                    {item.isDefault ? <em>Default</em> : null}
                  </strong>
                  <span>
                    {item.name} · {item.phone}
                  </span>
                  <span>{formatLine(item)}</span>
                </button>
              ) : (
                <div className='vn-address-body'>
                  <strong>
                    {item.label}
                    {item.isDefault ? <em>Default</em> : null}
                  </strong>
                  <span>
                    {item.name} · {item.phone}
                  </span>
                  <span>{formatLine(item)}</span>
                </div>
              )}
              <div className='vn-address-tools'>
                <button type='button' onClick={() => startEdit(item)}>
                  Change
                </button>
                {!item.isDefault ? (
                  <button type='button' onClick={() => void setDefault(item.id)}>
                    Set default
                  </button>
                ) : null}
                <button type='button' onClick={() => void remove(item.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : !loading ? (
        <p className='vn-drawer-note'>No saved addresses yet. Fill the form below and save. You can add more after that.</p>
      ) : null}

      {!loading && !open ? (
        <button className='vn-btn vn-btn-solid' type='button' onClick={startAdd}>
          {addresses.length ? 'Add another address' : 'Add a delivery address'}
        </button>
      ) : null}

      {open ? (
        <form
          className='vn-address-form'
          onSubmit={event => {
            event.preventDefault()
            void save()
          }}
        >
          <h3>{editingId ? 'Edit address' : 'Add an address'}</h3>
          <label className='vn-field'>
            <span>Save as</span>
            <select value={form.label} onChange={event => setForm(current => ({ ...current, label: event.target.value }))}>
              <option>Home</option>
              <option>Work</option>
              <option>Family</option>
              <option>Other</option>
            </select>
          </label>
          <div className='vn-field-row'>
            <label className='vn-field'>
              <span>Full name</span>
              <input required value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} />
            </label>
            <label className='vn-field'>
              <span>Phone</span>
              <input required inputMode='tel' value={form.phone} onChange={event => setForm(current => ({ ...current, phone: event.target.value }))} />
            </label>
          </div>
          <div className='vn-locate'>
            <button className='vn-btn vn-btn-outline vn-locate-btn' type='button' onClick={useCurrentLocation} disabled={locating}>
              <i className='tabler-map-pin' />
              {locating ? 'Detecting location…' : 'Use my location'}
            </button>
            {locateStatus ? (
              <p className={locateStatus.includes('denied') || locateStatus.includes('Could not') ? 'vn-checkout-error' : 'vn-checkout-ok'}>
                {locateStatus}
              </p>
            ) : null}
          </div>
          <label className='vn-field'>
            <span>House / street</span>
            <textarea required rows={3} value={form.address} onChange={event => setForm(current => ({ ...current, address: event.target.value }))} />
          </label>
          <label className='vn-field'>
            <span>Area / locality</span>
            <input value={form.locality} onChange={event => setForm(current => ({ ...current, locality: event.target.value }))} />
          </label>
          <IndiaPlaceFields
            city={form.city}
            state={form.state}
            pincode={form.pincode}
            onChange={patch =>
              setForm(current => ({
                ...current,
                city: patch.city !== undefined ? patch.city : current.city,
                state: patch.state !== undefined ? patch.state : current.state,
                pincode: patch.pincode !== undefined ? patch.pincode : current.pincode,
                locality: current.locality || patch.locality || ''
              }))
            }
          />
          <label className='vn-check'>
            <input type='checkbox' checked={Boolean(form.isDefault)} onChange={event => setForm(current => ({ ...current, isDefault: event.target.checked }))} />
            Use as default delivery location
          </label>
          {error ? <p className='vn-checkout-error'>{error}</p> : null}
          <div className='vn-account-actions'>
            <button className='vn-btn vn-btn-solid' type='submit' disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save changes' : 'Save address'}
            </button>
            <button
              className='vn-btn vn-btn-outline'
              type='button'
              onClick={() => {
                setOpen(false)
                setEditingId(null)
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </div>
  )
}
