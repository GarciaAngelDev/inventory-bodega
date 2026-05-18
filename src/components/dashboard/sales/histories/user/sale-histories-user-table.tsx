"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, FileX, Loader2, ReceiptText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CreateInventoryData, InventoryFetch, InventoryStatus, SaleDetailStatus, SaleFetch, SaleStatus } from "@/types";

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
import SaleSummaryDialog from "../../sale-summary-dialog";

interface SaleHistoriesTableProps extends HTMLAttributes<HTMLDivElement> {
  sales: SaleFetch[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
  refetch: () => Promise<void>
}

const SaleHistoriesUserTable = ({ sales, isLoading, pagination, onSearch, refetch, ...props }: SaleHistoriesTableProps) => {

  const [openAlert, setOpenAlert] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingCancelSale, setLoadingCancelSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleFetch | null>(null);
  const [loadingConcludeSale, setLoadingConcludeSale] = useState<Record<string, boolean>>({});

  const columns: ColumnDef<SaleFetch>[] = [
    {
      id: "user",
      accessorKey: "user",
      header: "Usuario",
      meta: 'Usuario',
      cell: ({ row }) => <div className="capitalize">{row.original.user?.name}</div>,
    },
    {
      id: "status",
      accessorKey: "status",
      meta: 'Estado',
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
          "bg-green-500/10 border-green-300 text-green-500": row.original.status === SaleStatus.SOLD,
          "bg-red-500/10 border-red-300 text-red-500": row.original.status === SaleStatus.CANCELLED,
          "bg-blue-500/10 border-blue-300 text-blue-500": row.original.status === SaleStatus.RESERVED,
          "bg-orange-500/10 border-orange-300 text-orange-500": row.original.status === SaleStatus.RETURNED,
        })}>
          {
            row.original.status === SaleStatus.SOLD ? 'Vendido' :
              row.original.status === SaleStatus.CANCELLED ? 'Anulado' :
                row.original.status === SaleStatus.RESERVED ? 'Reservado' :
                  row.original.status === SaleStatus.RETURNED ? 'Devuelto' : 'Desconocido'
          }
        </Badge>
      ),
    },
    {
      id: "createdAt",
      accessorKey: "createdAt",
      meta: 'Fecha',
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
      meta: 'Acciones',
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
                  setSelectedSale(row.original)
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
            row.original.status === SaleStatus.RESERVED && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      handleConcludeSale(row.original.id!)
                    }}
                    disabled={loadingConcludeSale[row.original.id!]}
                  >
                    {
                      loadingConcludeSale[row.original.id!] ? <Loader2 className="animate-spin" /> : <ShoppingCart />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Concluir venta reservada</p>
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
                  setSelectedSale(row.original)
                  setOpenAlert(true);
                }}
                disabled={row.original.status === SaleStatus.CANCELLED}
              >
                <FileX />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Anular venta</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  ];

  const handleCancelDetailSale = async (detailId: string) => {
    try {
      setLoadingDetails(prev => ({ ...prev, [detailId]: true }));
      await cancelDetailSale(detailId);
      toast.success('Producto anulado exitosamente');
      const updateSelectedSale = {
        ...selectedSale,
        details: selectedSale?.details?.map(detail => detail.id === detailId ? { ...detail, status: SaleDetailStatus.CANCELLED } : detail),
      }
      setSelectedSale(updateSelectedSale as SaleFetch);
      refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al anular producto');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [detailId]: false }));
    }
  };

  const handleCancelSale = async () => {
    if (!selectedSale?.id) {
      return;
    }
    try {
      setLoadingCancelSale(true);
      await cancelSale(selectedSale?.id!);
      toast.success('Venta anulada exitosamente');
      refetch();
      setOpenAlert(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al anular venta');
    } finally {
      setLoadingCancelSale(false);
    }
  };

  const handleConcludeSale = async (id: string) => {
    try {
      setLoadingConcludeSale(prev => ({ ...prev, [id]: true }));
      await concludeSale(id);
      toast.success('Venta concluida exitosamente');
      refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al concluir venta');
    } finally {
      setLoadingConcludeSale(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <>
      {
        selectedSale && (
          <SaleSummaryDialog
            sale={selectedSale!}
            showSummary={openDetails}
            setShowSummary={setOpenDetails}
          />
        )
      }

      <Dialog open={openAlert} onOpenChange={() => setOpenAlert(false)}>
        <DialogContent className="!max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <FileX />
                Anular venta
              </div>
            </DialogTitle>
            <DialogDescription>
              Puedes anular una venta completa o algun producto de forma parcial.
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
                  <TableHead>Precio</TableHead>
                  <TableHead>IVA</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[100px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedSale?.details.map((detail) => {

                  const subtotal = detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice);

                  return (
                    <TableRow key={detail.id}>
                      <TableCell>{detail.inventaryItems[0].product?.name} {detail.ivaPercentage === 0 ? "(E)" : ""}</TableCell>
                      <TableCell>{detail.quantity}</TableCell>
                      <TableCell>{detail.measureUnitValue || 0}</TableCell>
                      <TableCell>{formatPrice({ price: detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice, country: { currency: "USD", locale: "en-US" } })}</TableCell>
                      <TableCell>{detail.ivaPercentage ? detail.ivaPercentage + "%" : "0%"}</TableCell>
                      <TableCell>
                        {(
                          formatPrice({
                            price: subtotal + detail.iva,
                            country: { currency: "USD", locale: "en-US" }
                          })
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(
                          "capitalize",
                          detail.status === SaleDetailStatus.CANCELLED ? 'bg-red-500/20 text-red-500 border-red-300' :
                            detail.status === SaleDetailStatus.RESERVED ? 'bg-yellow-500/20 text-yellow-500 border-yellow-300' :
                              detail.status === SaleDetailStatus.SOLD ? 'bg-green-500/20 text-green-500 border-green-300' : ""
                        )}>
                          {
                            detail.status === SaleDetailStatus.CANCELLED ? 'Anulado' :
                              detail.status === SaleDetailStatus.RESERVED ? 'Reservado' :
                                detail.status === SaleDetailStatus.SOLD ? 'Vendido' : 'Desconocido'
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
                                    disabled={detail.status === SaleDetailStatus.CANCELLED}
                                  >
                                    <FileX />
                                  </Button>
                                )
                              }
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Anular producto</p>
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
                onClick={handleCancelSale}
                disabled={loadingCancelSale}
              >
                {
                  loadingCancelSale ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" />
                      Anulando venta...
                    </div>
                  ) : (
                    'Anular venta'
                  )
                }
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div {...props}>
        <DataTable
          data={sales}
          columns={columns}
          initialVisibleColumns={["user", "status", "createdAt", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay ventas disponibles."
          onSearch={onSearch}
        />
      </div>
    </>
  )
}

export default SaleHistoriesUserTable