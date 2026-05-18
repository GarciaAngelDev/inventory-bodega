"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, Ban, List } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CreateInventoryData, InventoryFetch, InventoryStatus, Producer, ProducerStatus } from "@/types";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { updateInventary } from "@/actions/inventary.action";
import { cn } from "@/lib/utils";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getAvailableProductById } from "@/actions/products.action";

interface SaleHistoriesTableProps extends HTMLAttributes<HTMLDivElement> {
  producers: Producer[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
}

const ProducerHistoriesTable = ({ producers, isLoading, pagination, onSearch, ...props }: SaleHistoriesTableProps) => {

  // const { getInventaryQuery } = useInventary({});

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [inventaryId, setInventaryId] = useState<string | null>(null);
  /* const [selectedInventary, setSelectedInventary] = useState<CreateInventoryData | null>(null); */
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEdit = (inventary: InventoryFetch) => {
    /* setSelectedInventary(convertData(inventary)); */
    setOpen(true);
  };

  const handleDelete = async (inventary: CreateInventoryData) => {
    try {
      await updateInventary(inventary.id!, { ...inventary, status: InventoryStatus.CANCELLED });
      // await deleteInventary(inventary.id!);
      // await getInventaryQuery.refetch()
      toast.success('Inventario eliminado exitosamente');
      setOpenDelete(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al eliminar el inventario');
    }
  };

  const handleCancel = () => {
    setOpenDelete(false);
    /* setSelectedInventary(null); */
  };

  const showDetails = (inventaryId: string) => {
    setInventaryId(inventaryId);
    setOpenDetails(true);
  };

  const handleStatusChange = async (inventary: InventoryFetch, newStatus: InventoryStatus) => {
    const convertInventary = convertData(inventary);
    try {
      await updateInventary(convertInventary.id!, { ...convertInventary, status: newStatus });
      // await getInventaryQuery.refetch()
      toast.success('Estado del inventario actualizado exitosamente');
    } catch (error) {
      console.log(error);
      toast.error('Error al cambiar el estado del inventario');
    }
  };

  const onSearchChange = (search: string) => {
    onSearch(search);
  };

  const getAvailableProduct = async (id: string) => {
    try {
      const availableProduct = await getAvailableProductById(id);
      return availableProduct;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const columns: ColumnDef<Producer>[] = [
    {
      id: "user",
      accessorKey: "user",
      header: "Usuario",
      cell: ({ row }) => <div className="capitalize">{row.original.user?.name}</div>,
    },
    {
      id: "status",
      accessorKey: "status",
      size: 160,
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
        <Badge variant='outline' className={cn("select-none", {
          "bg-green-500/10 border-green-300 text-green-500": row.original.status === ProducerStatus.PRODUCED,
          "bg-red-500/10 border-red-300 text-red-500": row.original.status === ProducerStatus.CANCELLED,
          "bg-blue-500/10 border-blue-300 text-blue-500": row.original.status === ProducerStatus.IN_PRODUCTION,
          "bg-orange-500/10 border-orange-300 text-orange-500": row.original.status === ProducerStatus.PAUSED,
        })}>
          {
            row.original.status === ProducerStatus.PRODUCED ? 'Producido' :
            row.original.status === ProducerStatus.CANCELLED ? 'Cancelado' :
            row.original.status === ProducerStatus.IN_PRODUCTION ? 'En producción' :
            row.original.status === ProducerStatus.PAUSED ? 'En pausa' : 'Desconocido'
          }
        </Badge>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      size: 160,
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
        <div className="flex gap-2">
          <span>{format(row.original.createdAt!, 'dd/MM/yyyy')}</span>
          {/* <span className="text-muted-foreground">{format(row.original.createdAt!, 'HH:mm:ss')}</span> */}
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "actions",
      header: "Acciones",
      size: 140,
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  // setSelectedProducer(row.original)
                  // setOpenDetails(true)
                }}
              >
                <List />
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
                onClick={() => {
                  /* setSelectedInventary(convertData(row.original)); */
                  /* setOpenDelete(true); */
                }}
              >
                <Ban />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cancelar producción</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  ];

  return (
    <>
      {/* <CreateInventaryDialog open={open} onOpenChange={setOpen} data={selectedInventary!} /> */}
      {/* <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro de eliminar el inventario {selectedInventary?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esto eliminara permanentemente el inventario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedInventary!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog> */}
      <div {...props}>
        <DataTable
          data={producers}
          columns={columns}
          initialVisibleColumns={["user", "status", "createdAt", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay producciones disponibles."
          onSearch={setSearchQuery}
        />
      </div>
    </>
  )
}

export default ProducerHistoriesTable