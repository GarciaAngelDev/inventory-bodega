"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { InventoryFetch, InventoryItem, InventoryItemStatus, InventoryStatus, InventoryType, MeasureUnit, UpdateInventoryItemData } from "@/types";
import { Boxes, CircleCheck, CircleDollarSign, History, Package, ReceiptText, UserRound } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { getInventaryById, updateInventaryItem } from "@/actions/inventary.action";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InventaryItemStatus } from "@/generated/prisma";
import { toast } from "sonner";
import { useInventary } from "@/hooks/useInventary";

interface DetailsInventaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventaryId: string;
}

const currentSubTotalPrice = (inventory: InventoryFetch, isCurrent: boolean) => {
  let retailTotalPrice = 0;
  let wholesaleTotalPrice = 0;
  inventory.inventaryItems.forEach(item => {
    if(item.status !== InventoryItemStatus.AVAILABLE) return;
    if (item.product?.inputProduct) {
      if (item.product.inputProduct.measureUnit === MeasureUnit.G || item.product.inputProduct.measureUnit === MeasureUnit.ML) {
        retailTotalPrice += Number(item.retailPrice) * (isCurrent ? (item.measureUnitValue! / 1000) : (item.initialMeasureUnitValue! / 1000));
        wholesaleTotalPrice += Number(item.wholesalePrice) * (isCurrent ? (item.measureUnitValue! / 1000) : (item.initialMeasureUnitValue! / 1000));
      } else {
        retailTotalPrice += Number(item.retailPrice) * (isCurrent ? item.measureUnitValue! : item.initialMeasureUnitValue!);
        wholesaleTotalPrice += Number(item.wholesalePrice) * (isCurrent ? item.measureUnitValue! : item.initialMeasureUnitValue!);
      }
    } else {
      retailTotalPrice += Number(item.retailPrice) * Number(isCurrent ? item.stock : item.initialStock);
      wholesaleTotalPrice += Number(item.wholesalePrice) * Number(isCurrent ? item.stock : item.initialStock);
    }
  });

  // const ivaInclude = inventory.inventaryItems.some(item => item.ivaPercentage ? item.ivaPercentage > 0 : false);
  // const ivaPercentage = inventory.inventaryItems.find(item => item.ivaPercentage && item.ivaPercentage > 0)?.ivaPercentage || 0;
  // const totalRetailPrice = ivaInclude && ivaPercentage ? retailTotalPrice * (ivaPercentage / 100) + retailTotalPrice : retailTotalPrice;
  // const totalWholesalePrice = ivaInclude && ivaPercentage ? wholesaleTotalPrice * (ivaPercentage / 100) + wholesaleTotalPrice : wholesaleTotalPrice;

  return { retailTotalPrice, wholesaleTotalPrice };
}

const currentTotalItemPrice = ({ inventoryItem, isCurrent, type }: { inventoryItem: InventoryItem, isCurrent: boolean, type: "retail" | "wholesale" }) => {
  if (inventoryItem.product?.inputProduct) {
    if (inventoryItem.product.inputProduct.measureUnit === MeasureUnit.G || inventoryItem.product.inputProduct.measureUnit === MeasureUnit.ML) {
      if (type === "retail") {
        return Number(inventoryItem.retailPrice) * (isCurrent ? (inventoryItem.measureUnitValue! / 1000) : (inventoryItem.initialMeasureUnitValue! / 1000));
      } else {
        return Number(inventoryItem.wholesalePrice) * (isCurrent ? (inventoryItem.measureUnitValue! / 1000) : (inventoryItem.initialMeasureUnitValue! / 1000));
      }
    } else {
      if (type === "retail") {
        return Number(inventoryItem.retailPrice) * (isCurrent ? inventoryItem.measureUnitValue! : inventoryItem.initialMeasureUnitValue!);
      } else {
        return Number(inventoryItem.wholesalePrice) * (isCurrent ? inventoryItem.measureUnitValue! : inventoryItem.initialMeasureUnitValue!);
      }
    }
  } else {
    if (type === "retail") {
      return Number(inventoryItem.retailPrice) * Number(isCurrent ? inventoryItem.stock : inventoryItem.initialStock);
    } else {
      return Number(inventoryItem.wholesalePrice) * Number(isCurrent ? inventoryItem.stock : inventoryItem.initialStock);
    }
  }
}

const currentItems = (inventory: InventoryFetch, isCurrent: boolean) => {
  let countItems = 0;

  if (isCurrent) {
    countItems = inventory.inventaryItems.filter(item => item.status === InventoryItemStatus.AVAILABLE).length;
  } else {
    countItems = inventory.inventaryItems.length;
  }

  return countItems;
}

const currentStock = (inventoryItem: InventoryItem, isCurrent: boolean) => {
  let countStock = 0;

  if (inventoryItem.product?.inputProduct) {
    if (isCurrent) {
      countStock = inventoryItem.measureUnitValue!;
    } else {
      countStock = inventoryItem.initialMeasureUnitValue!;
    }
  } else {
    if (isCurrent) {
      countStock = inventoryItem.stock;
    } else {
      countStock = inventoryItem.initialStock;
    }
  }

  return countStock;
}

const measureUnit = (inventoryItem: InventoryItem) => {
  if (inventoryItem.product?.inputProduct) {
    return inventoryItem.product.inputProduct.measureUnit;
  } else {
    return "UND"
  }
}

const DetailsInventaryDialog = ({ open, onOpenChange, inventaryId }: DetailsInventaryDialogProps) => {

  const [inventoryData, setInventoryData] = useState<InventoryFetch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCurrent, setIsCurrent] = useState(true);
  const [dataPrices, setDataPrices] = useState({
    retailTotalPrice: 0,
    wholesaleTotalPrice: 0
  });

  const { getInventaryQuery } = useInventary({});

  const getInventory = async () => {
    try {
      setIsLoading(true);
      const response = await getInventaryById(inventaryId);
      setInventoryData(response);
      const { retailTotalPrice, wholesaleTotalPrice } = currentSubTotalPrice(response, isCurrent);
      setDataPrices({ retailTotalPrice, wholesaleTotalPrice });
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if(open) {
      getInventory();
    }
  }, [inventaryId, open]);

  const changeCurrent = (current: boolean) => {
    const { retailTotalPrice, wholesaleTotalPrice } = currentSubTotalPrice(inventoryData!, current);
    setIsCurrent(current);
    setDataPrices({ retailTotalPrice, wholesaleTotalPrice });
  }

  const changeStatus = async (id: string, status: InventaryItemStatus) => {
    if (status === InventaryItemStatus.OUT_OF_STOCK) return;
    try {
      await updateInventaryItem(id, { status } as UpdateInventoryItemData)
      const response = await getInventaryById(inventaryId);
      const { retailTotalPrice, wholesaleTotalPrice } = currentSubTotalPrice(response, isCurrent);
      setDataPrices({ retailTotalPrice, wholesaleTotalPrice });
      setInventoryData(response);
      await getInventaryQuery.refetch();
      toast.success("Estado del producto actualizado correctamente");
    } catch (error) {
      console.log(error)
      toast.error("Error al actualizar el estado del producto")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl w-full overflow-y-auto max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
              <DialogTitle>{isLoading ? "Cargando inventario..." : inventoryData?.name}</DialogTitle>
              <DialogDescription className="my-1">{isLoading ? "Cargando fecha..." : format(inventoryData?.createdAt!, "dd/MM/yyyy") + " " + format(inventoryData?.createdAt!, "HH:mm:ss a")}</DialogDescription>
              <Badge className={cn(
                inventoryData?.status === InventoryStatus.PENDING ? "bg-yellow-500/10 border-yellow-300 text-yellow-500" :
                  inventoryData?.status === InventoryStatus.PREPARED ? "bg-green-500/10 border-green-300 text-green-500" :
                    inventoryData?.status === InventoryStatus.SOLD ? "bg-blue-500/10 border-blue-300 text-blue-500" :
                      inventoryData?.status === InventoryStatus.CANCELLED ? "bg-red-500/10 border-red-300 text-red-500" : "bg-gray-500/10 border-gray-300 text-gray-500"
              )}>
                {
                  inventoryData?.status === InventoryStatus.PENDING ? "Pendiente" :
                    inventoryData?.status === InventoryStatus.PREPARED ? "Preparado" :
                      inventoryData?.status === InventoryStatus.SOLD ? "Vendido" :
                        inventoryData?.status === InventoryStatus.CANCELLED ? "Cancelado" : "Desconocido"
                }
              </Badge>
            </div>
            <div className="mr-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => changeCurrent(!isCurrent)}
              >
                {isCurrent ? <CircleCheck className="size-4" /> : <History className="size-4" />}
                {isCurrent ? "Inventario actual" : "Inventario original"}
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="mt-2">

          {/* Información general */}
          <Card className="bg-accent/20 p-4 gap-4">
            <CardHeader className="p-0">
              <CardTitle>
                <div className="flex justify-between items-center gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <ReceiptText className="size-5" />
                      <span className="text-md sm:text-lg font-semibold">Información general</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <UserRound className="size-4" />
                      <span className="text-xs text-muted-foreground">{inventoryData?.user.name}</span>
                    </div>
                  </div>
                  {
                    isLoading ? (
                      <Skeleton className="w-24 h-4" />
                    ) : (
                      <Badge className={cn(
                        inventoryData?.type === InventoryType.SALE
                          ? "bg-green-500/10 border-green-300 text-green-500"
                          : "bg-blue-500/10 border-blue-300 text-blue-500"
                      )}>{inventoryData?.type === InventoryType.SALE ? "Venta" : "Interno"}</Badge>
                    )
                  }
                </div>
              </CardTitle>
            </CardHeader>
            {
              isLoading ? (
                <div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Card className="rounded-lg p-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex justify-center items-center gap-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent">
                        <Boxes className="text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <h3 className="">Productos</h3>
                        <span className="text-xs text-muted-foreground">Cantidad de productos</span>
                      </div>
                    </div>
                    <span className="text-lg sm:text-2xl font-semibold">{currentItems(inventoryData!, isCurrent)}</span>
                  </Card>
                  <Card className="rounded-lg p-3 gap-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex justify-center items-center gap-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent">
                          <CircleDollarSign className="text-muted-foreground" />
                        </div>
                        <div className="flex flex-col">
                          <h3 className="">Total</h3>
                          <span className="text-xs text-muted-foreground">Precios totales</span>
                        </div>
                      </div>
                      {/* {
                        dataPrices.ivaInclude && (
                          <div>
                            <Badge className="bg-yellow-500/10 border-yellow-300 text-yellow-500">IVA Incluido</Badge>
                          </div>
                        )
                      } */}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Al detal</span>
                        <span className="text-lg sm:text-2xl font-semibold">{formatPrice({ price: dataPrices.retailTotalPrice, country: { locale: "en-US", currency: "USD" } })}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">Al mayor</span>
                        <span className="text-lg sm:text-2xl font-semibold">{formatPrice({ price: dataPrices.wholesaleTotalPrice, country: { locale: "en-US", currency: "USD" } })}</span>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            }
          </Card>

          {/* Información de productos */}
          <Card className="bg-accent/20 p-4 mt-6 gap-4">
            <CardHeader className="p-0">
              <CardTitle>
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Boxes className="size-5" />
                    <span className="text-md sm:text-lg font-semibold">Lista de productos</span>
                  </div>
                  <span className="text-muted-foreground"># {inventoryData?.inventaryItems.length}</span>
                </div>
              </CardTitle>
            </CardHeader>
            {
              isLoading ? (
                <div>
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {
                    inventoryData?.inventaryItems.map((item, index) => {
                      const stock = currentStock(item, isCurrent);
                      const measureUnitValue = measureUnit(item);
                      return (
                        <Card key={index} className="rounded-lg p-3 gap-4">
                          <div className="flex justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <div className="flex justify-center items-center gap-2 w-12 h-12 rounded-lg bg-accent">
                                <Package className="text-muted-foreground" />
                              </div>
                              <div className="flex flex-col">

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Badge className={cn('py-0 px-2 text-xs cursor-pointer',
                                      item.status === InventaryItemStatus.AVAILABLE ? "bg-green-500/10 border-green-300 text-green-500" :
                                      item.status === InventaryItemStatus.EXPIRED ? "bg-orange-500/10 border-orange-300 text-orange-500" :
                                      item.status === InventaryItemStatus.CANCELLED ? "bg-red-500/10 border-red-300 text-red-500" :
                                      item.status === InventaryItemStatus.STOP ? "bg-gray-500/10 border-gray-300 text-gray-500" :
                                      item.status === InventaryItemStatus.OUT_OF_STOCK ? "bg-blue-500/10 border-blue-300 text-blue-500" : "")}
                                    >
                                      {
                                        item.status === InventaryItemStatus.AVAILABLE ? "Disponible" :
                                        item.status === InventaryItemStatus.EXPIRED ? "Expirado" :
                                        item.status === InventaryItemStatus.CANCELLED ? "Cancelado" :
                                        item.status === InventaryItemStatus.STOP ? "Detenido" :
                                        item.status === InventaryItemStatus.OUT_OF_STOCK ? "Agotado" :
                                        item.status === InventaryItemStatus.RESERVED ? "Reservado" : ""
                                      }
                                    </Badge>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem disabled={item.status === InventaryItemStatus.AVAILABLE} onClick={() => changeStatus(item.id!, InventaryItemStatus.AVAILABLE)}>Disponible</DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.status === InventaryItemStatus.EXPIRED} onClick={() => changeStatus(item.id!, InventaryItemStatus.EXPIRED)}>Expirado</DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.status === InventaryItemStatus.CANCELLED} onClick={() => changeStatus(item.id!, InventaryItemStatus.CANCELLED)}>Cancelado</DropdownMenuItem>
                                    <DropdownMenuItem disabled={item.status === InventaryItemStatus.STOP} onClick={() => changeStatus(item.id!, InventaryItemStatus.STOP)}>Detenido</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <h3 className="text-sm sm:text-lg font-semibold">{item.product?.name}</h3>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-sm sm:text-lg font-semibold">{stock}</span>
                              <span className="text-xs text-muted-foreground">{measureUnitValue}</span>
                            </div>
                          </div>
                          <div className="flex justify-evenly sm:justify-start items-center gap-6">
                            <div className="flex flex-col items-center sm:items-start">
                              <span className="text-xs text-muted-foreground">Precio al detal</span>
                              <span className="text-xl font-semibold">{formatPrice({ price: item.retailPrice, country: { locale: "en-US", currency: "USD" } })}</span>
                            </div>
                            <div className="flex flex-col items-center sm:items-start">
                              <span className="text-xs text-muted-foreground">Precio al mayor</span>
                              <span className="text-xl font-semibold">{formatPrice({ price: item.wholesalePrice, country: { locale: "en-US", currency: "USD" } })}</span>
                            </div>
                          </div>
                          <div className="flex justify-evenly sm:justify-end border-t pt-4">
                            <div className="flex items-center gap-6">
                              <div className="flex flex-col items-center sm:items-start">
                                <span className="text-xs text-muted-foreground">Total al detal</span>
                                <span className="text-xl font-semibold">{formatPrice({ price: currentTotalItemPrice({ inventoryItem: item, isCurrent, type: "retail" }), country: { locale: "en-US", currency: "USD" } })}</span>
                              </div>
                              <div className="flex flex-col items-center sm:items-start">
                                <span className="text-xs text-muted-foreground">Total al mayor</span>
                                <span className="text-xl font-semibold">{formatPrice({ price: currentTotalItemPrice({ inventoryItem: item, isCurrent, type: "wholesale" }), country: { locale: "en-US", currency: "USD" } })}</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })
                  }
                </div>
              )
            }
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DetailsInventaryDialog;
