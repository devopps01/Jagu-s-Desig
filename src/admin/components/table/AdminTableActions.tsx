'use client'

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'

const AdminTableActions = ({ children }: { children: ReactNode }) => (
  <Box className='flex items-center justify-end gap-0.5' sx={{ whiteSpace: 'nowrap', minHeight: 32 }}>
    {children}
  </Box>
)

export default AdminTableActions
