"use client";

import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHeader, TableCaption, TableHead, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { ArrowLeft, CircleDollarSign, DollarSign, Eye, FileX, Grid2X2Plus, Loader2, Pickaxe, ReceiptText, ShoppingCart, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useSellersDailySales } from "@/hooks/useSellersDailySales";
import { Skeleton } from "@/components/ui/skeleton";
import { Producer, ProducerDetailStatus, ProducersDaily, ProducerStatus, SaleDetailStatus, SaleFetch, SaleStatus, SellerDailySales } from "@/types";
import { formatPrice } from "@/lib/format-price";
import { cancelDetailSale, cancelSale, concludeSale, getSaleById } from "@/actions/sales.action";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { detailPrice } from "@/lib/price";
import { useProducersDaily } from "@/hooks/useProducersDaily";
import { cancelDetailProducer, cancelProducer, getProducerById } from "@/actions/producer.action";
import { ShowProducerDetails } from "../show-producer-details";

const ProducersHistoriesAdminPage = () => {

  const [accordionActive, setAccordionActive] = useState("");
  const [selectedProducer, setSelectedProducer] = useState<Producer | null>(null);
  const [openAlert, setOpenAlert] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [loadingShowProduction, setLoadingShowProduction] = useState<Record<string, boolean>>({});
  const [loadingCloseSale, setLoadingCloseSale] = useState<Record<string, boolean>>({});
  const [loadingCancelProducer, setLoadingCancelProducer] = useState<Record<string, boolean>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});
  const [loadingCancelDetailProducer, setLoadingCancelDetailProducer] = useState(false);

  const { getProducersDailyQuery } = useProducersDaily();

  const producersDaily: ProducersDaily = getProducersDailyQuery.data;

  const alertCancelProducer = async (id: string) => {
    try {
      setLoadingCancelProducer(prev => ({ ...prev, [id]: true }));
      const producer = await getProducerById(id);
      setSelectedProducer(producer);
      setOpenAlert(true);
    } catch (error) {
      console.log(error);
      toast.error('Error al obtener produccion');
    } finally {
      setLoadingCancelProducer(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleCancelDetailProducer = async (detailId: string) => {
    try {
      setLoadingDetails(prev => ({ ...prev, [detailId]: true }));
      const cancelDetail = await cancelDetailProducer(detailId);
      toast.success('Producto anulado exitosamente');
      const updateSelectedProducer = {
        ...selectedProducer,
        status: cancelDetail.producer.status,
        details: selectedProducer?.details?.map(detail => detail.id === detailId ? { ...detail, status: ProducerDetailStatus.CANCELLED } : detail),
      }
      setSelectedProducer(updateSelectedProducer as Producer);
      getProducersDailyQuery.refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al anular producto');
    } finally {
      setLoadingDetails(prev => ({ ...prev, [detailId]: false }));
    }
  };

  const handleCancelProducer = async (id: string) => {
    try {
      setLoadingCancelDetailProducer(true);
      await cancelProducer(id);
      toast.success('Produccion anulada exitosamente');
      getProducersDailyQuery.refetch();
      setOpenAlert(false);
    } catch (error) {
      console.log(error);
      toast.error('Error al anular produccion');
    } finally {
      setLoadingCancelDetailProducer(false);
    }
  };

  const handleConcludeProducer = async (id: string) => {
    try {
      setLoadingCloseSale(prev => ({ ...prev, [id]: true }));
      await concludeSale(id);
      toast.success('Venta concluida exitosamente');
      getProducersDailyQuery.refetch();
    } catch (error) {
      console.log(error);
      toast.error('Error al concluir venta');
    } finally {
      setLoadingCloseSale(prev => ({ ...prev, [id]: false }));
    }
  };

  const showProducerDetails = async (id: string) => {
    try {
      setLoadingShowProduction(prev => ({ ...prev, [id]: true }));
      const producer = await getProducerById(id);
      setSelectedProducer(producer);
      setOpenDetails(true);
    } catch (error) {
      console.log(error);
      toast.error('Error al obtener la produccion');
    } finally {
      setLoadingShowProduction(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div>

      {
        selectedProducer && (
          <ShowProducerDetails
            producer={selectedProducer!}
            open={openDetails}
            setOpen={setOpenDetails}
          />
        )
      }

      <Dialog open={openAlert} onOpenChange={() => setOpenAlert(false)}>
        <DialogContent className="!max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <FileX />
                Cancelar producción
              </div>
            </DialogTitle>
            <DialogDescription>
              Puedes cancelar una producción completa o algun producto de forma parcial.
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
                      <TableCell className="capitalize">{detail.inventaryItems[0].product?.name}</TableCell>
                      <TableCell>{detail.quantity} UND</TableCell>
                      <TableCell>{detail.measureUnitValue || 0} {detail.inventaryItems[0].product?.inputProduct?.measureUnit}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn({
                            "bg-red-500/10 border-red-300 text-red-500": detail.status === ProducerDetailStatus.CANCELLED,
                            "bg-orange-500/10 border-orange-300 text-orange-500": detail.status === ProducerDetailStatus.PAUSED,
                            "bg-yellow-500/10 border-yellow-300 text-yellow-500": detail.status === ProducerDetailStatus.IN_PRODUCTION,
                            "bg-green-500/10 border-green-300 text-green-500": detail.status === ProducerDetailStatus.PRODUCED,
                            "bg-blue-500/10 border-blue-300 text-blue-500": detail.status === ProducerDetailStatus.FINISHED,
                          })}
                        >
                          {
                            detail.status === ProducerDetailStatus.CANCELLED ? "Anulado" :
                              detail.status === ProducerDetailStatus.PAUSED ? "En pausa" :
                                detail.status === ProducerDetailStatus.IN_PRODUCTION ? "En producción" :
                                  detail.status === ProducerDetailStatus.PRODUCED ? "Producido" :
                                    detail.status === ProducerDetailStatus.FINISHED ? "Finalizado" :
                                      "Desconocido"
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
                                    onClick={() => handleCancelDetailProducer(detail.id!)}
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
                onClick={() => handleCancelProducer(selectedProducer!.id!)}
                disabled={loadingCancelDetailProducer || selectedProducer?.status === ProducerStatus.CANCELLED}
              >
                {
                  loadingCancelDetailProducer ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" />
                      Cancelando producción...
                    </div>
                  ) : (
                    'Cancelar producción'
                  )
                }
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Producción</h2>
          <p className="text-muted-foreground">Historial de producción por productor</p>
        </div>
        <div>
          <Link href="/dashboard/produccion">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
              Ir a producción
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Users className="size-5" />
            {
              getProducersDailyQuery.isLoading ? (
                <Skeleton className="w-64 h-8" />
              ) : (
                <h3 className="text-2xl font-bold">Lista de productores ({producersDaily.users.length})</h3>
              )
            }

          </div>
          <div className="flex items-center gap-2">
            <Grid2X2Plus className="size-5" />
            {
              getProducersDailyQuery.isLoading ? (
                <Skeleton className="w-64 h-8" />
              ) : (
                <span className="text-muted-foreground">Hoy: {producersDaily.totalProducersAmountToday}</span>
              )
            }
          </div>
        </div>
        {
          getProducersDailyQuery.isLoading ? (
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
              onValueChange={setAccordionActive}
              className="w-full rounded-md overflow-hidden"
            >
              {
                producersDaily.users.map((user) => (
                  <AccordionItem value={user.id} key={user.id}>
                    <AccordionTrigger className={cn("", accordionActive === user.id && "bg-accent")}>
                      <div className="flex items-center gap-2 justify-between w-full">
                        <div className="flex items-center gap-2">
                          <UserRound className="size-5" />
                          <span className="capitalize">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Pickaxe className="size-4" />
                          <span>{user.totalProducersToday} {user.totalProducersToday === 1 ? 'producción' : 'producciones'}</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-4 text-balance">
                      <div className="px-4 pt-4 mb-2 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold">Producción del día</h3>
                          <div className="flex items-center gap-2">
                            <Pickaxe className="size-4" />
                            <span className="text-muted-foreground">Hoy: {user.totalProducersToday}</span>
                          </div>
                        </div>
                        <div className="w-full border rounded-lg overflow-hidden bg-accent/50">
                          <Table>
                            <TableHeader className="bg-accent">
                              <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Productos</TableHead>
                                <TableHead className="w-[120px]">Estado</TableHead>
                                <TableHead className="w-[120px]">Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {
                                user.producers.length > 0 ? (
                                  user.producers.map((producer) => (
                                    <TableRow key={producer.id}>
                                      <TableCell className="font-medium">
                                        <span>{format(producer.date, "yyyy-MM-dd")}</span> - <span>{format(producer.date, "HH:mm a")}</span>
                                      </TableCell>
                                      <TableCell>{producer.details}</TableCell>
                                      <TableCell>
                                        <Badge className={cn(
                                          "capitalize",
                                          producer.status === ProducerStatus.CANCELLED ? 'bg-red-500/20 text-red-500 border-red-300' :
                                            producer.status === ProducerStatus.PAUSED ? 'bg-yellow-500/20 text-yellow-500 border-yellow-300' :
                                              producer.status === ProducerStatus.PRODUCED ? 'bg-green-500/20 text-green-500 border-green-300' :
                                                producer.status === ProducerStatus.FINISHED ? 'bg-green-500/20 text-green-500 border-green-300' :
                                                  producer.status === ProducerStatus.IN_PRODUCTION ? 'bg-green-500/20 text-green-500 border-green-300' : ""
                                        )}>
                                          {
                                            producer.status === ProducerStatus.CANCELLED ? 'Cancelado' :
                                              producer.status === ProducerStatus.PAUSED ? 'En pausa' :
                                                producer.status === ProducerStatus.PRODUCED ? 'Producido' :
                                                  producer.status === ProducerStatus.FINISHED ? 'Finalizado' :
                                                    producer.status === ProducerStatus.IN_PRODUCTION ? 'En producción' : ""
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
                                                onClick={() => showProducerDetails(producer.id)}
                                                disabled={loadingShowProduction[producer.id]}
                                              >
                                                {
                                                  loadingShowProduction[producer.id] ? <Loader2 className="animate-spin" /> : <ReceiptText />
                                                }
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Ver detalles</p>
                                            </TooltipContent>
                                          </Tooltip>
                                          {
                                            producer.status === ProducerStatus.IN_PRODUCTION && (
                                              <Tooltip>
                                                <TooltipTrigger asChild>
                                                  <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="cursor-pointer"
                                                  /* onClick={() => handleConcludeSale(sale.id)}
                                                  disabled={loadingCloseSale[sale.id]} */
                                                  >
                                                    {
                                                      loadingCloseSale[producer.id] ? <Loader2 className="animate-spin" /> : <ShoppingCart />
                                                    }
                                                  </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>Finalizar producción</p>
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
                                                onClick={() => alertCancelProducer(producer.id)}
                                                disabled={loadingCancelProducer[producer.id]}
                                              >
                                                {
                                                  loadingCancelProducer[producer.id] ? <Loader2 className="animate-spin" /> : <FileX />
                                                }
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>Cancelar producción</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))
                                ) : (
                                  <TableRow>
                                    <TableCell colSpan={4} className="h-16 text-center text-muted-foreground">
                                      <span className="font-bold">{user.name}</span> no tiene producciones el dia de hoy
                                    </TableCell>
                                  </TableRow>
                                )
                              }
                            </TableBody>
                          </Table>
                        </div>
                        <div className="mt-4 flex justify-center">
                          <Link href={`/dashboard/produccion/historial/historial-usuario/${user.id}`} className="text-muted-foreground hover:underline">Ver todas las producciones</Link>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))
              }
            </Accordion>
          )
        }

      </div>

    </div>
  );
}

export default ProducersHistoriesAdminPage;
