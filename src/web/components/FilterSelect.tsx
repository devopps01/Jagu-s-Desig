'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'

import { filterOptions } from '@/libs/india-places'

type FilterSelectProps = {
  value: string
  options: string[]
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  name?: string
  autoComplete?: string
}

const FilterSelect = ({ value, options, onChange, placeholder = 'Search', required, disabled, name, autoComplete }: FilterSelectProps) => {
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dirty, setDirty] = useState(false)
  const [active, setActive] = useState(0)
  const filtered = useMemo(() => filterOptions(options, open && dirty ? query : ''), [dirty, open, options, query])
  const highlight = open ? (filtered[active] ? active : 0) : 0

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', onDoc)

    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = (next: string) => {
    onChange(next)
    setQuery('')
    setDirty(false)
    setOpen(false)
  }

  const shown = open && dirty ? query : value

  return (
    <div className={`vn-combo${open ? ' is-open' : ''}${disabled ? ' is-off' : ''}`} ref={rootRef}>
      <input type='hidden' name={name} value={value} required={required} />
      <input
        className='vn-combo-input'
        role='combobox'
        aria-expanded={open}
        aria-controls={id}
        aria-autocomplete='list'
        autoComplete={autoComplete || 'off'}
        disabled={disabled}
        placeholder={placeholder}
        value={shown}
        onFocus={() => {
          if (disabled) return
          const index = options.findIndex(item => item === value)
          setOpen(true)
          setDirty(false)
          setQuery('')
          setActive(index >= 0 ? index : 0)
        }}
        onChange={event => {
          setOpen(true)
          setDirty(true)
          setQuery(event.target.value)
        }}
        onKeyDown={event => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setOpen(true)
            setActive(index => Math.min(index + 1, Math.max(filtered.length - 1, 0)))
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setActive(index => Math.max(index - 1, 0))
          } else if (event.key === 'Enter' && open && filtered[highlight]) {
            event.preventDefault()
            pick(filtered[highlight])
          } else if (event.key === 'Escape') {
            setOpen(false)
            setQuery('')
          }
        }}
      />
      <i className='tabler-chevron-down vn-combo-caret' aria-hidden />
      {open ? (
        <div className='vn-combo-panel' id={id} role='listbox'>
          <p className='vn-combo-count'>
            {filtered.length} of {options.length}
          </p>
          {filtered.length ? (
            filtered.map((item, index) => (
              <button
                key={item}
                className={`vn-combo-option${item === value || index === highlight ? ' is-on' : ''}`}
                type='button'
                role='option'
                aria-selected={item === value}
                onMouseEnter={() => setActive(index)}
                onMouseDown={event => event.preventDefault()}
                onClick={() => pick(item)}
              >
                {item}
              </button>
            ))
          ) : (
            <p className='vn-combo-empty'>No match. Try another spelling.</p>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default FilterSelect
