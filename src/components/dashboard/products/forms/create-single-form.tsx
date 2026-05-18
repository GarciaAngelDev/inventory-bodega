"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, Plus, X } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { useProductForm } from "@/stores/create-product.store";
import { createProductValidation } from "@/validations/product.validation";
import { createProduct, updateProduct } from "@/actions/products.action";

import { Category, CreateProductData, MeasureUnit, ProductType, InputProduct, CategoryStatus, InputProductStatus } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useInputProducts } from "@/hooks/useInputProduct";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CreateProductFormProps {
  data?: CreateProductData;
  onOpenChange?: (open: boolean) => void;
}

const CreateProductRawMaterialForm = ({ data, onOpenChange }: CreateProductFormProps) => {

  const tagRef = useRef<HTMLInputElement | null>(null);

  const [newCharacteristic, setNewCharacteristic] = useState('');
  const [newCharacteristicItems, setNewCharacteristicItems] = useState<{ [key: number]: string }>({});
  const [loadingSelects, setLoadingSelects] = useState(true);

  const { getCategoriesQuery } = useCategories({ limit: 1000, offset: 0 });

  const { getInputProductsQuery } = useInputProducts({ limit: 1000, offset: 0 });

  const queryClient = useQueryClient();

  const { product, setProduct, isSubmitting, setIsSubmitting, resetProduct, addTag, removeTag, addCharacteristic, removeCharacteristic, addCharacteristicItem, removeCharacteristicItem } = useProductForm();

  useEffect(() => {
    if (data) {
      setProduct(data);
    }
  }, [data]);

  useEffect(() => {
    // timeput de 500ms
    const timeout = setTimeout(() => {
      setLoadingSelects(false);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = createProductValidation(product);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    try {

      if (data) {
        await updateProduct(data.id!, product);
      } else {
        await createProduct(product);
      }
      setIsSubmitting(false);
      toast.success(data ? "Producto actualizado exitosamente" : "Producto creado exitosamente");
      if (onOpenChange) {
        onOpenChange(false);
      }
      resetProduct();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error(data ? "Error al actualizar el producto" : "Error al crear el producto");
    }
  };

  const handleAddTag = () => {
    if (tagRef.current?.value) {
      addTag(tagRef.current.value);
      tagRef.current.value = '';
      tagRef.current.focus();
    }
  };

  // Manejadores para características
  const handleAddCharacteristic = () => {
    if (newCharacteristic.trim()) {
      addCharacteristic(newCharacteristic.trim());
      setNewCharacteristic('');
    }
  };

  const handleAddCharacteristicItem = (charIndex: number) => {
    const itemValue = newCharacteristicItems[charIndex]?.trim();
    if (itemValue) {
      addCharacteristicItem(charIndex, itemValue);
      setNewCharacteristicItems(prev => ({ ...prev, [charIndex]: '' }));
    }
  };

  const handleRemoveCharacteristic = (index: number) => {
    removeCharacteristic(index);
    // Limpiar el input de ítem si existe
    const newItems = { ...newCharacteristicItems };
    delete newItems[index];
    setNewCharacteristicItems(newItems);
  };

  const getInputProduct = (id: string) => {
    if (getInputProductsQuery.data) {
      const inputProduct: InputProduct | null = getInputProductsQuery.data.data.find((inputProduct: InputProduct) => inputProduct.id === id);
      if (inputProduct) {
        return inputProduct.measureUnit === MeasureUnit.KG ? 'Kilogramos' :
          inputProduct.measureUnit === MeasureUnit.G ? 'Gramos' :
            inputProduct.measureUnit === MeasureUnit.L ? 'Litros' :
              inputProduct.measureUnit === MeasureUnit.ML ? 'Mililitros' :
                // inputProduct.measureUnit === MeasureUnit.UND ? 'Unidades' :
                '';
      }
    }
    return null;
  };

  const clearInputProduct = () => {
    setProduct({ ...product, measureUnitValue: 0, inputProductId: '' });
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="flex flex-col md:flex-row gap-4 w-full mt-4 mb-4">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="type" className="after:ml-0.5 after:text-red-500 after:content-['*']">Tipo</Label>
          {
            loadingSelects ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <Select
                value={product.type}
                onValueChange={(value) => setProduct({ ...product, type: value as ProductType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige el tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCT">Producto</SelectItem>
                  <SelectItem value="RAWMATERIAL">Materia prima</SelectItem>
                </SelectContent>
              </Select>
            )
          }
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre</Label>
          <Input
            type="text"
            id="name"
            name="name"
            placeholder="Nombre del producto"
            value={product.name}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="stock" className="after:ml-0.5 after:text-red-500 after:content-['*']">Categoría</Label>
          {
            loadingSelects ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <Select
                value={product.category}
                onValueChange={(value) => setProduct({ ...product, category: value })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elije una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {
                    getCategoriesQuery.isLoading ? (
                      <SelectItem disabled value="none">
                        Cargando categorías...
                      </SelectItem>
                    ) : (
                      getCategoriesQuery.data?.data.map((category: Category) => (
                        category.status === CategoryStatus.ACTIVE && (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        )
                      ))
                    )
                  }
                </SelectContent>
              </Select>
            )
          }
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full mt-4 mb-4">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="refCode">Código de referencia</Label>
          <Input
            type="text"
            id="refCode"
            name="refCode"
            placeholder="SKU-0001"
            value={product.refCode}
            onChange={handleChange}
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="brand">Marca</Label>
          <Input
            type="text"
            id="brand"
            name="brand"
            placeholder="Marca del producto"
            value={product.brand}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 w-full mt-4 mb-4">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="inputProductId">Insumo</Label>
          {
            loadingSelects ? (
              <Skeleton className="w-full h-9" />
            ) : (
              <div className="flex items-center gap-1">
                <Select
                  value={product.inputProductId}
                  onValueChange={(value) => setProduct({ ...product, inputProductId: value, minStock: 0 })}
                  disabled={getInputProductsQuery.data?.data.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Elije una materia prima" />
                  </SelectTrigger>
                  <SelectContent>
                    {
                      getInputProductsQuery.isLoading ? (
                        <SelectItem disabled value="none">
                          Cargando insumos...
                        </SelectItem>
                      ) : (
                        getInputProductsQuery.data?.data.map((inputProduct: InputProduct) => (
                          inputProduct.status === InputProductStatus.ACTIVE && (
                            <SelectItem key={inputProduct.id} value={inputProduct.id!}>
                              {inputProduct.name}
                            </SelectItem>
                          )
                        ))
                      )
                    }
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={clearInputProduct}
                      type="button"
                      disabled={getInputProductsQuery.data?.data.length === 0}
                    >
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Resetear insumo</p>
                  </TooltipContent>
                </Tooltip>

              </div>
            )
          }
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label
            htmlFor="measureUnitValue"
            className={cn("", product.inputProductId && 'after:ml-0.5 after:text-red-500 after:content-["*"]')}
          >
            Cantidad {product.inputProductId ? `en ${getInputProduct(product.inputProductId)}` : ''}
          </Label>
          <Input
            type="number"
            id="measureUnitValue"
            name="measureUnitValue"
            placeholder="Ejemplo: 50"
            value={product.measureUnitValue}
            onChange={handleChange}
            disabled={product.inputProductId === ''}
          />
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="minStock">
            Stock mínimo
          </Label>
          <Input
            type="number"
            id="minStock"
            name="minStock"
            placeholder="Ejemplo: 50"
            value={product.minStock}
            onChange={handleChange}
            disabled={product.inputProductId !== ''}
          />
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full mb-4">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descripción del producto"
          value={product.description}
          onChange={(e) => setProduct({ ...product, description: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="tags">Etiquetas</Label>
        <div className="flex flex-wrap gap-2 w-full min-h-10 border-2 p-2 border-dashed rounded-lg">
          {
            product.tags?.map((tag, index) => (
              <Badge
                variant="default"
                key={index}
              >
                {tag}
                <span className="ml-2 cursor-pointer hover:text-red-500" onClick={() => removeTag(tag)}>
                  <X className="size-3" />
                </span>
              </Badge>
            ))
          }
        </div>
        <div className="flex items-center gap-2">
          <Input
            ref={tagRef}
            type="text"
            id="tags"
            name="tags"
            placeholder="Nombre de etiqueta"
          />
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={handleAddTag}
            size="icon"
          >
            <Plus />
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full mt-6">
        <Label>Características</Label>
        <div className="space-y-4">
          {/* Lista de características existentes */}
          {product.characteristics?.map((char, charIndex) => (
            <div key={charIndex} className="space-y-2 p-4 border rounded-lg">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">{char.name}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCharacteristic(charIndex)}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Ítems de la característica */}
              <div className="flex flex-wrap gap-2">
                {char.items?.map((item, itemIndex) => (
                  <Badge key={itemIndex} className="pl-2">
                    {item.value}
                    <span
                      onClick={() => removeCharacteristicItem(charIndex, itemIndex)}
                      className="hover:text-red-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </Badge>
                ))}
              </div>

              {/* Input para agregar nuevo ítem */}
              <div className="flex gap-2 mt-2">
                <Input
                  value={newCharacteristicItems[charIndex] || ''}
                  onChange={(e) => setNewCharacteristicItems(prev => ({
                    ...prev,
                    [charIndex]: e.target.value
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCharacteristicItem(charIndex);
                    }
                  }}
                  placeholder="Agregar ítem"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleAddCharacteristicItem(charIndex)}
                  size="icon"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Input para agregar nueva característica */}
          <div className="flex gap-2">
            <Input
              value={newCharacteristic}
              onChange={(e) => setNewCharacteristic(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCharacteristic();
                }
              }}
              placeholder="Nueva característica"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={handleAddCharacteristic}
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
        >
          {
            isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" />
                <span>{data ? "Actualizando producto" : "Creando producto"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus />
                <span>{data ? "Actualizar producto" : "Crear producto"}</span>
              </div>
            )
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateProductRawMaterialForm;
