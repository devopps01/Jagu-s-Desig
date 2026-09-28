'use client'

import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'

import type { DataTableColumn, DataTableMeta } from './types'

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
    <div className='overflow-x-auto'>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map(column => (
              <TableCell key={column.id} sx={{ minWidth: column.minWidth }}>
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography>Loading...</Typography>
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length}>
                <Typography>{emptyText}</Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map(row => (
              <TableRow key={rowKey(row)} hover>
                {columns.map(column => (
                  <TableCell key={column.id}>
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.id] ?? '-')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    <TablePagination
      component='div'
      count={meta.total}
      page={Math.max(0, meta.page - 1)}
      rowsPerPage={meta.limit}
      rowsPerPageOptions={[10, 25, 50]}
      onPageChange={(_event, nextPage) => onPageChange(nextPage + 1)}
      onRowsPerPageChange={event => {
        onLimitChange(Number(event.target.value))
        onPageChange(1)
      }}
    />
  </>
)

export default DataTable
