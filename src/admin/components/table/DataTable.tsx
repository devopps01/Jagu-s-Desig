'use client'

import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import type { DataTableColumn, DataTableMeta } from './types'

const LOADING_ROW_COUNT = 5

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  meta: DataTableMeta
  loading?: boolean
  emptyText?: string
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const resolveColumn = <T,>(column: DataTableColumn<T>) => {
  const isActions = column.id === 'actions'

  return {
    minWidth: column.minWidth ?? (isActions ? 112 : undefined),
    align: column.align ?? (isActions ? ('right' as const) : ('left' as const)),
    label: column.label || (isActions ? 'Actions' : column.label)
  }
}

const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  meta,
  loading = false,
  emptyText = 'No records found.',
  onPageChange,
  onLimitChange
}: DataTableProps<T>) => (
  <>
    <TableContainer sx={{ maxHeight: { xs: 'none', lg: 'calc(100vh - 320px)' } }}>
      <Table stickyHeader size='small'>
        <TableHead>
          <TableRow>
            {columns.map(column => {
              const resolved = resolveColumn(column)

              return (
                <TableCell
                  key={column.id}
                  align={resolved.align}
                  sx={{
                    minWidth: resolved.minWidth,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    bgcolor: 'background.paper'
                  }}
                >
                  {resolved.label}
                </TableCell>
              )
            })}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            Array.from({ length: LOADING_ROW_COUNT }).map((_, index) => (
              <TableRow key={`loading-${index}`}>
                {columns.map(column => (
                  <TableCell key={column.id}>
                    <Skeleton variant='text' width={column.id === 'actions' ? 72 : '80%'} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ py: 8, border: 0 }}>
                <Box className='flex flex-col items-center gap-2 text-center'>
                  <Box
                    className='flex items-center justify-center rounded-full'
                    sx={{ width: 48, height: 48, bgcolor: 'action.hover', color: 'text.secondary' }}
                  >
                    <i className='tabler-database-off text-[22px]' />
                  </Box>
                  <Typography color='text.secondary'>{emptyText}</Typography>
                </Box>
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => (
              <TableRow key={rowKey(row)} hover>
                {columns.map(column => {
                  const resolved = resolveColumn(column)
                  const isActions = column.id === 'actions'
                  const raw = column.render
                    ? column.render(row)
                    : String((row as Record<string, unknown>)[column.id] ?? '—')

                  return (
                    <TableCell key={column.id} align={resolved.align} sx={isActions ? { whiteSpace: 'nowrap' } : undefined}>
                      {isActions ? (
                        <Box className='flex items-center justify-end gap-0.5' sx={{ minHeight: 32 }}>
                          {raw}
                        </Box>
                      ) : (
                        raw
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
    <TablePagination
      component='div'
      count={meta.total}
      page={Math.max(0, meta.page - 1)}
      rowsPerPage={meta.limit}
      rowsPerPageOptions={[10, 25, 50]}
      labelRowsPerPage='Rows per page:'
      onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
      onRowsPerPageChange={event => {
        onLimitChange(Number(event.target.value))
        onPageChange(1)
      }}
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        '.MuiTablePagination-toolbar': { px: { xs: 2, sm: 3 } }
      }}
    />
  </>
)

export default DataTable
