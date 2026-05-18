"use client";

import { BaggageClaim, Check, ChevronDown, ChevronUp, ListX, Loader2, ShoppingCart, UserPlus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import ShowPrice from "@/components/common/show-price";
import SaleTable from "./sale-table";

import { calculateCreateSaleSubtotal } from "@/lib/sales";
import { formatPrice } from "@/lib/format-price";
import { AvaliableProduct, ClientFetch, CreateClient, CreateSaleData, CreateSaleDetailData, SaleStatus, Setting } from "@/types";
import SaleCardDetail from "./sale-card-detail";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClientAction, getClientsAction } from "@/actions/client.action";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Combobox } from "@/components/ui/combo-box";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateTimePicker } from "@/components/ui/datetime-picker";

interface CartSalesProps {
  availableProducts: AvaliableProduct[]
  handleProcessSale: (status: SaleStatus, clientId?: string) => Promise<void>
  sale: Omit<CreateSaleData, "id">
  setSale: (sale: Omit<CreateSaleData, "id">) => void
  removeAllSaleDetails: () => void
  updateSaleDetail: (index: number, updates: Partial<CreateSaleDetailData>) => void
  removeSaleDetail: (index: number) => void
  setting: Setting
  settingLoading: boolean
  submitting: boolean
  rate: number
  exemptAmount: number
  taxableAmount: number
  taxAmount: number
  total: number
  totalMount: number
}

const CartSales = ({ availableProducts, sale, setSale, removeAllSaleDetails, updateSaleDetail, removeSaleDetail, setting, settingLoading, submitting, rate, exemptAmount, taxableAmount, taxAmount, total, totalMount, handleProcessSale }: CartSalesProps) => {

  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [clients, setClients] = useState<ClientFetch[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);

  const [loadingCreateClient, setLoadingCreateClient] = useState(false);
  const [client, setClient] = useState<CreateClient>({
    name: "",
    phone: "",
    address: "",
    identity: ""
  });

  const [expanded, setExpanded] = useState(false);
  const [showMobileBreakdown, setShowMobileBreakdown] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClient({
      ...client,
      [e.target.name]: e.target.value
    });
  }

  const getAllClients = async () => {
    try {
      setLoadingClients(true);
      const clients = await getClientsAction();
      setClients(clients);
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener los clientes, comuniquese con el administrador");
    } finally {
      setLoadingClients(false);
    }
  }

  useEffect(() => {
    getAllClients();
  }, [])

  const handleDiscountChange = (value: number | undefined) => {
    const newValue = value === undefined ? 0 : value;
    if (newValue >= 0 && newValue <= totalMount) {
      setSale({ ...sale, discount: newValue });
    }
  };

  const handleCreateClient = async (client: CreateClient) => {
    try {
      setLoadingCreateClient(true);
      const newClient = await createClientAction(client);
      setClient({
        name: "",
        phone: "",
        address: "",
        identity: ""
      });
      setExpanded(false);
      await getAllClients();
      return newClient;
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      setLoadingCreateClient(false);
    }
  }

  const handleReserveSale = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (client?.name) {
      if (selectedClient) {
        toast.error("No puedes crear un nuevo cliente si ya tienes un cliente seleccionado");
        return;
      }
      try {
        const newClient = await handleCreateClient(client);
        await handleProcessSale(SaleStatus.RESERVED, newClient.id!);
        setOpenClientDialog(false);
        return;
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data.error);
          return;
        }
        if (error instanceof Error) {
          toast.error(error.message);
          return;
        }
        toast.error("Error al crear el cliente, comuniquese con el administrador");
      }
    }

    if (!selectedClient) {
      toast.error("Debe seleccionar un cliente o crear uno nuevo");
      return;
    }

    await handleProcessSale(SaleStatus.RESERVED, selectedClient);
    setSelectedClient("");
    setOpenClientDialog(false);
  };

  const displayTotal = setting.enableIva
    ? total
    : calculateCreateSaleSubtotal(sale, availableProducts) - (sale.discount || 0);

  const mobileCheckoutBar = (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.1)]">
      <div className="mx-auto w-full max-w-lg px-4 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))] space-y-2.5">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-0.5 text-[11px] text-muted-foreground"
          onClick={() => setShowMobileBreakdown((v) => !v)}
        >
          {showMobileBreakdown ? (
            <>Ocultar <ChevronDown className="size-3" /></>
          ) : (
            <>Desglose <ChevronUp className="size-3" /></>
          )}
        </button>

        {showMobileBreakdown && (
          <div className="space-y-1 text-[11px] max-h-32 overflow-y-auto">
            {!settingLoading && !setting.enableIva && (
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-medium">
                  {formatPrice({ price: calculateCreateSaleSubtotal(sale, availableProducts), country: { currency: "USD", locale: "en-US" } })}
                </span>
              </div>
            )}
            {!settingLoading && setting.enableIva && (
              <>
                <div className="flex justify-between">
                  <span>Exento</span>
                  <span className="font-medium">{formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
                <div className="flex justify-between">
                  <span>BI G</span>
                  <span className="font-medium">{formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({setting.iva}%)</span>
                  <span className="font-medium">{formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span>Descuento</span>
              <span>{formatPrice({ price: sale.discount || 0, country: { currency: "USD", locale: "en-US" } })}</span>
            </div>
          </div>
        )}

        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-muted-foreground shrink-0">Total a cobrar</span>
          <div className="text-right min-w-0 flex-1 overflow-hidden">
            {settingLoading ? (
              <Skeleton className="w-28 h-7 ml-auto" />
            ) : (
              <>
                <p className="text-lg font-bold tabular-nums whitespace-nowrap truncate">
                  {formatPrice({ price: displayTotal, country: { currency: "USD", locale: "en-US" } })}
                </p>
                {(setting.enableRate || setting.rateCustom > 0) && (
                  <ShowPrice
                    price={displayTotal}
                    rate={rate}
                    settingData={setting}
                    className="block text-xs text-right whitespace-nowrap truncate mt-0.5"
                  />
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">$</span>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="h-9 w-full pl-7 text-sm"
            placeholder="Descuento"
            value={sale.discount || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (isNaN(value)) {
                handleDiscountChange(0);
                return;
              }
              if (value > totalMount) {
                toast.error("El descuento no puede ser mayor que el total");
                return;
              }
              handleDiscountChange(value);
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            disabled={sale.details.length === 0 || submitting}
            onClick={() => {
              setSale({ ...sale, deliveryDate: undefined });
              setOpenClientDialog(true);
            }}
            className="h-10 w-full text-sm"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <BaggageClaim className="size-4 mr-1.5 shrink-0" />
                Reservar
              </>
            )}
          </Button>
          <Button
            onClick={() => handleProcessSale(SaleStatus.SOLD)}
            disabled={sale.details.length === 0 || submitting}
            className="h-10 w-full text-sm bg-blue-500 hover:bg-blue-600 text-white"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <ShoppingCart className="size-4 mr-1.5 shrink-0" />
                Vender
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Dialog open={openClientDialog} onOpenChange={setOpenClientDialog}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[min(90dvh,700px)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reservar venta</DialogTitle>
            <DialogDescription>
              Selecciona un cliente o crea uno nuevo
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label>Fecha de entrega</Label>
            <DateTimePicker
  date={sale.deliveryDate}
  onDateChange={(date) => setSale({ ...sale, deliveryDate: date })}
  placeholder="Seleccionar fecha de entrega"
/>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Cliente</Label>
            <div className="flex gap-2 items-center">
              <Combobox
                data={clients.map((client) => ({
                  label: client.name,
                  value: client.id!,
                  identity: client.identity,
                }))}
                onValueChange={(value) => {
                  setSelectedClient(value);
                  setSale({ ...sale, clientId: value });
                }}
                defaultValue={selectedClient || ""}
                placeholder="Buscar cliente..."
                inputLabel="Buscar cliente por nombre"
                notFoundLabel="No se encontraron clientes disponibles"
                disabled={loadingClients || clients.length === 0}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSelectedClient("");
                  setSale({ ...sale, clientId: "" });
                }}
              >
                <X />
              </Button>
            </div>
          </div>
          <div className="">
            <div
              className={cn("flex justify-between items-center gap-4 p-4 border rounded-lg cursor-pointer hover:bg-blue-500 transition-all duration-200", expanded ? "bg-blue-500" : "")}
              onClick={() => {
                if (!expanded) {
                  setClient({
                    name: "",
                    phone: "",
                    address: "",
                    identity: ""
                  })
                }
                setExpanded(!expanded)
              }}
            >
              <h3>Crear nuevo cliente</h3>
              <UserPlus className="size-5" />
            </div>
            <form
              onSubmit={handleReserveSale}
            >
              <div className={cn("overflow-hidden transition-all duration-200 flex flex-col gap-4", expanded ? "visible h-auto p-4" : "invisible h-0 p-0")}>
                <div className="flex flex-col gap-2">
                  <Label>Identidad</Label>
                  <Input
                    type="number"
                    placeholder="Identidad del cliente"
                    name="identity"
                    value={client.identity}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre</Label>
                  <Input
                    type="text"
                    placeholder="Nombre del cliente"
                    name="name"
                    value={client.name}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Teléfono</Label>
                  <Input
                    type="tel"
                    placeholder="Teléfono del cliente"
                    name="phone"
                    value={client.phone}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Dirección</Label>
                  <Input
                    type="text"
                    placeholder="Dirección del cliente"
                    name="address"
                    value={client.address}
                    onChange={(e) => handleChange(e)}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="submit"
                  disabled={loadingCreateClient || (!selectedClient && client.name === "")}
                  className="w-full bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-white"
                >
                  {
                    loadingCreateClient ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Confirmando reserva
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar reserva
                      </div>
                    )
                  }
                </Button>
              </div>
            </form>
          </div>

        </DialogContent>
      </Dialog>
      <div className="border rounded-lg overflow-visible md:overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2 md:p-4 md:flex-col md:items-stretch">
          <div className="flex items-baseline gap-2 min-w-0 md:block">
            <h2 className="text-sm font-semibold md:text-lg">Carrito</h2>
            <span className="text-[11px] text-muted-foreground md:text-sm">
              {sale.details.length} {sale.details.length === 1 ? 'ítem' : 'ítems'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={removeAllSaleDetails}
            disabled={sale.details.length === 0}
            className="h-7 px-2 text-xs shrink-0 md:h-9 cursor-pointer"
          >
            <ListX className="h-3.5 w-3.5 md:h-4 md:w-4 md:mr-1" />
            Vaciar
          </Button>
        </div>

        {sale.details.length === 0 ? (
          <div className="py-6 px-4 text-center text-muted-foreground md:py-8">
            <p className="text-sm">Carrito vacío</p>
            <p className="text-xs mt-0.5">Busca y agrega productos</p>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto hidden md:block">
              <SaleTable
                availableProducts={availableProducts}
                sale={sale}
                updateSaleDetail={updateSaleDetail}
                removeSaleDetail={removeSaleDetail}
                enableIva={!settingLoading ? setting.enableIva : false}
              />
            </div>
            <div className="block md:hidden pb-44">
              <SaleCardDetail
                availableProducts={availableProducts}
                sale={sale}
                updateSaleDetail={updateSaleDetail}
                removeSaleDetail={removeSaleDetail}
                enableIva={!settingLoading ? setting.enableIva : false}
              />
            </div>


            <div className="hidden md:block border-t p-4">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex flex-col xs:items-end">
                  <div className="flex flex-col gap-2">
                    <Label>Descuento</Label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="sm:max-w-[120px] w-full pl-6"
                        placeholder="32.5"
                        value={sale.discount || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (isNaN(value)) {
                            handleDiscountChange(0);
                            return;
                          }
                          if (value > totalMount) {
                            toast.error("El descuento no puede ser mayor que el total");
                            return;
                          }
                          handleDiscountChange(value);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="sm:max-w-md sm:ml-auto space-y-2">
                  {
                    !settingLoading && !setting.enableIva && (
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <div className="flex flex-col items-end">
                          <div className="text-muted-foreground">
                            <span className="text-accent-foreground font-medium">
                              {formatPrice({ price: calculateCreateSaleSubtotal(sale, availableProducts), country: { currency: "USD", locale: "en-US" } })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  {
                    !settingLoading && setting.enableIva && (
                      <>
                        <div className="flex justify-between">
                          <span>Exento</span>
                          <div className="flex flex-col items-end">
                            <div className="text-muted-foreground">
                              <span className="text-accent-foreground font-medium">
                                {formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>BI G</span>
                          <div className="flex flex-col items-end">
                            <div className="text-muted-foreground">
                              <span className="text-accent-foreground font-medium">
                                {formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA ({setting.iva}%)</span>
                          <span>{
                            formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })
                          }</span>
                        </div>
                      </>
                    )
                  }

                  <div className="flex justify-between gap-2 border-t pt-2">
                    <span>Descuento</span>
                    <div className="flex gap-4 items-center">
                      <span>{formatPrice({
                        price: sale.discount || 0,
                        country: { currency: "USD", locale: "en-US" }
                      })}</span>
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <div className="flex gap-4 items-center">
                      {
                        settingLoading ? (
                          <Skeleton className="w-20 h-5" />
                        ) : (
                          <span>{formatPrice({
                            price: setting.enableIva ? total : calculateCreateSaleSubtotal(sale, availableProducts) - (sale.discount || 0),
                            country: { currency: "USD", locale: "en-US" }
                          })}</span>
                        )
                      }
                      {
                        (setting.enableRate || setting.rateCustom > 0) && (
                          <Separator orientation="vertical" />
                        )
                      }
                      {
                        settingLoading ? (
                          <Skeleton className="w-20 h-5" />
                        ) : (
                          (setting.enableRate || setting.rateCustom > 0) && (
                            <ShowPrice
                              price={setting.enableIva ? total : calculateCreateSaleSubtotal(sale, availableProducts) - (sale.discount || 0)}
                              rate={rate}
                              settingData={setting}
                              className="text-lg"
                            />
                          )
                        )
                      }
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex sm:justify-end gap-2 sm:gap-4 mt-6">
                <Button
                  variant="outline"
                  disabled={sale.details.length === 0}
                  onClick={() => {
                    setSale({ ...sale, deliveryDate: undefined });
                    setOpenClientDialog(true);
                    // handleProcessSale(SaleStatus.RESERVED)
                  }}
                  className="flex-1 sm:flex-none"
                >
                  {
                    submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reservando venta...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <BaggageClaim className="size-4" />
                        Reservar venta
                      </div>
                    )
                  }
                </Button>
                <Button
                  onClick={() => handleProcessSale(SaleStatus.SOLD)}
                  disabled={sale.details.length === 0}
                  className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                >
                  {
                    submitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando venta...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="size-4" />
                        Procesar venta
                      </div>
                    )
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {mounted && sale.details.length > 0 && createPortal(mobileCheckoutBar, document.body)}
    </>
  );
};

export default CartSales;
