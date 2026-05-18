"use client";

import React, { Dispatch, SetStateAction, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { ChevronDown, Loader2, Search, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";

interface DataTableProps {
  data: any;
  columns: ColumnDef<any>[];
  initialVisibleColumns?: string[];
  emptyLabel?: string;
  isLoading?: boolean;
  onSearch?: (search: string) => void;
  delayAffterTyping?: number
  searchLoading?: boolean
  components?: React.ReactNode | React.ReactNode[]
}

const DataTable = ({ data, columns, initialVisibleColumns, emptyLabel = "No hay datos disponibles.", isLoading = false, onSearch, delayAffterTyping = 1000, searchLoading = false, components }: DataTableProps) => {

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (!initialVisibleColumns || !columns) return {};

    const visibility: VisibilityState = {};

    // Primero ocultamos todas las columnas
    columns.forEach(column => {
      if (column.id) {
        visibility[column.id] = false;
      }
    })

    // Luego mostramos solo las columnas especificadas
    initialVisibleColumns.forEach(columnId => {
      if (columnId in visibility) {
        visibility[columnId] = true;
      }
    })

    return visibility;
  })

  let time: NodeJS.Timeout

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  const setSearchState = (value: React.ChangeEvent<HTMLInputElement>) => {
    clearTimeout(time)
    time = setTimeout(() => {
      onSearch?.(value.target.value)
    }, delayAffterTyping)
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row gap-2 items-center py-4">
        <div className="w-full sm:flex-1">
          <div className="relative sm:max-w-max">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-4" />
            <Input
              placeholder="Buscar..."
              className="w-full sm:max-w-sm pl-8 pr-8"
              onChange={setSearchState}
            />
            {
              searchLoading && <Loader2 className="text-muted-foreground animate-spin size-4 absolute right-2 top-1/2 -translate-y-1/2" />
            }
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full xs:w-auto">
          {components}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 justify-between ml-auto w-full xs:w-auto">
                Columnas <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {
                table.getAllColumns().filter((column) => column.getCanHide()).map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {
                        column.columnDef.meta
                          ? column.columnDef.meta as any
                          : "Setea el meta en las columnas"
                      }
                    </DropdownMenuCheckboxItem>
                  )
                })
              }
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{
                        width: header.getSize() !== 150 ? header.getSize() : undefined,
                        minWidth: `${header.column.getSize()}px`
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 2 }).map((_, index) => (
                <TableRow key={index}>
                  {Array.from({ length: columns.length }).map((_, cellIndex) => (
                    <TableCell key={cellIndex} className="h-24 text-center">
                      <Skeleton className="h-5 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: cell.column.getSize() !== 150 ? cell.column.getSize() : undefined,
                          minWidth: `${cell.column.getSize()}px`
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default DataTable
