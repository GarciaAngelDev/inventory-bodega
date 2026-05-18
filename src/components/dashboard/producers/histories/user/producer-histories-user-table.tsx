"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, FileX, Loader2, ReceiptText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CreateInventoryData, InventoryFetch, InventoryStatus, Producer, ProducerDetailStatus, ProducerStatus, SaleDetailStatus, SaleFetch, SaleStatus } from "@/types";

import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { updateInventary } from "@/actions/inventary.action";
import { cn } from "@/lib/utils";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getAvailableProductById } from "@/actions/products.action";
import { useSetting } from "@/hooks/useSetting";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow, TableCaption } from "@/components/ui/table";
import { formatPrice } from "@/lib/format-price";
import { calculateDetailIva, detailPrice } from "@/lib/price";
import { cancelDetailSale, cancelSale, concludeSale } from "@/actions/sales.action";
import { UseQueryResult } from "@tanstack/react-query";
import { cancelDetailProducer, cancelProducer } from "@/actions/producer.action";
import { ShowProducerDetails } from "../show-producer-details";

interface ProducerHistoriesTableProps extends HTMLAttributes<HTMLDivElement> {
  producers: Producer[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
  refetch: () => Promise<void>
}

const ProducerHistoriesUserTable = ({ producers, isLoading, pagination, onSearch, refetch, ...props }: ProducerHistoriesTableProps) => {

  const [openAlert, setOpenAlert] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingCancelProducer, setLoadingCancelProducer] = useState(false);
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConcludeProducer, setLoadingConcludeProducer] = useState<Record<string, boolean>>({});

  const columns: ColumnDef<Producer>[] = [
    {
      id: "user",
      accessorKey: "user",
      header: "Usuario",
      cell: ({ row }) => <div className="capitalize">{row.original.user?.name}</div>,
    },
    {
      id: "details",
      accessorKey: "details",
      header: "Productos",
      cell: ({ row }) => <div className="capitalize">{row.original.details.length}</div>,
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
          "bg-red-500/10 border-red-300 text-red-500": row.original.status === ProducerStatus.CANCELLED,
          "bg-blue-500/10 border-blue-300 text-blue-500": row.original.status === ProducerStatus.FINISHED,
          "bg-yellow-500/10 border-yellow-300 text-yellow-500": row.original.status === ProducerStatus.IN_PRODUCTION,
          "bg-orange-500/10 border-orange-300 text-orange-500": row.original.status === ProducerStatus.PAUSED,
          "bg-green-500/10 border-green-300 text-green-500": row.original.status === ProducerStatus.PRODUCED,
        })}>
          {
            row.original.status === ProducerStatus.CANCELLED ? 'Cancelado' :
              row.original.status === ProducerStatus.FINISHED ? 'Finalizado' :
                row.original.status === ProducerStatus.IN_PRODUCTION ? 'En producción' :
                  row.original.status === ProducerStatus.PAUSED ? 'En pausa' :
                    row.original.status === ProducerStatus.PRODUCED ? 'Producido' : "Desconocido"
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
          <span className="text-muted-foreground">{format(row.original.createdAt!, 'HH:mm a')}</span>
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
                  setSelectedProducer(row.original)
                  setOpenDetails(true)
                }}
              >
                <ReceiptText />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles</p>
            </TooltipContent>
          </Tooltip>
          {
            row.original.status === ProducerStatus.IN_PRODUCTION && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      handleConcludeProducer(row.original.id!)
                    }}
                    disabled={loadingConcludeProducer[row.original.id!]}
                  >
                    {
                      loadingConcludeProducer[row.original.id!] ? <Loader2 className="animate-spin" /> : <ShoppingCart />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Concluir producción</p>
                </TooltipContent>
              </Tooltip>
            )
          }
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedProducer(row.original)
                  setOpenAlert(true);
                }}
                disabled={row.original.status === ProducerStatus.CANCELLED}
              >
                <FileX />
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

  const handleCancelDetailSale = async (detailId: string) => {
    try {
      setLoadingDetails(prev => ({ ...prev, [detailId]: true }));
      await cancelDetailProducer(detailId);
      toast.success('Producto anulado exitosamente');
      const updateSelectedProducer = {
        ...selectedProducer,
        details: selectedProducer?.details?.map(detail => detail.id === detailId ? { ...detail, status: ProducerDetailStatus.CANCELLED } : detail),
      }
      setSelectedProducer(updateSelectedProducer as Producer);
      refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al anular producto');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [detailId]: false }));
    }
  };

  const handleCancelProducer = async () => {
    if (!selectedProducer?.id) {
      return;
    }
    try {
      setLoadingCancelProducer(true);
      await cancelProducer(selectedProducer?.id!);
      toast.success('Produccion anulada exitosamente');
      refetch();
      setOpenAlert(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al anular produccion');
    } finally {
      setLoadingCancelProducer(false);
    }
  };

  const handleConcludeProducer = async (id: string) => {
    try {
      setLoadingConcludeProducer(prev => ({ ...prev, [id]: true }));
      await concludeSale(id);
      toast.success('Produccion concluida exitosamente');
      refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al concluir produccion');
    } finally {
      setLoadingConcludeProducer(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <>
      {
        selectedProducer && (
          <ShowProducerDetails
            open={openDetails}
            setOpen={setOpenDetails}
            producer={selectedProducer}
          />
        )
      }

      <Dialog open={openAlert} onOpenChange={() => setOpenAlert(false)}>
        <DialogContent className="!max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <FileX />
                Anular producción
              </div>
            </DialogTitle>
            <DialogDescription>
              Puedes anular una producción completa o algun producto de forma parcial.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <h3 className="text-lg font-semibold">Lista de productos</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Unidad M.</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedProducer?.details.map((detail) => {

                  return (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.inventaryItems[0].product?.name}</TableCell>
                      <TableCell>{detail.quantity} UND</TableCell>
                      <TableCell>{detail.measureUnitValue || 0} {detail.inventaryItems[0].product?.inputProduct?.measureUnit}</TableCell>
                      <TableCell>
                        <Badge variant='outline' className={cn("select-none", {
                          "bg-red-500/10 border-red-300 text-red-500": detail.status === ProducerDetailStatus.CANCELLED,
                          "bg-blue-500/10 border-blue-300 text-blue-500": detail.status === ProducerDetailStatus.FINISHED,
                          "bg-yellow-500/10 border-yellow-300 text-yellow-500": detail.status === ProducerDetailStatus.IN_PRODUCTION,
                          "bg-orange-500/10 border-orange-300 text-orange-500": detail.status === ProducerDetailStatus.PAUSED,
                          "bg-green-500/10 border-green-300 text-green-500": detail.status === ProducerDetailStatus.PRODUCED,
                        })}>
                          {
                            detail.status === ProducerDetailStatus.CANCELLED ? 'Cancelado' :
                              detail.status === ProducerDetailStatus.FINISHED ? 'Finalizado' :
                                detail.status === ProducerDetailStatus.IN_PRODUCTION ? 'En producción' :
                                  detail.status === ProducerDetailStatus.PAUSED ? 'En pausa' :
                                    detail.status === ProducerDetailStatus.PRODUCED ? 'Producido' : "Desconocido"
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 items-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {
                                loadingDetails[detail.id!] ? (
                                  <Button
                                    size="icon" variant="outline" className="cursor-pointer"
                                    disabled
                                  >
                                    <Loader2 className="animate-spin" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="icon" variant="outline" className="cursor-pointer"
                                    onClick={() => handleCancelDetailSale(detail.id!)}
                                    disabled={detail.status === ProducerDetailStatus.CANCELLED}
                                  >
                                    <FileX />
                                  </Button>
                                )
                              }
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Cancelar producto</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setOpenAlert(false)}
              >
                Cancelar
              </Button>
              <Button
                className="cursor-pointer bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancelProducer}
                disabled={loadingCancelProducer}
              >
                {
                  loadingCancelProducer ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" />
                      Cancelando produccion...
                    </div>
                  ) : (
                    'Cancelar produccion'
                  )
                }
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div {...props}>
        <DataTable
          data={producers}
          columns={columns}
          initialVisibleColumns={["user", "details", "status", "createdAt", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay producción disponible."
          onSearch={setSearchQuery}
        />
      </div>
    </>
  )
}

export default ProducerHistoriesUserTable