"use client";

import { useEffect, useState } from "react";
import { Box, Boxes, CalendarIcon, Download, Eye, MapPin, Phone, Printer, ReceiptText, X, CheckCircle2, BadgeCheck } from "lucide-react";
import { fmtVET } from '@/utils/timezone';
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { AvaliableProduct, SaleDetailStatus, SaleFetch, SaleStatus } from "@/types";

import { calculateExemptProducts, calculateSubtotal, calculateTaxableProducts, calculateTaxAmount } from "@/lib/sales";
import { formatPrice } from "@/lib/format-price";
import { getAvailableProductById } from "@/actions/products.action";
import { detailPrice } from "@/lib/price";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface SaleSummaryDialogProps {
  showSummary?: boolean;
  setShowSummary?: (showSummary: boolean) => void;
  sale: SaleFetch;
  inline?: boolean;
  onClose?: () => void;
}

const SaleSummaryDialog = ({ showSummary, setShowSummary, sale, inline, onClose }: SaleSummaryDialogProps) => {

  // const [saleType, setSaleType] = useState<"retail" | "wholesale">("retail");
  const [availableProducts, setAvailableProducts] = useState<AvaliableProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false)

  const getAvailableProduct = async (id: string) => {
    setIsLoading(true);
    try {
      const product = await getAvailableProductById(id);
      return product;
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (sale && sale.details.length > 0) {
        try {
          const productPromises = sale.details.map(async (detail) => {
            return await getAvailableProduct(detail.inventaryItems[0].productId);
          });

          const products = await Promise.all(productPromises);
          setAvailableProducts(products.filter(Boolean) as AvaliableProduct[]);
        } catch (error) {
          console.error('Error fetching products:', error);
          toast.error('Error al cargar los productos de la venta');
        }
      }
    };

    fetchProducts();
  }, [sale]);

  const exemptAmount = calculateExemptProducts(sale, availableProducts);
  const taxableAmount = calculateTaxableProducts(sale, availableProducts);
  const taxAmount = calculateTaxAmount(sale, availableProducts);
  const totalMount = exemptAmount + taxableAmount + taxAmount;
  const total = sale.discount > 0 ? totalMount + sale.discount : totalMount;

  const handlePrintPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      // Create a new window for printing
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Resumen de Venta - ${sale.id?.split("-")[4] || "Nueva Venta"}</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  h1 { margin-bottom: 20px; }
                  h2 { margin-bottom: 12px; }
                  p { margin: 6px 0; }
                  td { font-size: 14px; }
                  hr { margin: 8px 0; }
                  .text-sm { font-size: 10px !important; }
                  .quantity { min-width: 80px; }
                  .header { text-align: center; margin-bottom: 30px; }
                  .summary-info { margin-bottom: 20px; }
                  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                  .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                  .items-table th { background-color: #f2f2f2; }
                  .totals { text-align: right; margin-top: 20px; }
                  .total-line { margin: 5px 0; }
                  .final-total { font-weight: bold; font-size: 1.2em; display: flex; justify-content: end; }
                  .total { max-width: max-content; margin-top: 12px; padding-top: 12px; border-top: 1px solid #ddd; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>Resumen de Venta</h1>
                  <h2>TuLojita</h2>
                  <p>Factura: ${sale.id?.split("-")[4] || "Nueva Venta"}</p>
                  <p>Fecha: ${fmtVET(sale.createdAt!, "dd/MM/yyyy hh:mm:ss a")}</p>
                  ${sale.client ? `
                  <hr />
                  <div>
                  <h3>Cliente</h3>
                  <p>Nombre: ${sale.client.name}</p>
                  ${sale.client.identity ? `<p>Identidad: ${Number(sale.client.identity).toLocaleString()}</p>` : ''}
                  ${sale.client.phone ? `<p>Telefono: ${sale.client.phone}</p>` : ''}
                  ${sale.client.address ? `<p>Direccion: ${sale.client.address}</p>` : ''}
                  ${sale.deliveryDate ? `<p>Entrega: ${fmtVET(sale.deliveryDate!, "dd/MM/yyyy hh:mm:ss a")}</p>` : ''}
                  </div>
                  <hr />
                  ` : ''
          }
                </div>
                
                <div class="summary-info">
                  <p><strong>Estado:</strong> ${sale.status === SaleStatus.SOLD ? "COMPLETADA" : "RESERVADA"}</p>
                  <p><strong>Total de artículos:</strong> ${sale.details.length}</p>
                </div>
  
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th class="quantity">UND</th>
                      <th>Precio</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${sale.details.map((detail) => {
            const isRetailPrice = detail.retailPrice > 0;
            const productWithIva = detail.ivaPercentage > 0 ? true : false;
            return `
                        <tr>
                          <td>${detail.inventaryItems[0].product?.name} ${!productWithIva && detail.sale?.enableIva ? "(E)" : ""}</td>
                          <td class="quantity">
                            ${detail.measureUnitValue > 0
                ? `${detail.measureUnitValue} <span class="text-sm">${detail.inventaryItems[0].product?.inputProduct?.measureUnit || ""}</span>`
                : `${detail.quantity} <span class="text-sm">UND</span>`
              }
                          </td>
                          <td>${formatPrice({ price: isRetailPrice ? detail.retailPrice : detail.wholesalePrice, country: { currency: "USD", locale: "en-US" } })}</td>
                          <td>${formatPrice({ price: detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice), country: { currency: "USD", locale: "en-US" } })}</td>
                        </tr>
                      `
          }).join("")}
                  </tbody>
                </table>
  
                <div class="totals">
                  ${!sale.enableIva ?
            `
                      <div class="total-line final-total">
                        Subtotal: ${formatPrice({ price: calculateSubtotal(sale, availableProducts) || 0, country: { currency: "USD", locale: "en-US" } })}
                      </div>
                    ` : ""
          }
          <div class="total-line final-total">
                        Recargo: ${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })}
                      </div>
                  ${sale.enableIva ?
            `
                      <div class="total-line final-total">
                        Exento: ${formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })}
                      </div>
                      <div class="total-line final-total">
                        BI G: ${formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })}
                      </div>
                      <div class="total-line final-total">
                        IVA G (${sale.ivaPercentage}%): ${formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })}
                      </div>
                    ` : ""
          }
                  <div class="total-line final-total">
                    <div class="total">
                      Total: ${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) + sale.discount, country: { currency: "USD", locale: "en-US" } })}
                    </div>
                  </div>
                </div>
              </body>
            </html>
          `)
        printWindow.document.close()
        printWindow.print()
      }
    } catch (error) {
      console.log("Error generating PDF:", error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setIsGeneratingExcel(true)
    try {
      // Create CSV content with proper formatting for Excel
      const headers = ["Producto", "UND", "UND. M", "Precio", "Subtotal"]

      // Use semicolon as separator and add BOM for proper Excel compatibility
      const csvRows = [
        headers.join(";"),
        ...sale.details.map((detail) => {
          const isRetailPrice = detail.retailPrice > 0;
          const productWithIva = detail.ivaPercentage > 0 ? true : false;
          return [
            `"${detail.inventaryItems[0].product?.name.replace(/"/g, '""')}" ${!productWithIva && sale.enableIva ? "(E)" : ""}`, // Escape quotes properly
            detail.quantity,
            `${detail.measureUnitValue} ${detail.inventaryItems[0].product?.inputProduct?.measureUnit || ""}`,
            formatPrice({ price: isRetailPrice ? detail.retailPrice : detail.wholesalePrice, country: { currency: "USD", locale: "en-US" } }),
            formatPrice({ price: detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice), country: { currency: "USD", locale: "en-US" } }),
          ].join(";")
        },
        ),

        !sale.enableIva ?
          `""
              ;;;"Subtotal";${formatPrice({ price: calculateSubtotal(sale, availableProducts) || 0, country: { currency: "USD", locale: "en-US" } })};
              ;;;"Recargo";${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })};
              ;;;"Total";${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) + sale.discount, country: { currency: "USD", locale: "en-US" } })};
            `
          : "",

        sale.enableIva ?
          `;;;"Exento";${formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"BI G";${formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"IVA (${sale.ivaPercentage}%):";${formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"Recargo";${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"Total";${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) + sale.discount, country: { currency: "USD", locale: "en-US" } })};
            `
          : "",
      ]

      // Add BOM for UTF-8 encoding recognition in Excel
      const BOM = "\uFEFF"
      const csvContent = BOM + csvRows.join("\r\n")

      // Create and download file with proper MIME type
      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `resumen-venta-${sale?.id || "nueva"}-${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url) // Clean up memory
    } catch (error) {
      console.log("Error generating Excel:", error)
    } finally {
      setIsGeneratingExcel(false)
    }
  }

  const bodyContent = (
    <div className="space-y-4">
      {/* 1. Status Badge & Header */}
      <div className="flex flex-col items-center text-center pb-2 pt-1">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md animate-pulse" />
          <div className="relative rounded-full bg-emerald-500/10 p-3 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>

        <h3 className="mt-3 text-base font-bold tracking-tight text-foreground">
          TuLojita
        </h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          ¡Venta procesada con éxito!
        </p>

        <div className="mt-2.5 flex flex-wrap gap-1.5 justify-center">
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {sale.status === SaleStatus.SOLD ? "Entregado" : "Reservado"}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted/60 border border-muted-foreground/10">
            ID: {sale.id?.split("-")[4] || sale.id?.substring(0, 8)}
          </span>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] text-muted-foreground bg-muted/60 border border-muted-foreground/10">
            Fecha: {fmtVET(sale.createdAt!, "dd/MM/yyyy")}
          </span>
        </div>
      </div>

      {/* 2. Client Info Panel */}
      {sale.client && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
          <div className="font-semibold text-foreground flex items-center gap-1.5 mb-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
            Cliente
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-foreground">{sale.client.name}</span>
              {sale.client.identity && <span>C.I. {Number(sale.client.identity).toLocaleString()}</span>}
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              {sale.client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 shrink-0" /> {sale.client.phone}
                </span>
              )}
              {sale.client.address && (
                <span className="flex items-center gap-1 max-w-[150px] truncate" title={sale.client.address}>
                  <MapPin className="h-3 w-3 shrink-0" /> {sale.client.address}
                </span>
              )}
            </div>
          </div>
          {sale.deliveryDate && (
            <div className="mt-2 pt-2 border-t border-dashed border-border/60 flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Entrega: {fmtVET(sale.deliveryDate!, "dd/MM/yyyy hh:mm a")}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Line Items List */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase flex justify-between px-1">
          <span>Detalle de Compra</span>
          <span>Monto</span>
        </div>
        <div className="divide-y divide-border/60 max-h-[30vh] overflow-y-auto pr-1">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-7 w-7 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-2.5 w-12" />
                  </div>
                </div>
                <Skeleton className="h-3.5 w-10" />
              </div>
            ))
          ) : sale.details.length > 0 ? (
            sale.details.map((detail) => {
              const price = detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice;
              const isCancelled = detail.status === SaleDetailStatus.CANCELLED;
              const prodName = detail.inventaryItems[0].product?.name || "Producto";
              const isExempt = detail?.sale?.enableIva && detail?.ivaPercentage === 0;

              return (
                <div key={detail.id} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-blue-950/50 text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30">
                      {detail.quantity}x
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className={`font-medium text-foreground truncate ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                        {prodName} {isExempt && <span className="inline-block text-[9px] bg-muted px-1.5 py-0.2 rounded font-normal text-muted-foreground ml-1">E</span>}
                      </span>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {detail.measureUnitValue ? `${detail.measureUnitValue} u.m. · ` : ''}
                        P. Unit: {formatPrice({ price, country: { currency: "USD", locale: "en-US" } })}
                      </span>
                    </div>
                  </div>
                  <span className={`font-semibold text-foreground shrink-0 ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                    {formatPrice({ price: detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice), country: { currency: "USD", locale: "en-US" } })}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="py-4 text-center text-xs text-muted-foreground">
              No hay detalles disponibles
            </div>
          )}
        </div>
      </div>

      {/* 4. Totals Breakdown Card */}
      <div className="rounded-xl border border-border/80 bg-muted/40 dark:bg-muted/10 p-3 space-y-1.5">
        {isLoading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-5 w-full mt-2" />
          </div>
        ) : (
          <>
            {!sale.enableIva && (
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice({ price: calculateSubtotal(sale, availableProducts) || 0, country: { currency: "USD", locale: "en-US" } })}</span>
              </div>
            )}

            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Recargo</span>
              <span className="font-medium text-foreground">+{formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })}</span>
            </div>

            {sale.enableIva && (
              <div className="space-y-1 pt-1 border-t border-border/30">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Monto Exento</span>
                  <span>{formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>Base Imponible</span>
                  <span>{formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>IVA ({sale.ivaPercentage || 0}%)</span>
                  <span>{formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-border/80 font-bold">
              <span className="text-xs text-foreground">Total</span>
              <span className="text-base text-primary tracking-tight">
                {formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) + sale.discount, country: { currency: "USD", locale: "en-US" } })}
              </span>
            </div>
          </>
        )}
      </div>

      {/* 5. Printable / Export Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 font-medium rounded-lg h-8 text-xs cursor-pointer"
          variant="default"
          size="sm"
          onClick={handlePrintPDF}
          disabled={isGeneratingPDF || isLoading}
        >
          <Printer className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {isGeneratingPDF ? "Imprimiendo..." : "Imprimir PDF"}
        </Button>
        <Button
          className="w-full border-border hover:bg-muted transition-all duration-200 font-medium rounded-lg h-8 text-xs cursor-pointer"
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={isGeneratingExcel || isLoading}
        >
          <Download className="h-3.5 w-3.5 mr-1.5 shrink-0" />
          {isGeneratingExcel ? "Exportando..." : "Excel"}
        </Button>

        {sale.client && (
          <Popover>
            <PopoverTrigger className="col-span-2" asChild>
              <Button className="w-full border-border text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all duration-200 h-8 text-xs rounded-lg cursor-pointer" variant="outline" size="sm" disabled={isLoading}>
                <Eye className="h-3.5 w-3.5 mr-1.5 shrink-0" />
                <span>Ver Datos de Cliente</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[260px] p-3 shadow-xl border-border rounded-xl z-50" side="top">
              <div className="space-y-2.5">
                <div className="pb-1.5 border-b border-border/50">
                  <h4 className="font-bold text-xs text-foreground">{sale.client?.name}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{sale.client?.identity ? `CI: ${Number(sale.client.identity).toLocaleString()}` : "Sin Identidad"}</p>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0 text-blue-500" />
                    <span>{sale.client?.phone || "Teléfono no registrado"}</span>
                  </div>
                  <div className="flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0 text-red-500 mt-0.5" />
                    <span className="leading-tight">{sale.client?.address || "Dirección no registrada"}</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="flex flex-col gap-3 p-4 md:p-5 bg-card rounded-lg border shadow-sm">
        <div className="flex justify-between items-center pb-2 border-b">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <ReceiptText className="h-4 w-4 text-blue-500" />
              Resumen de la venta
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {sale.details.length} {sale.details.length === 1 ? 'producto' : 'productos'}
            </span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-muted cursor-pointer" onClick={onClose}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        {bodyContent}
      </div>
    );
  }

  return (
    <Dialog open={showSummary} onOpenChange={setShowSummary}>
      <DialogContent className="sm:max-w-md w-full max-h-[90vh] flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <ReceiptText className="h-4 w-4 text-blue-500" />
            Resumen de la venta
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 py-1">
          {bodyContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SaleSummaryDialog
