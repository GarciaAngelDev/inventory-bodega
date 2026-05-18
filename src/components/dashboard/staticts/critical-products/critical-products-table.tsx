"use client";

import { useState, HTMLAttributes, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { ProductFetch } from "@/types";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface CriticalProductData extends ProductFetch {
  totalQuantity: number;
  criticalThreshold: number;
  isInputProduct: boolean;
}

interface CriticalProductsTableProps extends HTMLAttributes<HTMLDivElement> {
  criticalProducts: CriticalProductData[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
}

const CriticalProductsTable = ({ criticalProducts, isLoading, onSearch }: CriticalProductsTableProps) => {

  const onSearchChange = (search: string) => {
    onSearch(search);
  };

  const columns: ColumnDef<CriticalProductData>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nombre
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      id: "totalQuantity",
      accessorKey: "totalQuantity",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cantidad actual
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.original.totalQuantity} {row.original.inputProduct?.measureUnit || "UND"}</div>,
    },
    {
      id: "criticalThreshold",
      accessorKey: "criticalThreshold",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Umbral crítico
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("criticalThreshold")}</div>,
    },
    
  ];

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        columns={columns}
        data={criticalProducts}
        initialVisibleColumns={["name", "totalQuantity", "criticalThreshold"]}
        isLoading={isLoading}
        emptyLabel="No hay inventarios registrados"
        onSearch={onSearchChange}
      />
    </div>
  );
}

export default CriticalProductsTable;