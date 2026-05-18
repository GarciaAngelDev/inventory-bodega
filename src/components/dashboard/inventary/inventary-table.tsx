"use client";

import { useState, HTMLAttributes, useEffect, Dispatch, SetStateAction } from "react";
import { ArrowDownToDot, ArrowUpDown, ArrowUpFromDot, Edit, Eye, Trash } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CreateInventoryData, InventoryFetch, InventoryStatus, InventoryType } from "@/types";
import CreateInventaryDialog from "./create-inventary-dialog";
import { format } from "date-fns";
import DetailsInventaryDialog from "./details-inventary-dialog";
import { Badge } from "@/components/ui/badge";
import { updateInventary } from "@/actions/inventary.action";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import DataTable from "@/components/data-table";
import { DateRange } from "react-day-picker";
import { ColumnDef } from "@tanstack/react-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DatePickerWithRange } from "@/components/common/date-picker-with-range";

interface InventaryTableProps extends HTMLAttributes<HTMLDivElement> {
  inventary: InventoryFetch[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
  searchLoading?: boolean;
  dateRange: DateRange | undefined
  setDateRange: Dispatch<SetStateAction<DateRange | undefined>>
}

const InventoryTable = ({ inventary, isLoading, pagination, onSearch, searchLoading, dateRange, setDateRange }: InventaryTableProps) => {

  // const { getInventaryQuery } = useInventary({});

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [inventaryId, setInventaryId] = useState<string | null>(null);
  const [selectedInventary, setSelectedInventary] = useState<CreateInventoryData | null>(null);

  const [allInventary, setAllInventary] = useState<InventoryFetch[]>([]);

  const openDetailsDialog = (id: string) => {
    setInventaryId(id);
    setOpenDetails(true);
  };

  const convertData = (data: InventoryFetch) => {
    const inventary: CreateInventoryData = {
      id: data.id,
      name: data.name,
      status: data.status,
      items: data.inventaryItems,
      type: data.type,
      invoiceNumber: data.invoiceNumber,
      providerName: data.providerName,
    };
    // handleEdit(product);
    return inventary;
  }

  useEffect(() => {
    setAllInventary(inventary);
  }, [inventary]);

  const handleEdit = (inventary: InventoryFetch) => {
    setSelectedInventary(convertData(inventary));
    setOpen(true);
  };

  const handleDelete = async (inventary: CreateInventoryData) => {
    try {
      await updateInventary(inventary.id!, { ...inventary, status: InventoryStatus.CANCELLED });
      // await deleteInventary(inventary.id!);
      // await getInventaryQuery.refetch()
      setAllInventary(allInventary.filter((item) => item.id !== inventary.id));
      toast.success('Inventario eliminado exitosamente');
      setOpenDelete(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al eliminar el inventario');
    }
  };

  const handleCancel = () => {
    setOpenDelete(false);
    setSelectedInventary(null);
  };

  const handleStatusChange = async (inventary: InventoryFetch, newStatus: InventoryStatus) => {
    if (inventary.status === InventoryStatus.SOLD) return;
    const convertInventary = convertData(inventary);
    try {
      await updateInventary(convertInventary.id!, { ...convertInventary, status: newStatus });
      // await getInventaryQuery.refetch()
      setAllInventary(allInventary.map((item) => (item.id === inventary.id ? { ...item, status: newStatus } : item)));
      toast.success('Estado del inventario actualizado exitosamente');
    } catch (error) {
      console.log(error);
      toast.error('Error al cambiar el estado del inventario');
    }
  };

  const columns: ColumnDef<InventoryFetch>[] = [
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
      cell: ({ row }) => <div className="capitalize">{row.getValue("name")}</div>,
    },
    {
      id: "type",
      accessorKey: "type",
      meta: "Tipo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="px-4">
          <Badge variant='outline' className={cn(
            row.getValue("type") === InventoryType.SALE
              ? "bg-green-500/10 border-green-300 text-green-500"
              : row.getValue("type") === InventoryType.INTERNAL
                ? "bg-blue-500/10 border-blue-300 text-blue-500"
                : ""
          )}>
            {
              row.getValue("type") === InventoryType.SALE
                ? (<div className="flex items-center gap-2">Venta <ArrowUpFromDot className="size-3" /></div>)
                : (<div className="flex items-center gap-2">Interno <ArrowDownToDot className="size-3" /></div>)
            }
          </Badge>
        </div>
      ),
    },
    {
      id: "invoiceNumber",
      accessorKey: "invoiceNumber",
      meta: "Nº Factura",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nº Factura
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-4">{row.getValue("invoiceNumber")}</div>,
    },
    {
      id: "providerName",
      accessorKey: "providerName",
      meta: "Proveedor",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Proveedor
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-4">{row.getValue("providerName")}</div>,

    },
    {
      id: "user",
      accessorKey: "user",
      meta: "Usuario",
      header: "Usuario",
      cell: ({ row }) => <div className="capitalize">{row.original.user?.name}</div>,
    },
    {
      id: "inventaryItems",
      accessorKey: "inventaryItems",
      meta: "Productos",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Productos
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-4">{row.original.inventaryItems.length}</div>,
    },
    {
      id: "status",
      accessorKey: "status",
      meta: "Estado",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estado
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={row.original.status === InventoryStatus.SOLD}>
            <div className="px-4">
              <Badge
                variant='default'
                className={cn(
                  "cursor-pointer",
                  row.original.status === InventoryStatus.STOP ? "bg-red-500/10 border-red-300 text-red-500" :
                    row.original.status === InventoryStatus.PENDING ? "bg-yellow-500/10 border-yellow-300 text-yellow-500" :
                      row.original.status === InventoryStatus.PREPARED ? "bg-green-500/10 border-green-300 text-green-500" :
                        row.original.status === InventoryStatus.SOLD ? "bg-blue-500/10 border-blue-300 text-blue-500 cursor-not-allowed" : ""
                )}
              >
                {
                  row.original.status === InventoryStatus.STOP ? "Detenido" :
                    row.original.status === InventoryStatus.PENDING ? "Pendiente" :
                      row.original.status === InventoryStatus.PREPARED ? "Preparado" :
                        row.original.status === InventoryStatus.SOLD ? "Vendido" : ""
                }
              </Badge>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem disabled={row.original.status === InventoryStatus.STOP ? true : false} onClick={() => handleStatusChange(row.original, InventoryStatus.STOP)}>Detenido</DropdownMenuItem>
            <DropdownMenuItem disabled={row.original.status === InventoryStatus.PREPARED ? true : false} onClick={() => handleStatusChange(row.original, InventoryStatus.PREPARED)}>Preparado</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      meta: "Fecha",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fecha
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex flex-col px-4">
          <span>{format(row.original.createdAt!, 'dd/MM/yyyy')}</span>
          <span className="text-xs text-muted-foreground">{format(row.original.createdAt!, 'HH:mm:ss a')}</span>
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "actions",
      meta: "Acciones",
      header: "Acciones",
      size: 160,
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => openDetailsDialog(row.original.id!)}
              >
                <Eye />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => handleEdit(row.original)}
              >
                <Edit />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedInventary(convertData(row.original));
                  setOpenDelete(true);
                }}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full overflow-hidden">
      <CreateInventaryDialog open={open} onOpenChange={setOpen} data={selectedInventary!} />
      {inventaryId && (
        <DetailsInventaryDialog
          open={openDetails}
          onOpenChange={setOpenDetails}
          inventaryId={inventaryId}
        />
      )}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no puede ser deshecha. Esto eliminará permanentemente el inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedInventary!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="w-full overflow-x-auto">
        <DataTable
          columns={columns}
          data={allInventary}
          initialVisibleColumns={["name", "type", "user", "inventaryItems", "status", "createdAt", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay inventarios registrados"
          onSearch={onSearch}
          searchLoading={searchLoading}
          components={(
            <DatePickerWithRange
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          )}
        />
      </div>
    </div>
  );
}

export default InventoryTable;