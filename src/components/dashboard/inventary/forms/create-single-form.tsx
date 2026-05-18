"use client";

import { useEffect, useState } from "react";
import { Loader, Plus, X } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combo-box";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { CreateInventoryData, CreateInventoryItem, Inventory, InventoryItem, InventoryType } from "@/types/inventary";
import { ProductFetch, RateType } from "@/types";

import { createInventary, deleteInventaryItem, updateInventary } from "@/actions/inventary.action";
import { useInventary } from "@/hooks/useInventary";
import { useProducts } from "@/hooks/useProducts";
import { getRates } from "@/actions/rate.action";
import { useSetting } from "@/hooks/useSetting";

import { createInventaryValidation } from "@/validations/inventary.validation";
import { useInventaryForm } from "@/stores/create-inventary.store";
import ShowPrice from "@/components/common/show-price";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface CreateSingleFormProps {
  data?: CreateInventoryData;
  onOpenChange?: (open: boolean) => void;
}

const CreateSingleForm = ({ data, onOpenChange }: CreateSingleFormProps) => {

  const { inventory, setInventory, addEmptyItem, updateItem, removeItem, isSubmitting, setIsSubmitting, resetForm } = useInventaryForm();

  const { getProductsQuery } = useProducts({ limit: 1000, offset: 0 });
  const { getSettingQuery } = useSetting();
  const { getInventaryQuery } = useInventary({});

  const [rate, setRate] = useState(0);
  const [onAlert, setOnAlert] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<CreateInventoryItem | null>(null);

  const [loadingSelects, setLoadingSelects] = useState(true);

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProduct = getProductsQuery.data?.data.find((p: ProductFetch) => p.id === productId);
    if (selectedProduct) {
      updateItem(index, {
        productId: selectedProduct.id,
        retailPrice: selectedProduct.retailPrice?.toString() || '',
        wholesalePrice: selectedProduct.wholesalePrice?.toString() || '',
        stock: '',
        enabledIva: false,
        ivaPercentage: 0,
      });
    }
  };

  const handleInputChange = (index: number, field: keyof Omit<CreateInventoryItem, 'id'>, value: string | number | boolean) => {
    updateItem(index, { [field]: value });
  };

  const handleNumberInput = (index: number, field: keyof Omit<CreateInventoryItem, 'id'>, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Si es el campo stock, solo permite números enteros
    if (field === 'stock') {
      // Solo permite dígitos o cadena vacía
      if (/^\d*$/.test(value) || value === '') {
        handleInputChange(index, field, value === '' ? '' : parseInt(value, 10));
      }
    } else {
      // Para precios, permite decimales
      // Convierte a número y verifica que sea un número válido
      const numValue = parseFloat(value);
      if (!isNaN(numValue) || value === '') {
        handleInputChange(index, field, value === '' ? '' : numValue);
      }
    }
  };

  useEffect(() => {
    if (data) {
      setInventory({
        ...data,
        invoiceNumber: data.invoiceNumber || '',
        providerName: data.providerName || '',
        items: data.items.map(item => ({
          ...item,
          retailPrice: item.retailPrice.toString(),
          wholesalePrice: item.wholesalePrice.toString(),
          stock: item.stock.toString(),
        }))
      });
    }
  }, [data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingSelects(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const getAllRates = async () => {
      try {
        if (getSettingQuery.data?.rateType === RateType.OFICIAL) {
          const rateOficial = await getRates(RateType.OFICIAL);
          setRate(rateOficial.rate);
        } else {
          const rateParalelo = await getRates(RateType.PARALELO);
          setRate(rateParalelo.rate);
        }
      } catch (error) {
        console.log(error);
        toast.error("Error al obtener las tasas de cambio, comuniquese con el administrador");
        getSettingQuery.refetch();
      }
    }

    if (!getSettingQuery.isLoading && getSettingQuery.data?.enableRate) {
      getAllRates();
    }
  }, [getSettingQuery.isLoading]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Convert empty strings to 0 for numeric fields before validation
    const inventoryToSubmit = {
      ...inventory,
      items: inventory.items.map(item => ({
        ...item,
        retailPrice: item.retailPrice === '' ? 0 : Number(item.retailPrice),
        wholesalePrice: item.wholesalePrice === '' ? 0 : Number(item.wholesalePrice),
        stock: item.stock === '' ? 0 : Number(item.stock),
      }))
    };

    const error = createInventaryValidation(inventoryToSubmit);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      if (data) {
        await updateInventary(data.id!, inventoryToSubmit);
      } else {
        await createInventary(inventoryToSubmit);
      }
      getInventaryQuery.refetch();
      toast.success(data ? "Inventario actualizado exitosamente" : "Inventario creado exitosamente");
      if (onOpenChange) {
        onOpenChange(false);
      }
      resetForm();
      setIsSubmitting(false);
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al crear el inventario');
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteInventaryItem(id);
      getInventaryQuery.refetch();
      setInventory({
        ...inventory,
        items: inventory.items.filter((item) => item.id !== id),
      });
      toast.success("Producto eliminado exitosamente");
    } catch (error) {
      console.log('Error deleting item:', error);
      toast.error('Error al eliminar el producto');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto" noValidate>

      <AlertDialog open={onAlert} onOpenChange={setOnAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar producto</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esta accion eliminara permanentemente el producto
              {deleteProductId?.product?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDeleteItem(deleteProductId?.id!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col sm:flex-row gap-2 mb-0 sm:mb-4">
        <div className="flex flex-col gap-2 w-full mb-4 sm:mb-0">
          <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre</Label>
          <Input
            type="text"
            id="name"
            name="name"
            placeholder="Nombre del inventario"
            value={inventory.name}
            onChange={(e) => setInventory({ ...inventory, name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2 w-full mb-4 sm:mb-0">
          <Label htmlFor="type" className="after:ml-0.5 after:text-red-500 after:content-['*']">Tipo</Label>
          {
            loadingSelects ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <Select
                value={inventory.type}
                onValueChange={(value) => {
                  setInventory({ ...inventory, type: value as InventoryType });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InventoryType.SALE}>Venta</SelectItem>
                  <SelectItem value={InventoryType.INTERNAL}>Interno</SelectItem>
                </SelectContent>
              </Select>
            )
          }
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex flex-col gap-2 w-full mb-4 sm:mb-0">
          <Label htmlFor="invoiceNumber">Numero de factura</Label>
          <Input
            type="text"
            id="invoiceNumber"
            name="invoiceNumber"
            placeholder="123456789"
            value={inventory.invoiceNumber || ''}
            onChange={(e) => setInventory({ ...inventory, invoiceNumber: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="providerName">Nombre del proveedor</Label>
          <Input
            type="text"
            id="providerName"
            name="providerName"
            placeholder="Nombre del proveedor"
            value={inventory.providerName || ''}
            onChange={(e) => setInventory({ ...inventory, providerName: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full mb-4">
        <Label htmlFor="products" className="after:ml-0.5 after:text-red-500 after:content-['*']">Productos</Label>
        <div className="flex flex-col gap-2 p-3 border border-dashed rounded-3xl">
          {
            loadingSelects && data ? (
              Array.from({ length: 1 }).map((_, index) => (
                <Skeleton key={index} className="w-full h-[150px] rounded-xl" />
              ))
            ) : (
              inventory.items.map((item: CreateInventoryItem, index) => {
                return (
                  <Card key={index} className="p-2 relative">
                    <span
                      className="absolute top-1 right-1 cursor-pointer w-5 h-5 flex items-center justify-center rounded-full bg-red-500/50 hover:bg-red-500/80 transition-all text-white"
                      onClick={() => {
                        // setDeleteProductId(data.items[index])
                        // setOnAlert(true)
                        if (data) {
                          data.items.find((dataItem) => {
                            if (dataItem.product?.name === item.product?.name) {
                              setDeleteProductId(dataItem);
                              setOnAlert(true);
                            } else {
                              removeItem(index);
                            }
                          })
                        } else {
                          removeItem(index);
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </span>
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
                        <div className="flex flex-col gap-2 w-full">
                          <Label className="after:ml-0.5 after:text-red-500 after:content-['*']">Producto</Label>
                          <Combobox
                            modal
                            disabled={getProductsQuery.isLoading}
                            data={getProductsQuery.data?.data
                              ?.filter((product: ProductFetch) => product.status === 'ACTIVE')
                              ?.map((product: ProductFetch) => ({
                                value: product.id || '',
                                label: product.name,
                                tags: [product.brand, product.refCode ? product.refCode : '']
                              })) || []}
                            onValueChange={(value) => handleProductSelect(index, value)}
                            placeholder="Selecciona un producto"
                            inputLabel="Buscar producto..."
                            notFoundLabel="No se encontraron productos"
                            defaultValue={item.productId || ''}
                            key={`combobox-${item.id || index}`}  // Añade una key única
                            disabledValues={inventory.items.map((item) => item.productId)}
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                          <div className="flex flex-col gap-2 w-full">
                            <Label htmlFor={`stock-${index}`} className="after:ml-0.5 after:text-red-500 after:content-['*']">Stock</Label>
                            <Input
                              type="number"
                              id={`stock-${index}`}
                              name={`stock-${index}`}
                              placeholder="Ingrese la cantidad"
                              value={item.stock}
                              onChange={(e) => handleNumberInput(index, 'stock', e)}
                              min="0"
                              step="1"
                              disabled={
                                data
                                  ? item.measureUnitValue > 0
                                    ? Number(item.measureUnitValue) !== Number(item.initialMeasureUnitValue)
                                    : Number(item.stock) !== Number(item.initialStock)
                                  : false
                              }
                            />
                          </div>
                          {
                            !getSettingQuery.isLoading && getSettingQuery.data.enableIva && (
                              <div className="flex flex-col gap-2 w-full">
                                <Label className={cn('flex items-center justify-between border gap-2 bg-accent/50 px-3 h-[37px] rounded-lg cursor-pointer mt-5', item.enabledIva ? '' : 'text-muted-foreground')}>
                                  Incluye IVA
                                  <Switch
                                    checked={item.enabledIva}
                                    onCheckedChange={(value) => {
                                      handleInputChange(index, 'enabledIva', value)
                                      if (value) {
                                        handleInputChange(index, 'ivaPercentage', getSettingQuery.data?.iva || 0)
                                      } else {
                                        handleInputChange(index, 'ivaPercentage', 0)
                                      }
                                    }}
                                  />
                                </Label>
                              </div>
                            )
                          }
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <div className="flex flex-col gap-2 w-full">
                          <Label htmlFor={`retailPrice-${index}`} className="after:ml-0.5 after:text-red-500 after:content-['*']">Precio al detal</Label>
                          <div className="w-full relative">
                            <span className="absolute top-1/2 left-2 transform -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              id={`retailPrice-${index}`}
                              name={`retailPrice-${index}`}
                              placeholder="0.00"
                              value={item.retailPrice}
                              onChange={(e) => handleNumberInput(index, 'retailPrice', e)}
                              min="0"
                              step="0.01"
                              className="pl-5"
                            />
                            {
                              getSettingQuery.isLoading ? (
                                <Loader className="w-4 h-4 animate-spin absolute top-1/2 right-2 transform -translate-y-1/2" />
                              ) : (
                                <ShowPrice
                                  price={typeof item.retailPrice === 'string' ? (item.retailPrice === '' ? 0 : Number(item.retailPrice)) : item.retailPrice}
                                  rate={rate}
                                  settingData={getSettingQuery.data}
                                  className="absolute top-1/2 right-9 transform -translate-y-1/2 text-xs text-muted-foreground"
                                />
                              )
                            }
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 w-full">
                          <Label htmlFor={`wholesalePrice-${index}`}>Precio al por mayor</Label>
                          <div className="w-full relative">
                            <span className="absolute top-1/2 left-2 transform -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              id={`wholesalePrice-${index}`}
                              name={`wholesalePrice-${index}`}
                              placeholder="0.00"
                              value={item.wholesalePrice}
                              onChange={(e) => handleNumberInput(index, 'wholesalePrice', e)}
                              min="0"
                              step="0.01"
                              className="pl-5"
                            />
                            {
                              getSettingQuery.isLoading ? (
                                <Loader className="w-4 h-4 animate-spin absolute top-1/2 right-2 transform -translate-y-1/2" />
                              ) : (
                                <ShowPrice
                                  price={typeof item.wholesalePrice === 'string' ? (item.wholesalePrice === '' ? 0 : Number(item.wholesalePrice)) : item.wholesalePrice}
                                  rate={rate}
                                  settingData={getSettingQuery.data}
                                  className="absolute top-1/2 right-9 transform -translate-y-1/2 text-xs text-muted-foreground"
                                />
                              )
                            }
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )

          }
          <div className="flex justify-between items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                if (getProductsQuery.data && getProductsQuery.data.data.length > 0) {
                  if (inventory.items.length >= getProductsQuery.data.data.length) {
                    toast.error(`Solo puedes agregar ${getProductsQuery.data.data.length} productos`);
                    return;
                  }
                  addEmptyItem();
                } else {
                  toast.error(`No existen productos de tipo ${inventory.type === InventoryType.SALE ? 'PRODUCTO' : 'MATERIA PRIMA'} para agregar al inventario`);
                }
              }}
            >
              <Plus />
              <span>Agregar producto</span>
            </Button>
            <span className="text-sm text-muted-foreground">{inventory.items.length} {inventory.items.length === 1 ? 'producto' : 'productos'}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer w-full sm:w-auto"
        >
          {
            isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" />
                <span>{data ? "Actualizando inventario" : "Creando inventario"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus />
                <span>{data ? "Actualizar inventario" : "Crear inventario"}</span>
              </div>
            )
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateSingleForm;
