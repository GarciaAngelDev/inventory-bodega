"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHeader, TableCaption, TableHead, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CircleDollarSign, DollarSign, Eye, FileX, Loader2, ReceiptText, ShoppingCart, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSellersDailySales } from "@/hooks/useSellersDailySales";
import { Skeleton } from "@/components/ui/skeleton";
import { SaleDetailStatus, SaleFetch, SaleStatus, SellerDailySales } from "@/types";
import { formatPrice } from "@/lib/format-price";
import { cancelDetailSale, cancelSale, concludeSale, getSaleById } from "@/actions/sales.action";
import { toast } from "sonner";
import SaleSummaryDialog from "../../sale-summary-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { detailPrice } from "@/lib/price";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const SaleHistoriesAdminPage = () => {

  const [accordionActive, setAccordionActive] = useState("");
  const [selectedSale, setSelectedSale] = useState<SaleFetch | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [loadingShowSummary, setLoadingShowSummary] = useState<Record<string, boolean>>({});
  const [loadingCloseSale, setLoadingCloseSale] = useState<Record<string, boolean>>({});
  const [loadingCancelSale, setLoadingCancelSale] = useState<Record<string, boolean>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingCancelDetailSale, setLoadingCancelDetailSale] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { getSalesDailyQuery } = useSellersDailySales(limit, (currentPage - 1) * limit);

  const sellerDailySales: SellerDailySales = getSalesDailyQuery.data;

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // The table will automatically update because the offset in useCategories changes
  }, []);

  const alertCancelSale = async (id: string) => {
    try {
      setLoadingCancelSale(prev => ({ ...prev, [id]: true }));
      const sale = await getSaleById(id);
      setSelectedSale(sale);
      setOpenAlert(true);
    } catch (error) {
      console.log(error);
      toast.error('Error al obtener venta');
    } finally {
      setLoadingCancelSale(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCancelDetailSale = async (detailId: string) => {
    try {
      setLoadingDetails(prev => ({ ...prev, [detailId]: true }));
      const cancelDetail = await cancelDetailSale(detailId);
      toast.success('Producto anulado exitosamente');
      const updateSelectedSale = {
        ...selectedSale,
        status: cancelDetail.sale.status,
        details: selectedSale?.details?.map(detail => detail.id === detailId ? { ...detail, status: SaleDetailStatus.CANCELLED } : detail),
      }
      setSelectedSale(updateSelectedSale as SaleFetch);
      getSalesDailyQuery.refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al anular producto');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [detailId]: false }));
    }
  };

  const handleCancelSale = async (id: string) => {
    try {
      setLoadingCancelDetailSale(true);
      await cancelSale(id);
      toast.success('Venta anulada exitosamente');
      getSalesDailyQuery.refetch();
      setOpenAlert(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al anular venta');
    } finally {
      setLoadingCancelDetailSale(false);
    }
  };

  const handleConcludeSale = async (id: string) => {
    try {
      setLoadingCloseSale(prev => ({ ...prev, [id]: true }));
      await concludeSale(id);
      toast.success('Venta concluida exitosamente');
      getSalesDailyQuery.refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al concluir venta');
    } finally {
      setLoadingCloseSale(prev => ({ ...prev, [id]: false }));
    }
  };

  const showSaleSummary = async (id: string) => {
    try {
      setLoadingShowSummary(prev => ({ ...prev, [id]: true }));
      const sale = await getSaleById(id);
      setSelectedSale(sale);
      setOpenDetails(true);
    } catch (error) {
      console.log(error);
      toast.error('Error al obtener venta');
    } finally {
      setLoadingShowSummary(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div>

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
                onClick={() => handleCancelSale(selectedSale!.id!)}
                disabled={loadingCancelDetailSale || selectedSale?.status === SaleStatus.CANCELLED}
              >
                {
                  loadingCancelDetailSale ? (
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

      <div className="flex sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Ventas</h2>
          <p className="text-muted-foreground">Historial de ventas por vendedor</p>
        </div>
        <div>
          <Link href="/dashboard/ventas">
            <Button className="hidden sm:flex bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
              Ir a ventas
            </Button>
            <Button className="flex sm:hidden bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4 sm:mb-0">
          <div className="flex items-center gap-2 sm:mb-4">
            <Users className="size-5" />
            {
              getSalesDailyQuery.isLoading ? (
                <Skeleton className="w-64 h-8" />
              ) : (
                <h3 className="text-lg sm:text-2xl font-bold">
                  <span className="hidden sm:inline">Lista de vendedores</span>
                  <span className="inline sm:hidden">Vendedores</span>
                  ( {sellerDailySales.users.length} )
                </h3>
              )
            }

          </div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5" />
            {
              getSalesDailyQuery.isLoading ? (
                <Skeleton className="w-64 h-8" />
              ) : (
                <span className="text-sm sm:text-base text-muted-foreground">Hoy: {formatPrice({ price: sellerDailySales.totalSalesAllUsersAmountToday, country: { currency: "USD", locale: "en-US" } })}</span>
              )
            }
          </div>
        </div>
        {
          getSalesDailyQuery.isLoading ? (
            <div className="space-y-1">
              {
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="w-full h-12" />
                ))
              }
            </div>
          ) : (
            <Accordion
              type="single"
              collapsible
              value={accordionActive}
              onValueChange={(value) => {
                setAccordionActive(value);
                setCurrentPage(1);
              }}
              className="w-full rounded-md overflow-hidden"
            >
              {
                sellerDailySales.users.map((user) => {

                  const totalPages = user.pagination ? Math.ceil(user.pagination.total / limit) : 0;

                  return (
                    <AccordionItem value={user.id} key={user.id}>
                      <AccordionTrigger className={cn("", accordionActive === user.id && "bg-accent")}>
                        <div className="flex items-center gap-2 justify-between w-full">
                          <div className="flex items-center gap-2">
                            <UserRound className="size-5" />
                            <span className="capitalize">{user.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ShoppingCart className="size-4" />
                            <span>{user.totalSalesToday} {user.totalSalesToday === 1 ? 'venta' : 'ventas'}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="flex flex-col gap-4 text-balance">
                        <div className="px-4 pt-4 mb-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold">Ventas del día</h3>
                            <div className="flex items-center gap-2">
                              <DollarSign className="size-4" />
                              <span className="text-muted-foreground">Hoy: {formatPrice({ price: user.totalSalesAmountToday, country: { currency: "USD", locale: "en-US" } })}</span>
                            </div>
                          </div>
                          <div className="w-full border rounded-lg overflow-hidden bg-accent/50">
                            <Table>
                              <TableHeader className="bg-accent">
                                <TableRow>
                                  <TableHead>Fecha</TableHead>
                                  <TableHead>Productos</TableHead>
                                  <TableHead>Precio total</TableHead>
                                  <TableHead className="w-[120px]">Estado</TableHead>
                                  <TableHead className="w-[140px]">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {
                                  user.sales.length > 0 ? (
                                    user.sales.map((sale) => (
                                      <TableRow key={sale.id}>
                                        <TableCell className="font-medium">
                                          <span>{format(sale.date, "yyyy-MM-dd")}</span> - <span>{format(sale.date, "HH:mm a")}</span>
                                        </TableCell>
                                        <TableCell>{sale.details}</TableCell>
                                        <TableCell>{formatPrice({ price: sale.totalAmount, country: { currency: "USD", locale: "en-US" } })}</TableCell>
                                        <TableCell>
                                          <Badge className={cn(
                                            "capitalize",
                                            sale.status === SaleStatus.CANCELLED ? 'bg-red-500/20 text-red-500 border-red-300' :
                                              sale.status === SaleStatus.RESERVED ? 'bg-yellow-500/20 text-yellow-500 border-yellow-300' :
                                                sale.status === SaleStatus.SOLD ? 'bg-green-500/20 text-green-500 border-green-300' : ""
                                          )}>
                                            {
                                              sale.status === SaleStatus.CANCELLED ? 'Anulado' :
                                                sale.status === SaleStatus.RESERVED ? 'Reservado' :
                                                  sale.status === SaleStatus.SOLD ? 'Vendido' : 'Desconocido'
                                            }
                                          </Badge>
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex items-center gap-2">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="outline"
                                                  size="icon"
                                                  className="cursor-pointer"
                                                  onClick={() => showSaleSummary(sale.id)}
                                                  disabled={loadingShowSummary[sale.id]}
                                                >
                                                  {
                                                    loadingShowSummary[sale.id] ? <Loader2 className="animate-spin" /> : <ReceiptText />
                                                  }
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Ver detalles</p>
                                              </TooltipContent>
                                            </Tooltip>
                                            {
                                              sale.status === SaleStatus.RESERVED && (
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      size="icon"
                                                      className="cursor-pointer"
                                                      onClick={() => handleConcludeSale(sale.id)}
                                                      disabled={loadingCloseSale[sale.id]}
                                                    >
                                                      {
                                                        loadingCloseSale[sale.id] ? <Loader2 className="animate-spin" /> : <ShoppingCart />
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
                                                  onClick={() => alertCancelSale(sale.id)}
                                                  disabled={loadingCancelSale[sale.id]}
                                                >
                                                  {
                                                    loadingCancelSale[sale.id] ? <Loader2 className="animate-spin" /> : <FileX />
                                                  }
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Anular venta</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                        <span className="font-bold">{user.name}</span> no tiene ventas del dia de hoy
                                      </TableCell>
                                    </TableRow>
                                  )
                                }
                              </TableBody>
                            </Table>
                          </div>

                          {/* Pagination */}
                          {
                            totalPages > 1 && (
                              <div className="mt-6 flex justify-center">
                                <Pagination>
                                  <PaginationContent>
                                    <PaginationItem>
                                      <PaginationPrevious
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (currentPage > 1) handlePageChange(currentPage - 1);
                                        }}
                                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                                      />
                                    </PaginationItem>

                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                      // Show pages around current page
                                      let pageNum;
                                      if (totalPages <= 5) {
                                        pageNum = i + 1;
                                      } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                      } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                      } else {
                                        pageNum = currentPage - 2 + i;
                                      }

                                      return (
                                        <PaginationItem key={pageNum}>
                                          <PaginationLink
                                            isActive={pageNum === currentPage}
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handlePageChange(pageNum);
                                            }}
                                          >
                                            {pageNum}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    })}

                                    <PaginationItem>
                                      <PaginationNext
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                                        }}
                                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                                      />
                                    </PaginationItem>
                                  </PaginationContent>
                                </Pagination>
                              </div>
                            )
                          }

                          <div className="mt-4 flex justify-center">
                            <Link href={`/dashboard/ventas/historial/historial-usuario/${user.id}`} className="text-muted-foreground hover:underline">Ver todas las ventas</Link>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })
              }
            </Accordion>
          )
        }

      </div>

    </div>
  );
}

export default SaleHistoriesAdminPage;
