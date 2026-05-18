"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ReceiptText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { AvaliableProduct, InventoryType, ProducerDetailStatus, ProducerStatus } from "@/types";

import { useSetting } from "@/hooks/useSetting";
import { findProduct } from "@/lib/sales";
import { getAvailableProducts } from "@/actions/products.action";
import { AxiosError } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combo-box";
import { useProducerStore } from "@/stores/createProducerStore";
import { createProducer } from "@/actions/producer.action";
import CartProducer from "./cart-producer";

const PageProducersContent = () => {

  const [availableProducts, setAvailableProducts] = useState<AvaliableProduct[]>([]);
  const [filteredAvailableProducts, setFilteredAvailableProducts] = useState<AvaliableProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [loadingSelects, setLoadingSelects] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { producer, addProducerDetail, updateProducerDetail, removeProducerDetail, removeAllProducerDetails, resetForm } = useProducerStore();

  const getAllAvailableProducts = async () => {
    try {
      const products = await getAvailableProducts({ type: InventoryType.INTERNAL });
      setAvailableProducts(products);
    } catch (error) {
      console.log(error);
      toast.error("Error al obtener los productos disponibles, comuníquese con el administrador");
    }
  };

  useEffect(() => {
    // timeput de 500ms
    const timeout = setTimeout(() => {
      setLoadingSelects(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    getAllAvailableProducts();
  }, []);

  useEffect(() => {
    const filtered = availableProducts.filter(
      (available) => !producer.details.some((detail) => detail.productId === available.product.id)
    );
    setFilteredAvailableProducts(filtered);
  }, [availableProducts, producer.details]);

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast.error("Por favor seleccione un producto");
      return;
    }

    const product = availableProducts.find((avaliableProduct) =>
      avaliableProduct.product.id === selectedProduct
    );

    if (product) {
      addProducerDetail({
        productId: product.product.id!,
        inventaryItems: product.inventoryItems.map((inventoryItem) => ({
          inventoryId: inventoryItem.inventoryId,
          inventoryItemId: inventoryItem.inventoryItemId
        })),
        quantity: 1,
        measureUnitValue: 0,
        status: ProducerDetailStatus.PRODUCED
      });

      setSelectedProduct("");
      toast.success(`Se agregó ${product.product.name} a la producción`);
    } else {
      toast.error('El producto no se encuentra disponible');
    }
  }

  const handleProcessSale = async (status: ProducerStatus) => {
    if (producer.details.length === 0) {
      toast.error("No hay productos en la producción");
      return;
    }

    let error = { error: false, message: "" };
    producer.details.forEach((detail) => {
      const product = findProduct(detail.productId, availableProducts);
      if (product) {
        if (product.inputProduct) {
          if (detail.measureUnitValue <= 0) {
            error = { 
              error: true, 
              message: `La unidad de medida del producto "${product.name}" debe ser mayor a 0` 
            };
          }
        } else if (detail.quantity <= 0) {
          error = { 
            error: true, 
            message: `La cantidad del producto "${product.name}" debe ser mayor a 0` 
          };
        }
      }
    });

    if (error.error) {
      toast.error(error.message);
      return;
    }

    try {
      setSubmitting(true);
      await createProducer({
        ...producer,
        details: producer.details,
        status
      });

      toast.success("Producción creada correctamente");
      resetForm();
      getAllAvailableProducts();
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error || "Error al crear la producción");
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Error al crear la producción, comuníquese con el administrador");
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
    <div className="space-y-6">
      <div className="flex flex-col-reverse xs:flex-row justify-between items-end gap-4">
          <div className="space-y-4 w-full">
            <div className="mt-2 flex justify-between items-center">
              <h1 className="text-2xl font-bold">Nueva Producción</h1>
              <Link href="/dashboard/produccion/historial" className="xs:hidden">
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
                >
                  <ReceiptText />
                  <span>Historial<span className="hidden sm:inline">de producción</span></span>
                </Button>
              </Link>
            </div>
            <div className="flex gap-2 xs:gap-4 items-start sm:items-end">
              {loadingSelects ? (
                <Skeleton className="w-[173.7px] h-9" />
              ) : (
                <div className="w-full max-w-[400px]">
                  <Combobox
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
                    disabled={loadingSelects || filteredAvailableProducts.length === 0}
                  />
                </div>
              )}

              <Button
                onClick={handleAddProduct}
                disabled={!selectedProduct || loadingSelects}
                className="xs:hidden bg-blue-500 hover:bg-blue-600 text-white"
                size="icon"
              >
                <Plus />
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!selectedProduct || loadingSelects}
                className="hidden xs:flex bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Plus />
                <span>Agregar <span className="hidden sm:inline">al carrito</span></span>
              </Button>
            </div>
          </div>
          <Link href="/dashboard/produccion/historial" className="hidden xs:block">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            >
              <ReceiptText />
              <span>Historial <span className="hidden sm:inline">de producción</span></span>
            </Button>
          </Link>
        </div>

      <CartProducer
        availableProducts={availableProducts}
        producer={producer}
        removeAllProducerDetails={removeAllProducerDetails}
        updateProducerDetail={updateProducerDetail}
        removeProducerDetail={removeProducerDetail}
        submitting={submitting}
        handleProcessSale={handleProcessSale}
      />
    </div>
  )
}

export default PageProducersContent;
