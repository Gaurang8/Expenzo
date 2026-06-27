import React from "react"
import { ChevronUp, ChevronDown, MoreHorizontal, Inbox, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface ColumnDef<T> {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (item: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  
  // Pagination
  page?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  
  // Sorting
  sortField?: string
  sortDesc?: boolean
  onSortChange?: (field: string) => void
  
  // Actions
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyMessage = "No records found",
  page = 1,
  totalPages = 1,
  onPageChange,
  sortField,
  sortDesc,
  onSortChange,
  onRowClick,
  actions,
}: DataTableProps<T>) {
  
  const handleSort = (field: string) => {
    if (onSortChange) {
      onSortChange(field)
    }
  }

  return (
    <div className="rounded-md border bg-white overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-4 py-3 font-medium whitespace-nowrap",
                    col.sortable && "cursor-pointer hover:bg-slate-100"
                  )}
                  onClick={() => col.sortable && handleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortField === col.id && (
                      <span className="text-indigo-600">
                        {sortDesc ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_col, j) => (
                    <td key={j} className="px-4 py-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-4 text-right">
                      <Skeleton className="h-8 w-8 rounded-md ml-auto" />
                    </td>
                  )}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <Inbox className="h-10 w-10 text-slate-300 mb-3" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr 
                  key={item.id} 
                  className={cn(
                    "hover:bg-slate-50 transition-colors",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <td key={col.id} className="px-4 py-3 whitespace-nowrap">
                      {col.cell 
                        ? col.cell(item) 
                        : col.accessorKey 
                          ? (item[col.accessorKey] as React.ReactNode) 
                          : null}
                    </td>
                  ))}
                  {actions && (
                    <td 
                      className="px-4 py-2 text-right"
                      onClick={(e) => e.stopPropagation()} // Prevent row click when clicking actions
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {actions(item)}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {!isLoading && data.length > 0 && onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50">
          <div className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(1)}
              disabled={page <= 1}
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1 mx-2">
              {page > 1 && (
                <Button variant="ghost" size="icon" onClick={() => onPageChange(page - 1)}>
                  {page - 1}
                </Button>
              )}
              <Button variant="outline" size="icon" className="bg-slate-100 font-bold pointer-events-none">
                {page}
              </Button>
              {page < totalPages && (
                <Button variant="ghost" size="icon" onClick={() => onPageChange(page + 1)}>
                  {page + 1}
                </Button>
              )}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onPageChange(totalPages)}
              disabled={page >= totalPages}
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
