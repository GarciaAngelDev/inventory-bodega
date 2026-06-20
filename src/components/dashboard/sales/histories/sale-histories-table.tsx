"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, FileX, Loader2, ReceiptText, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { CreateInventoryData, InventoryFetch, InventoryStatus, SaleDetailStatus, SaleFetch, SaleStatus } from "@/types";

import { fmtVET } from "@/utils/timezone";

import { Badge } from "@/components/ui/badge";
import { updateInventary } from "@/actions/inventary.action";
import { cn } from "@/lib/utils";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getAvailableProductById } from "@/actions/products.action";
import { useSetting } from "@/hooks/useSetting";
import SaleSummaryDialog from "../sale-summary-dialog";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow, TableCaption } from "@/components/ui/table";
import { formatPrice } from "@/lib/format-price";
import { calculateDetailIva, detailPrice } from "@/lib/price";
import { cancelDetailSale, cancelSale, concludeSale } from "@/actions/sales.action";
import { UseQueryResult } from "@tanstack/react-query";

interface SaleHistoriesTableProps extends HTMLAttributes<HTMLDivElement> {
  sales: SaleFetch[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
  getSalesQuery: UseQueryResult<any, Error>
}

const SaleHistoriesTable = ({ sales, isLoading, pagination, onSearch, getSalesQuery, ...props }: SaleHistoriesTableProps) => {

  const [openAlert, setOpenAlert] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingCancelSale, setLoadingCancelSale] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleFetch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConcludeSale, setLoadingConcludeSale] = useState<Record<string, boolean>>({});

  const columns: ColumnDef<SaleFetch>[] = [
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
            <span>{fmtVET(row.original.createdAt!, 'dd/MM/yyyy')}</span>
            <span className="text-muted-foreground">{fmtVET(row.original.createdAt!, 'HH:mm:ss')}</span>
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
      getSalesQuery.refetch();
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
      getSalesQuery.refetch();
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
      getSalesQuery.refetch();
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
        <DialogContent className="!max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-3">Lista de productos</h3>
            
            {/* Vista de Tabla para Pantallas Medianas y Grandes */}
            <div className="hidden md:block w-full overflow-x-auto max-h-[350px] border rounded-md">
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
                        <TableCell className="capitalize">{detail.inventaryItems[0].product?.name} {detail.ivaPercentage === 0 ? "(E)" : ""}</TableCell>
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

            {/* Vista de Tarjetas para Pantallas Pequeñas */}
            <div className="md:hidden space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {selectedSale?.details.map((detail) => {
                const subtotal = detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice);

                return (
                  <div key={detail.id} className="border rounded-lg p-4 space-y-3 bg-card text-card-foreground shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm capitalize">
                          {detail.inventaryItems[0].product?.name} {detail.ivaPercentage === 0 ? "(E)" : ""}
                        </h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span>Cant: <strong className="text-foreground">{detail.quantity}</strong></span>
                          <span className="mx-1.5">•</span>
                          <span>U. Medida: <strong className="text-foreground">{detail.measureUnitValue || 0}</strong></span>
                        </div>
                      </div>
                      <Badge className={cn(
                        "capitalize text-[10px] px-2 py-0.5 shrink-0",
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
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Precio</span>
                        <span className="font-medium">
                          {formatPrice({ price: detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice, country: { currency: "USD", locale: "en-US" } })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">IVA</span>
                        <span className="font-medium">{detail.ivaPercentage ? detail.ivaPercentage + "%" : "0%"}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">Subtotal</span>
                        <span className="font-semibold text-foreground">
                          {formatPrice({
                            price: subtotal + detail.iva,
                            country: { currency: "USD", locale: "en-US" }
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t">
                      {loadingDetails[detail.id!] ? (
                        <Button
                          size="sm" variant="outline" className="cursor-pointer w-full flex items-center justify-center gap-2"
                          disabled
                        >
                          <Loader2 className="animate-spin size-4" />
                          Anulando...
                        </Button>
                      ) : (
                        <Button
                          size="sm" variant="outline" className="cursor-pointer w-full flex items-center justify-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/5"
                          onClick={() => handleCancelDetailSale(detail.id!)}
                          disabled={detail.status === SaleDetailStatus.CANCELLED}
                        >
                          <FileX className="size-4" />
                          Anular producto
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              className="cursor-pointer w-full sm:w-auto"
              onClick={() => setOpenAlert(false)}
            >
              Cancelar
            </Button>
            <Button
              className="cursor-pointer bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto"
              onClick={handleCancelSale}
              disabled={loadingCancelSale}
            >
              {
                loadingCancelSale ? (
                  <div className="flex items-center gap-2 justify-center">
                    <Loader2 className="animate-spin" />
                    Anulando venta...
                  </div>
                ) : (
                  'Anular venta'
                )
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div {...props}>
        <DataTable
          data={sales}
          columns={columns}
          initialVisibleColumns={["user", "status", "createdAt", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay inventario disponible."
          onSearch={setSearchQuery}
        />
      </div>
    </>
  )
}

export default SaleHistoriesTable