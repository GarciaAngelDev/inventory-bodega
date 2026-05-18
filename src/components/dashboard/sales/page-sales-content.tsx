"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { useCreateSaleStore } from "@/stores/createSaleStore";

import { AvaliableProduct, InventoryType, RateType, SaleDetailStatus, SaleFetch, SaleStatus } from "@/types";

import { useSetting } from "@/hooks/useSetting";
import { calculateCreateSaleSubtotal, calculateExemptCreateSaleProducts, calculateTaxableCreateSaleProducts, calculateTaxAmountCreateSale, findProduct } from "@/lib/sales";
import { getRates } from "@/actions/rate.action";
import { getAvailableProducts } from "@/actions/products.action";
import CartSales from "./cart-sales";
import { createSale } from "@/actions/sales.action";
import { AxiosError } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combo-box";
import SaleSummaryDialog from "./sale-summary-dialog";

const PageSalesContent = () => {

  const [availableProducts, setAvailableProducts] = useState<AvaliableProduct[]>([]);
  const [filteredAvailableProducts, setFilteredAvailableProducts] = useState<AvaliableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saleResponse, setSaleResponse] = useState<SaleFetch | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [rate, setRate] = useState(0);

  const { sale, setSale, addSaleDetail, updateSaleDetail, removeSaleDetail, removeAllSaleDetails, resetSale } = useCreateSaleStore();

  const { getSettingQuery } = useSetting();

  const getAllAvailableProducts = async () => {
    try {
      const products = await getAvailableProducts({ type: InventoryType.SALE });
      setAvailableProducts(products);
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener los productos disponibles, comuníquese con el administrador");
    }
  };

  useEffect(() => {
    getAllAvailableProducts();
  }, []);

  useEffect(() => {
    const getAllRates = async () => {
      try {
        if (getSettingQuery.data?.rateType === RateType.OFICIAL) {
          const rateOficial = await getRates(RateType.OFICIAL);
          setRate(rateOficial.rate);
        }
        if (getSettingQuery.data?.rateType === RateType.PARALELO) {
          const rateParalelo = await getRates(RateType.PARALELO);
          setRate(rateParalelo.rate);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al obtener la tasa de cambio, comuniquese con el administrador");
      }
    }

    if (!getSettingQuery.isLoading) {
      getAllRates();
    }
  }, [getSettingQuery.isLoading]);

  useEffect(() => {
    const filtered = availableProducts.filter(
      (available) => !sale.details.some((detail) => detail.productId === available.product.id)
    );
    setFilteredAvailableProducts(filtered);
  }, [availableProducts, sale.details]);

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast.error("Por favor seleccione un producto");
      return;
    }

    const product = availableProducts.find((avaliableProduct) =>
      avaliableProduct.product.id === selectedProduct
    );

    if (product) {
      // Determinar el tipo de inventario disponible para el producto
      const hasSaleInventory = product.inventoryItems.some(item => item.inventaryType === InventoryType.SALE);
      const hasInternalInventory = product.inventoryItems.some(item => item.inventaryType === InventoryType.INTERNAL);
      
      // Establecer el tipo de inventario según disponibilidad
      const inventaryType = !hasSaleInventory && hasInternalInventory 
        ? InventoryType.INTERNAL 
        : InventoryType.SALE;

      addSaleDetail({
        productId: product.product.id!,
        inventoryItems: product.inventoryItems.map((inventoryItem) => ({
          inventoryId: inventoryItem.inventoryId,
          inventoryItemId: inventoryItem.inventoryItemId
        })),
        retailPrice: product.retailPrice || 0,
        wholesalePrice: product.wholesalePrice || 0,
        quantity: product.product.inputProduct ? 0 : 1,
        measureUnitValue: product.product.inputProduct ? 0 : undefined,
        status: SaleDetailStatus.SOLD,
        iva: 0,
        ivaPercentage: 0,
        isRetailPrice: true,
        inventaryType
      });

      setSelectedProduct("");
      toast.success(`Se agregó ${product.product.name} al carrito`);
    } else {
      toast.error('El producto no se encuentra disponible');
    }
  }

  const exemptAmount = calculateExemptCreateSaleProducts(sale, availableProducts);
  const taxableAmount = calculateTaxableCreateSaleProducts(sale, availableProducts);
  const taxAmount = calculateTaxAmountCreateSale(sale, availableProducts);
  const totalMount = exemptAmount + taxableAmount + taxAmount;
  const total = sale.discount && Number(sale.discount) > 0 ? totalMount - Number(sale.discount) : totalMount;

  const handleProcessSale = async (status: SaleStatus, clientId?: string) => {

    if (sale.details.length === 0) {
      toast.error("No hay productos en el carrito");
      return;
    }

    if (sale.discount && Number(sale.discount) > 0 && totalMount <= 0) {
      toast.error("El descuento no puede dejar el total en negativo");
      return;
    }
    

    // Validar que todos los productos tengan cantidades válidas
    for (const detail of sale.details) {
      const product = findProduct(detail.productId, availableProducts);
      
      if (!product) continue;
      
      if (product.inputProduct) {
        // Validar medida para productos de entrada
        if (detail.measureUnitValue === undefined || detail.measureUnitValue <= 0) {
          toast.error(`La unidad de medida de ${product.name} debe ser mayor a 0`);
          return;
        }
      } else {
        // Validar cantidad para productos regulares
        if (detail.quantity === undefined || detail.quantity <= 0) {
          toast.error(`La cantidad de ${product.name} debe ser mayor a 0`);
          return;
        }
      }
    }

    try {
      setSubmitting(true);
      const availableProduct = (productId: string) => availableProducts.find((ap) => ap.product.id === productId);
      const saleResponse = await createSale({
        ...sale,
        enableIva: getSettingQuery.data?.enableIva,
        ivaPercentage: getSettingQuery.data?.iva,
        details: sale.details.map((detail) => ({
          ...detail,
          retailPrice: detail.isRetailPrice ? detail.retailPrice : 0,
          wholesalePrice: !detail.isRetailPrice ? detail.wholesalePrice : 0,
          ivaPercentage: availableProduct(detail.productId) && availableProduct(detail.productId)?.ivaPercentage ? availableProduct(detail.productId)?.ivaPercentage! : 0,
        })),
        clientId,
        status
      });

      setSaleResponse(saleResponse);
      setShowSummary(true);

      toast.success(`${status === SaleStatus.SOLD ? 'Venta creada exitosamente' : 'Venta reservada exitosamente'}`);
      resetSale();
      getAllAvailableProducts();
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error || "Error al crear la venta");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear la venta, comuníquese con el administrador");
      }
    } finally {
      setSubmitting(false);
    }
  }

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

  return (
    <>
      {
        saleResponse && (
          <SaleSummaryDialog
            showSummary={showSummary}
            setShowSummary={setShowSummary}
            sale={saleResponse}
          />
        )
      }

      <div className="space-y-3 md:space-y-6">
        <div className="sticky top-0 z-30 -mx-4 px-3 pt-1 pb-2 bg-background/95 backdrop-blur-sm border-b md:static md:z-auto md:mx-0 md:px-0 md:pt-0 md:pb-0 md:border-0 md:bg-transparent md:backdrop-blur-none">
        <div className="flex flex-col-reverse xs:flex-row justify-between items-end gap-2 md:gap-4">
          <div className="space-y-2 md:space-y-4 w-full">
            <div className="flex justify-between items-center gap-2">
              <h1 className="text-base font-semibold md:text-2xl md:font-bold">Nueva venta</h1>
              <Link href="/dashboard/ventas/historial" className="xs:hidden">
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                >
                  <ReceiptText className="size-3.5" />
                  <span className="ml-1">Historial</span>
                </Button>
              </Link>
            </div>
            <div className="flex gap-1.5 xs:gap-4 items-center sm:items-end">
              {getSettingQuery.isLoading ? (
                <Skeleton className="w-[173.7px] h-9" />
              ) : (
                <div className="w-full md:max-w-[400px] flex-1 min-w-0">
                  <Combobox
                    modal
                    className="[&_button]:h-9 [&_button]:text-sm"
                    data={filteredAvailableProducts.map((available) => ({
                      label: `${available.product.name} ${available.product.refCode && `(${available.product.refCode})`}`,
                      value: available.product.id!,
                      inventoryType: getInventoryType(available)
                    }))}
                    onValueChange={(value) => setSelectedProduct(value)}
                    defaultValue={selectedProduct || ""}
                    placeholder="Buscar producto..."
                    inputLabel="Buscar producto por nombre o referencia"
                    notFoundLabel="No se encontraron productos disponibles"
                    disabled={getSettingQuery.isLoading || filteredAvailableProducts.length === 0}
                  />
                </div>
              )}

              <Button
                onClick={handleAddProduct}
                disabled={!selectedProduct || getSettingQuery.isLoading}
                className="xs:hidden shrink-0 h-9 w-9 bg-blue-500 hover:bg-blue-600 text-white"
                size="icon"
              >
                <Plus />
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!selectedProduct || getSettingQuery.isLoading}
                className="hidden xs:flex bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus />
                <span>Agregar <span className="hidden sm:inline">al carrito</span></span>
              </Button>
            </div>
          </div>
          <Link href="/dashboard/ventas/historial" className="hidden xs:block">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            >
              <ReceiptText />
              <span>Historial <span className="hidden sm:inline">de ventas</span></span>
            </Button>
          </Link>
        </div>
        </div>

        <CartSales
          availableProducts={availableProducts}
          sale={sale}
          setSale={setSale}
          removeAllSaleDetails={removeAllSaleDetails}
          updateSaleDetail={updateSaleDetail}
          removeSaleDetail={removeSaleDetail}
          setting={getSettingQuery.data ? getSettingQuery.data : {}}
          settingLoading={getSettingQuery.isLoading}
          submitting={submitting}
          rate={rate}
          exemptAmount={exemptAmount}
          taxableAmount={taxableAmount}
          taxAmount={taxAmount}
          total={total}
          totalMount={totalMount}
          handleProcessSale={handleProcessSale}
        />
      </div>
    </>
  )
}

export default PageSalesContent;
