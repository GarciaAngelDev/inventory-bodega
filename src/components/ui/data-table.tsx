"use client";

import { useState, useMemo, useEffect } from "react";
import { ChevronDown, ChevronUp, Eye, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "./input";

export interface Column<T> {
  id: string;
  header: string;
  // Accessor for sorting and data access
  accessor: (item: T) => any;
  // Optional cell renderer - if not provided, accessor result will be rendered
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  defaultVisible?: boolean;
  className?: string;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  initialVisibleColumns?: string[];
  defaultSort?: SortConfig;
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onSortChange?: (sortConfig: SortConfig | null) => void;
  onSearch?: (search: string) => void;
}

export function DataTable<T>({
  data,
  columns,
  initialVisibleColumns,
  defaultSort,
  isLoading = false,
  emptyState = "No hay datos disponibles.",
  onSortChange,
  onSearch,
}: DataTableProps<T>) {
  // Get visible columns from props or use all columns
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    if (initialVisibleColumns) {
      return new Set(initialVisibleColumns);
    }
    // Default to all columns if no initial visibility specified
    return new Set(columns.map(col => col.id));
  });

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);

  // Update sortConfig when defaultSort prop changes
  useEffect(() => {
    if (defaultSort) {
      setSortConfig(defaultSort);
    }
  }, [defaultSort]);

  const [searchValue, setSearchValue] = useState("");

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    // Llamamos a onSearch directamente con el valor actual
    if (onSearch) {
      onSearch(value);
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const column = columns.find(col => col.id === sortConfig.key);
        if (!column?.sortable) return 0;

        // Get raw values for sorting using the accessor
        const rawA = column.accessor(a);
        const rawB = column.accessor(b);

        // Handle null/undefined values
        if (rawA === rawB) return 0;
        if (rawA === null || rawA === undefined) return 1;
        if (rawB === null || rawB === undefined) return -1;

        // If values are dates, compare them directly
        if (rawA instanceof Date && rawB instanceof Date) {
          return sortConfig.direction === 'asc' 
            ? rawA.getTime() - rawB.getTime()
            : rawB.getTime() - rawA.getTime();
        }

        // Try to convert to dates if the column is a date field
        const isDateField = ['createdat', 'date', 'updatedat'].includes(column.id.toLowerCase());
        if (isDateField) {
          const dateA = new Date(rawA);
          const dateB = new Date(rawB);
          
          if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
            return sortConfig.direction === 'asc' 
              ? dateA.getTime() - dateB.getTime()
              : dateB.getTime() - dateA.getTime();
          }
        }

        // Fall back to string comparison for other types
        const aValue = String(rawA);
        const bValue = String(rawB);
        const compareResult = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
      });
    }

    return result;
  }, [data, sortConfig, columns]);

  const handleSort = (key: string) => {
    const column = columns.find(col => col.id === key);
    if (!column?.sortable) return;

    setSortConfig(prev => {
      // If clicking the same column, toggle direction
      if (prev?.key === key) {
        const direction: 'asc' | 'desc' = prev.direction === 'asc' ? 'desc' : 'asc';
        const newSort: SortConfig = { key, direction };
        onSortChange?.(newSort);
        return newSort;
      }
      // New column, default to ascending
      const newSort: SortConfig = { key, direction: 'asc' };
      onSortChange?.(newSort);
      return newSort;
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setVisibleColumns(prev => {
      const newVisible = new Set(prev);
      if (newVisible.has(columnId)) {
        newVisible.delete(columnId);
      } else {
        newVisible.add(columnId);
      }
      return newVisible;
    });
  };

  // Filter visible columns
  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-4">
        {onSearch && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-9"
                value={searchValue}
                onChange={handleSearchChange}
              />
            </div>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        )}
        <div className={onSearch ? "" : "ml-auto"}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Eye className="mr-2 h-4 w-4" />
                Columnas
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={visibleColumns.has(column.id)}
                  onCheckedChange={() => toggleColumnVisibility(column.id)}
                  className="capitalize"
                >
                  {column.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumnsList.map((column) => (
                <TableHead
                  key={column.id}
                  className={column.className}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {column.sortable && (
                      <span className="ml-1">
                        {sortConfig?.key === column.id ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUp className="h-4 w-4 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={visibleColumnsList.length} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : processedData.length > 0 ? (
              processedData.map((item, rowIndex) => (
                <TableRow key={rowIndex}>
                  {visibleColumnsList.map((column) => (
                    <TableCell key={`${rowIndex}-${column.id}`}>
                      {column.cell ? column.cell(item) : column.accessor(item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnsList.length} className="h-24 text-center">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
