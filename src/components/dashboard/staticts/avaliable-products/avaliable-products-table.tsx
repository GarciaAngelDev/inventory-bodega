"use client";

import { useState, HTMLAttributes, useEffect } from "react";
import { ArrowUpDown } from "lucide-react";
import { AvaliableProduct, ProductFetch } from "@/types";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";

interface AvaliableProductsTableProps extends HTMLAttributes<HTMLDivElement> {
  avaliableProducts: AvaliableProduct[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
}

const AvaliableProductsTable = ({ avaliableProducts, isLoading, onSearch }: AvaliableProductsTableProps) => {

  const onSearchChange = (search: string) => {
    onSearch(search);
  };

  const columns: ColumnDef<AvaliableProduct>[] = [
    {
      id: "name",
      accessorKey: "name",
      meta: "Nombre",
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
      cell: ({ row }) => <div className="capitalize px-3">{row.original.product.name}</div>,
    },
    {
      id: "availableQuantity",
      accessorKey: "availableQuantity",
      meta: "Cantidad disponible",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cantidad disponible
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-3">{row.original.availableQuantity || row.original.availableMeasureUnitValue} {row.original.product.inputProduct?.measureUnit || "UND"}</div>,
    },
    {
      id: "minStock",
      accessorKey: "minStock",
      meta: "Mínimo disponible",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Mínimo disponible
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-3">{row.original.product.inputProduct ? row.original.product.inputProduct.minQuantity : row.original.product.minStock}</div>,
    },
    
  ];

  return (
    <div className="w-full overflow-x-auto">
      <DataTable
        columns={columns}
        data={avaliableProducts}
        initialVisibleColumns={["name", "availableQuantity", "minStock"]}
        isLoading={isLoading}
        emptyLabel="No hay inventarios registrados"
        onSearch={onSearchChange}
      />
    </div>
  );
}

export default AvaliableProductsTable;