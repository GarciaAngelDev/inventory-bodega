"use client";

import { useEffect, useState } from "react";
import { Box, Boxes, CalendarIcon, Download, Eye, MapPin, Phone, Printer, ReceiptText } from "lucide-react";
import { format } from "date-fns";
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
  showSummary: boolean;
  setShowSummary: (showSummary: boolean) => void;
  sale: SaleFetch;
}

const SaleSummaryDialog = ({ showSummary, setShowSummary, sale }: SaleSummaryDialogProps) => {

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
  const total = sale.discount > 0 ? totalMount - sale.discount : totalMount;

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
                  <h2>Panadería Isabela</h2>
                  <p>Factura: ${sale.id?.split("-")[4] || "Nueva Venta"}</p>
                  <p>Fecha: ${format(sale.createdAt!, "dd/MM/yyyy hh:mm:ss a")}</p>
                  ${sale.client ? `
                  <hr />
                  <div>
                  <h3>Cliente</h3>
                  <p>Nombre: ${sale.client.name}</p>
                  ${sale.client.identity ? `<p>Identidad: ${Number(sale.client.identity).toLocaleString()}</p>` : ''}
                  ${sale.client.phone ? `<p>Telefono: ${sale.client.phone}</p>` : ''}
                  ${sale.client.address ? `<p>Direccion: ${sale.client.address}</p>` : ''}
                  ${sale.deliveryDate ? `<p>Entrega: ${format(sale.deliveryDate!, "dd/MM/yyyy hh:mm:ss a")}</p>` : ''}
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
                            ${
                              detail.measureUnitValue > 0
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
                        Descuento: ${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })}
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
                      Total: ${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) - sale.discount, country: { currency: "USD", locale: "en-US" } })}
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
              ;;;"Descuento";${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })};
              ;;;"Total";${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) - sale.discount, country: { currency: "USD", locale: "en-US" } })};
            `
          : "",

        sale.enableIva ?
          `;;;"Exento";${formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"BI G";${formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"IVA (${sale.ivaPercentage}%):";${formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"Descuento";${formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })};
            ;;;"Total";${formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) - sale.discount, country: { currency: "USD", locale: "en-US" } })};
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

  return (
    <Dialog open={showSummary} onOpenChange={setShowSummary}>
      <DialogContent className="sm:max-w-3xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText />
            Resumen de la venta
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex items-center gap-2">
              {sale.details.length > 1 ? <Boxes className="size-4" /> : <Box className="size-4" />} {sale.details.length || 0} {sale.details.length > 1 ? "productos" : "producto"}
            </div>
          </DialogDescription>
        </DialogHeader>

        <header>
          <h2 className="text-xl font-bold text-center">Panadería Isabela</h2>
          <div className="flex flex-col justify-center items-center text-muted-foreground text-sm">
            {
              isLoading ? (
                <>
                  <Skeleton className="h-3 w-40 mt-2" />
                  <Skeleton className="h-3 w-40 mt-2" />
                </>
              ) : (
                <>
                  <span>Fecha: {format(sale.createdAt!, "dd/MM/yyyy hh:mm:ss a")}</span>
                  <span>ID: {sale.id?.split("-")[4]}</span>
                  {
                    sale.client && (
                      <div className="flex flex-col items-center">
                        <Separator className="my-2 max-w-[240px]" />
                        <span>Cliente: {sale.client?.name} {sale.client?.identity && ' - ' + Number(sale.client.identity).toLocaleString()}</span>
                        {
                          sale.deliveryDate && (
                            <>
                              <Separator className="my-2 max-w-[240px]" />
                              <span>Fecha de entrega: {format(sale.deliveryDate!, "dd/MM/yyyy hh:mm a")}</span>
                            </>
                          )
                        }
                      </div>
                    )
                  }
                </>
              )
            }
          </div>
        </header>

        <div className="w-full overflow-hidden rounded-md">
          <div className="w-full overflow-auto max-h-[50vh]">
            <Table className="min-w-[600px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>UND</TableHead>
                  <TableHead>UND. M</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {
                  isLoading ? (
                    Array.from({ length: 2 }).map((_, index) => (
                      <TableRow key={index}>
                        {
                          Array.from({ length: 5 }).map((_, index) => (
                            <TableCell key={index}>
                              <Skeleton className="h-6 w-full" />
                            </TableCell>
                          ))
                        }
                      </TableRow>
                    ))
                  ) : (
                    sale.details.length > 0 ? (
                      sale.details.map((detail) => {
                        const price = detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice;
                        return (
                          <TableRow key={detail.id}>
                            <TableCell>{detail.inventaryItems[0].product?.name} {detail?.sale?.enableIva && detail?.ivaPercentage === 0 ? "(E)" : ""}</TableCell>
                            <TableCell>{detail.quantity}</TableCell>
                            <TableCell>{detail.measureUnitValue}</TableCell>
                            <TableCell>{formatPrice({ price, country: { currency: "USD", locale: "en-US" } })}</TableCell>
                            <TableCell className={detail.status === SaleDetailStatus.CANCELLED ? "line-through text-muted-foreground" : ""}>{formatPrice({ price: detailPrice(detail.inventaryItems[0].product!, detail, detail.isRetailPrice), country: { currency: "USD", locale: "en-US" } })}</TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No hay detalles
                        </TableCell>
                      </TableRow>
                    )
                  )
                }
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-4 border-t mt-auto">

          <div className="flex flex-col md:flex-row justify-between md:justify-start gap-2 items-end flex-1">
            <Button className="w-full md:w-auto" variant="outline" onClick={handlePrintPDF} disabled={isGeneratingPDF || isLoading}>
              <Printer className="h-4 w-4 mr-2" />
              {isGeneratingPDF ? "Generando PDF..." : "Imprimir PDF"}
            </Button>
            <Button className="w-full md:w-auto" variant="outline" onClick={handleExportExcel} disabled={isGeneratingExcel || isLoading}>
              <Download className="h-4 w-4 mr-2" />
              {isGeneratingExcel ? "Generando Excel..." : "Exportar Excel"}
            </Button>
            {
              sale.client && (
                <Popover>
                  <PopoverTrigger className="w-full md:w-auto" asChild>
                    <Button className="w-full" variant="outline" disabled={isLoading}>
                      <Eye className="h-4 w-4 mr-2" />
                      <span>Mostrar cliente</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="z-50">
                    <div className="flex flex-col gap-2">
                      <div>
                        <h3 className="font-bold">{sale.client?.name}</h3>
                        <p className="text-muted-foreground flex-1 text-sm">{sale.client?.identity ? Number(sale.client.identity).toLocaleString() : "Sin identidad"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="size-4" />
                        <span className="text-muted-foreground flex-1 text-sm">{sale.client?.phone || "Sin telefono"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4" />
                        <span className="text-muted-foreground flex-1 text-sm">{sale.client?.address || "Sin direccion"}</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

              )
            }
          </div>

          <div className="flex flex-col items-end">
            {
              isLoading ? (
                <Skeleton className="h-5 w-20 my-2" />
              ) : (
                !sale.enableIva && (
                  <div className="flex items-center gap-2 border-b py-2">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="text-muted-foreground">{formatPrice({ price: calculateSubtotal(sale, availableProducts) || 0, country: { currency: "USD", locale: "en-US" } })}</span>
                  </div>
                )
              )
            }
            <div className="flex items-center gap-2 border-b py-2">
              <span className="text-muted-foreground">Descuento:</span>
              <span className="text-muted-foreground">{formatPrice({ price: sale.discount, country: { currency: "USD", locale: "en-US" } })}</span>
            </div>
            {
              isLoading ? (
                <Skeleton className="h-5 w-20 my-2" />
              ) : (
                sale.enableIva && (
                  <>
                    <div className="flex items-center gap-2 border-b py-2">
                      <span className="text-muted-foreground">Exento:</span>
                      <span className="text-muted-foreground">{formatPrice({ price: exemptAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b py-2">
                      <span className="text-muted-foreground">BI G:</span>
                      <span className="text-muted-foreground">{formatPrice({ price: taxableAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                    </div>
                    <div className="flex items-center gap-2 border-b py-2">
                      <span className="text-muted-foreground">IVA G ({sale.ivaPercentage || 0}%):</span>
                      <span className="text-muted-foreground">{formatPrice({ price: taxAmount, country: { currency: "USD", locale: "en-US" } })}</span>
                    </div>
                  </>
                )
              )
            }
            {
              isLoading ? (
                <Skeleton className="h-5 w-20 my-2" />
              ) : (
                <div className="flex items-center gap-2 pt-2">
                  <span className="font-bold text-2xl">Total:</span>
                  <span className="font-bold text-2xl">{formatPrice({ price: sale.enableIva ? total : calculateSubtotal(sale, availableProducts) - sale.discount, country: { currency: "USD", locale: "en-US" } })}</span>
                </div>
              )
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SaleSummaryDialog
