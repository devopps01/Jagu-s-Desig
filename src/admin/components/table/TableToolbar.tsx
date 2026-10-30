'use client'

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CardHeader from '@mui/material/CardHeader'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

type TableToolbarProps = {
  title: string
  subtitle?: string
  search: string
  searchPlaceholder?: string
  onSearchChange: (value: string) => void
  onRefresh?: () => void
  actions?: ReactNode
  hideSearch?: boolean
}

const TableToolbar = ({
  title,
  subtitle,
  search,
  searchPlaceholder = 'Search...',
  onSearchChange,
  onRefresh,
  actions,
  hideSearch = false
}: TableToolbarProps) => (
  <CardHeader
    sx={{
      gap: 4,
      flexWrap: 'wrap',
      px: { xs: 3, sm: 4 },
      pt: { xs: 4, sm: 5 },
      pb: 2,
      '& .MuiCardHeader-action': { margin: 0, width: { xs: '100%', md: 'auto' } }
    }}
    title={
      <Box>
        <Typography variant='h5'>{title}</Typography>
        {subtitle ? (
          <Typography variant='body2' color='text.secondary'>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
    }
    action={
      <Box className='flex flex-wrap items-center gap-3' sx={{ m: 0, width: { xs: '100%', md: 'auto' } }}>
        {hideSearch ? null : (
          <TextField
            size='small'
            value={search}
            placeholder={searchPlaceholder}
            onChange={event => onSearchChange(event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 220 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='tabler-search' />
                  </InputAdornment>
                )
              }
            }}
          />
        )}
        {actions}
        {onRefresh ? (
          <Button variant='tonal' color='secondary' startIcon={<i className='tabler-refresh' />} onClick={onRefresh}>
            Refresh
          </Button>
        ) : null}
      </Box>
    }
  />
)

export default TableToolbar
