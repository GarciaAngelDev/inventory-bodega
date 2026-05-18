"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/format-price";
import { detailPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { useAuthForm } from "@/stores/auth.store";
import { AvaliableProduct, CreateSaleData, CreateSaleDetailData, InventoryType, MeasureUnit, UserRole } from "@/types";
import { Layers, Lock, Minus, Plus, Trash2 } from "lucide-react";
import { HTMLAttributes } from "react";

interface SaleTableProps extends HTMLAttributes<HTMLDivElement> {
  availableProducts: AvaliableProduct[];
  sale: Omit<CreateSaleData, "id">
  enableIva: boolean
  updateSaleDetail: (index: number, updates: Partial<CreateSaleDetailData>) => void
  removeSaleDetail: (index: number) => void
}

const SaleTable = ({ availableProducts, sale, enableIva, updateSaleDetail, removeSaleDetail, ...props }: SaleTableProps) => {

  const { user } = useAuthForm();

  const authorizeUser = user ? user.role === UserRole.ADMIN || user.role === UserRole.SUPER || user.role === UserRole.AUXILIAR : false;

  const getInventoryType = (product: AvaliableProduct): "SALE" | "INTERNAL" | "ALL" => {
    //Identificar si pertenece a un unico tipo de inventario o si pertenece a ambos (SALE y INTERNAL)
    const saleInventory = product.inventoryItems.find((inventoryItem) => inventoryItem.inventaryType === InventoryType.SALE);
    const internalInventory = product.inventoryItems.find((inventoryItem) => inventoryItem.inventaryType === InventoryType.INTERNAL);

    if (saleInventory && internalInventory) {
      return "ALL"
    } else if (saleInventory) {
      return "SALE"
    } else {
      return "INTERNAL"
    }
  }

  const getQuantity = (detail: CreateSaleDetailData, availableProduct: AvaliableProduct) => {
    return detail.inventaryType === InventoryType.INTERNAL
      ? availableProduct.inventoryItems.reduce((total, inventoryItem) => 
          inventoryItem.inventaryType === InventoryType.INTERNAL 
            ? total + (inventoryItem.isInputProduct ? inventoryItem.availableMeasureUnitValue : inventoryItem.availableQuantity) 
            : total, 0)
      : availableProduct.inventoryItems.reduce((total, inventoryItem) => 
          inventoryItem.inventaryType === InventoryType.SALE 
            ? total + (inventoryItem.isInputProduct ? inventoryItem.availableMeasureUnitValue : inventoryItem.availableQuantity) 
            : total, 0);
  };

  const canDecreaseQuantity = (detail: CreateSaleDetailData, availableProduct: AvaliableProduct) => {
    if (availableProduct.product.inputProduct) {
      const value = detail.measureUnitValue ?? 0;
      return value > 0 && value <= getQuantity(detail, availableProduct);
    }
    const quantity = detail.quantity ?? 0;
    return quantity > 1 && quantity <= getQuantity(detail, availableProduct);
  };

  const canIncreaseQuantity = (detail: CreateSaleDetailData, availableProduct: AvaliableProduct) => {
    if (availableProduct.product.inputProduct) {
      const value = detail.measureUnitValue ?? 0;
      return value < getQuantity(detail, availableProduct);
    }
    const quantity = detail.quantity ?? 0;
    return quantity < getQuantity(detail, availableProduct);
  };

  const handleQuantityChange = (value: number | '', detail: CreateSaleDetailData, index: number, availableProduct: AvaliableProduct) => {
    if (availableProduct.product.inputProduct) {
      const newValue = value === '' ? 0 : value;
      if (newValue >= 0 && newValue <= getQuantity(detail, availableProduct)) {
        updateSaleDetail(index, { measureUnitValue: newValue });
      }
    } else {
      const newValue = value === '' ? 0 : value;
      if (newValue >= 0 && newValue <= getQuantity(detail, availableProduct)) {
        updateSaleDetail(index, { quantity: newValue });
      }
    }
  };

  const handleQuantityIncrement = (detail: CreateSaleDetailData, index: number, availableProduct: AvaliableProduct) => {
    if (availableProduct.product.inputProduct) {
      const currentValue = detail.measureUnitValue || 0;
      if (currentValue < getQuantity(detail, availableProduct)) {
        updateSaleDetail(index, { measureUnitValue: currentValue + 1 });
      }
    } else {
      const currentValue = detail.quantity || 0;
      if (currentValue < getQuantity(detail, availableProduct)) {
        updateSaleDetail(index, { quantity: currentValue + 1 });
      }
    }
  };

  const handleQuantityDecrement = (detail: CreateSaleDetailData, index: number, availableProduct: AvaliableProduct) => {
    if (availableProduct.product.inputProduct) {
      const currentValue = detail.measureUnitValue || 0;
      if (currentValue > 0) {
        updateSaleDetail(index, { measureUnitValue: currentValue - 1 });
      }
    } else {
      const currentValue = detail.quantity || 0;
      if (currentValue > 1) {
        updateSaleDetail(index, { quantity: currentValue - 1 });
      }
    }
  };

  return (
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Producto</TableHead>
          {
            authorizeUser && (
              <TableHead className="w-[80px]">Tipo</TableHead>
            )
          }
          <TableHead className="w-[100px]">
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger>
                  <Layers className="text-muted-foreground size-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    Intercambiar precio al detal y al mayor
                  </div>
                </TooltipContent>
              </Tooltip>
              <span>Precio</span>
            </div>
          </TableHead>
          <TableHead className="w-[230px]">Cantidad</TableHead>
          {/* <TableHead className="w-[140px]">Unidad de medida</TableHead> */}
          <TableHead className="w-[100px]">Subtotal</TableHead>
          <TableHead className="w-[60px]"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sale.details.map((detail, index) => {
          const availableProduct = availableProducts.find(
            ap => ap.product.id === detail.productId
          );

          if (!availableProduct) return null;

          const product = availableProduct.product;

          return (
            <TableRow key={`${product.id}-${index}`}>
              <TableCell>
                <div>
                  <p className="font-medium">{product.name} {enableIva && availableProduct.ivaPercentage === 0 ? `(E)` : ""}</p>
                  <p className="text-sm text-muted-foreground">{product.refCode}</p>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="mt-1">
                        {/* Disponible: {availableProduct.isInputProduct ? availableProduct.availableMeasureUnitValue.toLocaleString() : availableProduct.availableQuantity} <span className="lowercase">{availableProduct.product.inputProduct ? availableProduct.product.inputProduct?.measureUnit : "UND"}</span> */}
                        Disponible: { getQuantity(detail, availableProduct) } <span className="lowercase">{availableProduct.product.inputProduct ? availableProduct.product.inputProduct?.measureUnit : "UND"}</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div>
                        <p className="font-bold">Unidad de medida:</p>
                        <p>
                          {
                            availableProduct.product.inputProduct
                              ? availableProduct.product.inputProduct?.measureUnit === MeasureUnit.KG ? "Kilogramos" :
                                availableProduct.product.inputProduct?.measureUnit === MeasureUnit.G ? "Gramos" :
                                  availableProduct.product.inputProduct?.measureUnit === MeasureUnit.L ? "Litros" :
                                    availableProduct.product.inputProduct?.measureUnit === MeasureUnit.ML ? "Mililitros" :
                                      ""
                              : "Unidades"
                          }
                          <span className="lowercase"> ({availableProduct.product.inputProduct ? availableProduct.product.inputProduct?.measureUnit : "UND"})</span>
                        </p>
                        <p className="font-bold">Disponibilidad:</p>
                        <p>
                          {getQuantity(detail, availableProduct)}
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
              {
                authorizeUser && (
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="outline"
                          className={cn(
                            getInventoryType(availableProduct) === "ALL" ? "cursor-pointer" : "cursor-not-allowed opacity-70",
                            detail.inventaryType === InventoryType.INTERNAL ? "text-blue-500" : "text-green-500"
                          )}
                          onClick={() => {
                            if (getInventoryType(availableProduct) === "ALL") {
                              updateSaleDetail(index, { 
                                inventaryType: detail.inventaryType === InventoryType.INTERNAL ? InventoryType.SALE : InventoryType.INTERNAL,
                                measureUnitValue: 0,
                                quantity: 1
                              });
                            }
                          }}
                        >
                          {detail.inventaryType === InventoryType.INTERNAL ? "Interno" : "Venta"}
                          {getInventoryType(availableProduct) !== "ALL" && (
                            <Lock className="ml-1 h-3 w-3" />
                          )}
                        </Badge>
                      </TooltipTrigger>
                      {getInventoryType(availableProduct) !== "ALL" && (
                        <TooltipContent>
                          <p>Este producto solo está disponible en inventario {getInventoryType(availableProduct) === "SALE" ? "venta" : "interno"}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TableCell>
                )
              }
              <TableCell>
                <div className="flex flex-col">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="p-2 hover:bg-foreground/5 rounded-lg cursor-pointer flex items-center gap-2"
                        onClick={() => updateSaleDetail(index, { isRetailPrice: !detail.isRetailPrice })}
                      >
                        <Layers className={cn("size-4", detail.isRetailPrice ? "text-muted-foreground" : "text-green-500")} />
                        <span className="text-muted-foreground select-none">{detail.isRetailPrice ? formatPrice({ price: detail.retailPrice, country: { currency: "USD", locale: "en-US" } }) : formatPrice({ price: detail.wholesalePrice, country: { currency: "USD", locale: "en-US" } })}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{detail.isRetailPrice ? "Al detal" : "Al mayor"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TableCell>
              {
                !product.inputProduct && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityDecrement(detail, index, availableProduct)}
                        disabled={!canDecreaseQuantity(detail, availableProduct) || !!product.inputProduct}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-gray-400 uppercase">UND</span>
                        </div>
                        <Input
                          type="number"
                          className="w-32 pr-11"
                          min={0}
                          max={getQuantity(detail, availableProduct)}
                          placeholder="0"
                          value={detail.quantity || ''}
                          disabled={!!product.inputProduct}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                            if (value === '' || (!isNaN(value) && value >= 0)) {
                              handleQuantityChange(value, detail, index, availableProduct);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updateSaleDetail(index, { quantity: 0 });
                            } else if (parseInt(e.target.value, 10) <= 0) {
                              updateSaleDetail(index, { quantity: 0 });
                            }
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityIncrement(detail, index, availableProduct)}
                        disabled={!canIncreaseQuantity(detail, availableProduct) || !!product.inputProduct}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )
              }
              {
                product.inputProduct && (
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityDecrement(detail, index, availableProduct)}
                        disabled={!product.inputProduct || !canDecreaseQuantity(detail, availableProduct)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <div className="absolute inset-y-0 right-3 flex items-center pl-3 pointer-events-none">
                          <span className="text-gray-500 sm:text-gray-400 uppercase">{product.inputProduct?.measureUnit || ""}</span>
                        </div>
                        <Input
                          type="number"
                          className="w-32 pr-8"
                          min={0}
                          step="any"
                          max={getQuantity(detail, availableProduct)}
                          value={detail.measureUnitValue === 0 ? '' : detail.measureUnitValue}
                          placeholder="0"
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                            if (value === '' || (!isNaN(value) && value >= 0)) {
                              handleQuantityChange(value, detail, index, availableProduct);
                            }
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updateSaleDetail(index, { measureUnitValue: 0 });
                            } else if (parseFloat(e.target.value) <= 0) {
                              updateSaleDetail(index, { measureUnitValue: 0 });
                            }
                          }}
                          disabled={!product.inputProduct}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleQuantityIncrement(detail, index, availableProduct)}
                        disabled={!product.inputProduct || !canIncreaseQuantity(detail, availableProduct)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )
              }
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span className="text-muted-foreground font-medium">
                    {formatPrice({ price: detailPrice(product, detail, detail.isRetailPrice), country: { currency: "USD", locale: "en-US" } })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSaleDetail(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  )
}

export default SaleTable
