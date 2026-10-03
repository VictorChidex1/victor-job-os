import type { ReactNode } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/states/EmptyState'

export interface DataTableColumn<TData> {
  header: ReactNode
  accessorKey?: keyof TData & string
  cell?: (row: TData) => ReactNode
  className?: string
}

interface DataTableProps<TData> {
  columns: DataTableColumn<TData>[]
  data: TData[]
  emptyTitle?: string
  emptyDescription?: string
}

export function DataTable<TData>({
  columns,
  data,
  emptyTitle = 'No records yet',
  emptyDescription = 'Records will appear here.',
}: DataTableProps<TData>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, columnIndex) => (
                <TableCell key={columnIndex} className={column.className}>
                  {column.cell
                    ? column.cell(row)
                    : column.accessorKey
                      ? String(row[column.accessorKey])
                      : null}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}