'use client'

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

import Autocomplete from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import { Controller, type Control, type FieldErrors, type FieldPath, type PathValue, type UseFormSetValue } from 'react-hook-form'

import { adminApi } from '@admin/libs/adminApi'
import CustomTextField from '@core/components/mui/TextField'
import type { CustomerSuggestion } from '@/libs/customer-suggest'

const sourceLabel = (source: CustomerSuggestion['source']) => (source === 'rent' ? 'Rent customer' : 'Website user')

const fieldText = (message: unknown) => (typeof message === 'string' ? message : '')

type CustomerBits = {
  customerName: string
  customerPhone: string
  customerEmail: string
}

export const RentCustomerFields = <T extends CustomerBits>({
  control,
  errors,
  setValue
}: {
  control: Control<T>
  errors: FieldErrors<T>
  setValue: UseFormSetValue<T>
}) => {
  const [query, setQuery] = useState('')
  const [field, setField] = useState<'name' | 'phone' | null>(null)
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([])
  const appliedName = useRef('')
  const appliedPhone = useRef('')

  useEffect(() => {
    const text = query.trim()

    if (text.length < 2) {
      setSuggestions([])

      return
    }

    let live = true
    const timer = window.setTimeout(() => {
      void adminApi<{ data?: CustomerSuggestion[] }>(`/api/admin/customers/suggest?q=${encodeURIComponent(text)}`, undefined, {
        silentSuccess: true
      }).then(result => {
        if (!live) return

        setSuggestions(result.ok ? result.data?.data || [] : [])
      })
    }, 250)

    return () => {
      live = false
      window.clearTimeout(timer)
    }
  }, [query])

  const write = (key: 'customerName' | 'customerPhone' | 'customerEmail', value: string) => {
    setValue(key as FieldPath<T>, value as PathValue<T, FieldPath<T>>, { shouldValidate: true, shouldDirty: true })
  }

  const applySuggestion = (item: CustomerSuggestion) => {
    appliedName.current = item.name
    appliedPhone.current = item.phone
    write('customerName', item.name)
    write('customerPhone', item.phone)
    write('customerEmail', item.email)
    setSuggestions([])
    setField(null)
    setQuery('')
  }

  const renderSuggestion = (props: HTMLAttributes<HTMLLIElement> & { key: string }, option: CustomerSuggestion | string) => {
    const { key, ...rest } = props

    if (typeof option === 'string') return <li key={key} {...rest}>{option}</li>

    return (
      <li key={key} {...rest}>
        <Box sx={{ py: 0.5 }}>
          <Typography fontWeight={600}>{option.name || 'Saved customer'}</Typography>
          <Typography variant='body2' color='text.secondary'>
            {[option.phone, option.email, sourceLabel(option.source)].filter(Boolean).join(' · ')}
          </Typography>
        </Box>
      </li>
    )
  }

  return (
    <>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={'customerName' as FieldPath<T>}
          control={control}
          render={({ field: nameField }) => (
            <Autocomplete
              freeSolo
              fullWidth
              options={field === 'name' ? suggestions : []}
              open={field === 'name' && suggestions.length > 0}
              filterOptions={options => options}
              getOptionLabel={option => (typeof option === 'string' ? option : option.name)}
              inputValue={nameField.value}
              onClose={() => {
                if (field === 'name') setField(null)
              }}
              onInputChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  nameField.onChange('')
                  setQuery('')
                  setSuggestions([])
                  setField(null)

                  return
                }

                if (reason !== 'input') return

                nameField.onChange(value)

                if (value === appliedName.current) {
                  setSuggestions([])
                  setField(null)

                  return
                }

                setField('name')
                setQuery(value)
              }}
              onChange={(_event, value) => {
                if (value && typeof value !== 'string') applySuggestion(value)
              }}
              renderOption={renderSuggestion}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  fullWidth
                  label='Customer name'
                  error={Boolean(errors.customerName)}
                  helperText={fieldText(errors.customerName?.message) || 'Type a name or mobile to choose a saved customer.'}
                  slotProps={{
                    input: params.InputProps,
                    htmlInput: { ...params.inputProps, autoComplete: 'off' },
                    inputLabel: params.InputLabelProps
                  }}
                />
              )}
              slotProps={{ popper: { sx: { zIndex: 1600 } } }}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={'customerPhone' as FieldPath<T>}
          control={control}
          render={({ field: phoneField }) => (
            <Autocomplete
              freeSolo
              fullWidth
              options={field === 'phone' ? suggestions : []}
              open={field === 'phone' && suggestions.length > 0}
              filterOptions={options => options}
              getOptionLabel={option => (typeof option === 'string' ? option : option.phone)}
              inputValue={phoneField.value}
              onClose={() => {
                if (field === 'phone') setField(null)
              }}
              onInputChange={(_event, value, reason) => {
                if (reason === 'clear') {
                  phoneField.onChange('')
                  setQuery('')
                  setSuggestions([])
                  setField(null)

                  return
                }

                if (reason !== 'input') return

                phoneField.onChange(value)

                if (value === appliedPhone.current) {
                  setSuggestions([])
                  setField(null)

                  return
                }

                setField('phone')
                setQuery(value)
              }}
              onChange={(_event, value) => {
                if (value && typeof value !== 'string') applySuggestion(value)
              }}
              renderOption={renderSuggestion}
              renderInput={params => (
                <CustomTextField
                  {...params}
                  fullWidth
                  label='Phone'
                  error={Boolean(errors.customerPhone)}
                  helperText={fieldText(errors.customerPhone?.message) || 'Select a match to fill the name, phone, and email.'}
                  slotProps={{
                    input: params.InputProps,
                    htmlInput: { ...params.inputProps, autoComplete: 'off' },
                    inputLabel: params.InputLabelProps
                  }}
                />
              )}
              slotProps={{ popper: { sx: { zIndex: 1600 } } }}
            />
          )}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name={'customerEmail' as FieldPath<T>}
          control={control}
          render={({ field: emailField }) => (
            <CustomTextField fullWidth label='Email' {...emailField} error={Boolean(errors.customerEmail)} helperText={fieldText(errors.customerEmail?.message)} />
          )}
        />
      </Grid>
    </>
  )
}
