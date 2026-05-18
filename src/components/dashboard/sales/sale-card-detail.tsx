"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/format-price";
import { detailPrice } from "@/lib/price";
import { cn } from "@/lib/utils";
import { useAuthForm } from "@/stores/auth.store";
import { AvaliableProduct, CreateSaleData, CreateSaleDetailData, InventoryType, UserRole } from "@/types";
import { Layers, Lock, Minus, Plus, Trash2 } from "lucide-react";

interface SaleCardDetailProps {
  availableProducts: AvaliableProduct[];
  sale: Omit<CreateSaleData, "id">
  enableIva: boolean
  updateSaleDetail: (index: number, updates: Partial<CreateSaleDetailData>) => void
  removeSaleDetail: (index: number) => void
}

const SaleCardDetail = ({ availableProducts, sale, enableIva, updateSaleDetail, removeSaleDetail }: SaleCardDetailProps) => {

  const { user } = useAuthForm();

  const authorizeUser = user ? user.role === UserRole.ADMIN || user.role === UserRole.SUPER || user.role === UserRole.AUXILIAR : false;

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

  const getInventoryType = (product: AvaliableProduct): "SALE" | "INTERNAL" | "ALL" => {
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

  return (
    <div className="flex flex-col gap-1.5 p-2">
      {sale.details.map((detail, index) => {
        const avaliableProduct = availableProducts.find((product) => product.product.id === detail.productId);
        if (!avaliableProduct) return null;

        const product = avaliableProduct.product;
        const unitLabel = product.inputProduct?.measureUnit || "und";
        const stock = getQuantity(detail, avaliableProduct);
        const subtotal = detailPrice(product, detail, detail.isRetailPrice);
        const unitPrice = detail.isRetailPrice ? detail.retailPrice : detail.wholesalePrice;

        return (
          <article
            key={`${product.id}-${index}`}
            className="rounded-lg border border-border/60 bg-card px-2.5 py-2 shadow-sm"
          >
            {/* Fila 1: nombre + subtotal + eliminar */}
            <div className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-tight line-clamp-2">
                  {product.name}
                  {enableIva && avaliableProduct.ivaPercentage === 0 && (
                    <span className="text-muted-foreground font-normal"> (E)</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {product.refCode ? `${product.refCode} · ` : ""}
                  {stock} {unitLabel}
                </p>
              </div>
              <p className="shrink-0 text-[13px] font-semibold tabular-nums">
                {formatPrice({ price: subtotal, country: { currency: "USD", locale: "en-US" } })}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 h-7 w-7 -mr-1 text-muted-foreground hover:text-destructive"
                onClick={() => removeSaleDetail(index)}
                aria-label="Eliminar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Fila 2: cantidad + chips */}
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center rounded-md border bg-muted/40 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-none rounded-l-md"
                  onClick={() => handleQuantityDecrement(detail, index, avaliableProduct)}
                  disabled={!canDecreaseQuantity(detail, avaliableProduct)}
                  aria-label="Menos"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                {product.inputProduct ? (
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    className="h-7 w-11 border-0 bg-transparent px-0 text-center text-xs font-medium shadow-none focus-visible:ring-0"
                    min={0}
                    step="any"
                    max={stock}
                    value={detail.measureUnitValue === 0 ? '' : detail.measureUnitValue}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                      if (value === '' || (!isNaN(value) && value >= 0)) {
                        handleQuantityChange(value, detail, index, avaliableProduct);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseFloat(e.target.value) <= 0) {
                        updateSaleDetail(index, { measureUnitValue: 0 });
                      }
                    }}
                  />
                ) : (
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    className="h-7 w-11 border-0 bg-transparent px-0 text-center text-xs font-medium shadow-none focus-visible:ring-0"
                    min={0}
                    max={stock}
                    value={detail.quantity || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      if (value === '' || (!isNaN(value) && value >= 0)) {
                        handleQuantityChange(value, detail, index, avaliableProduct);
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '' || parseInt(e.target.value, 10) <= 0) {
                        updateSaleDetail(index, { quantity: 0 });
                      }
                    }}
                  />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-none rounded-r-md"
                  onClick={() => handleQuantityIncrement(detail, index, avaliableProduct)}
                  disabled={!canIncreaseQuantity(detail, avaliableProduct)}
                  aria-label="Más"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <button
                type="button"
                onClick={() => updateSaleDetail(index, { isRetailPrice: !detail.isRetailPrice })}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  detail.isRetailPrice
                    ? "border-border bg-muted/50 text-muted-foreground"
                    : "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                )}
              >
                <Layers className="h-2.5 w-2.5 shrink-0" />
                {formatPrice({ price: unitPrice, country: { currency: "USD", locale: "en-US" } })}
              </button>

              {authorizeUser && (
                <button
                  type="button"
                  disabled={getInventoryType(avaliableProduct) !== "ALL"}
                  onClick={() => {
                    if (getInventoryType(avaliableProduct) === "ALL") {
                      updateSaleDetail(index, {
                        inventaryType: detail.inventaryType === InventoryType.INTERNAL ? InventoryType.SALE : InventoryType.INTERNAL,
                        measureUnitValue: 0,
                        quantity: 1
                      });
                    }
                  }}
                  className={cn(
                    "inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-50",
                    detail.inventaryType === InventoryType.INTERNAL
                      ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      : "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  )}
                >
                  {detail.inventaryType === InventoryType.INTERNAL ? "Int." : "Vta."}
                  {getInventoryType(avaliableProduct) !== "ALL" && <Lock className="h-2 w-2" />}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default SaleCardDetail;
