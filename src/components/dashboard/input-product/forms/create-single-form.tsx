"use client";

import { useEffect, useState } from "react";
import { Loader, Plus } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { InputProduct, MeasureUnit } from "@/types";
import { useInputProductForm } from "@/stores/create-input-product.store";
import { createInputProduct, updateInputProduct } from "@/actions/input-product.action";
import { Skeleton } from "@/components/ui/skeleton";
import { useInputProducts } from "@/hooks/useInputProduct";
import { createInputProductValidation } from "@/validations/input-product.validation";

interface CreateSingleFormProps {
  data?: InputProduct;
  onOpenChange?: (open: boolean) => void;
}

const CreateSingleForm = ({ data, onOpenChange }: CreateSingleFormProps) => {

  const { inputProduct, setInputProduct, isSubmitting, setIsSubmitting, resetInputProduct } = useInputProductForm();

  const { getInputProductsQuery } = useInputProducts({}); // TODO: fix this

  const [loadingSelects, setLoadingSelects] = useState(true);

  useEffect(() => {
    if (data) {
      setInputProduct(data);
    }
  }, [data]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingSelects(false);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = createInputProductValidation(inputProduct);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);

    try {
      if (data) {
        await updateInputProduct(data.id!, inputProduct);
      } else {
        await createInputProduct(inputProduct);
      }
      getInputProductsQuery.refetch();
      toast.success(data ? "Insumo actualizado exitosamente" : "Insumo creado exitosamente");
      if (onOpenChange) {
        onOpenChange(false);
      }
      resetInputProduct();
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al crear el insumo');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="flex flex-col sm:flex-row gap-2 w-full mb-4">
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre</Label>
          <Input
            type="text"
            id="name"
            name="name"
            placeholder="Ejemplo: Harina de trigo"
            value={inputProduct.name}
            onChange={(e) => setInputProduct({ name: e.target.value })}
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="measureUnit" className="after:ml-0.5 after:text-red-500 after:content-['*']">Unidad de Medida</Label>
            {
              loadingSelects ? (
                <Skeleton className="w-full h-9" />
              ) : (
                <Select
                  value={inputProduct.measureUnit}
                  onValueChange={(value) => setInputProduct({ measureUnit: value as MeasureUnit })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Unidad de Medida" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KG">Kilogramos</SelectItem>
                    <SelectItem value="G">Gramos</SelectItem>
                    <SelectItem value="L">Litros</SelectItem>
                    <SelectItem value="ML">Mililitros</SelectItem>
                    {/* <SelectItem value="UND">Unidades</SelectItem> */}
                  </SelectContent>
                </Select>
              )
            }
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="minQuantity">Cantidad Mínima</Label>
            <Input
              type="number"
              id="minQuantity"
              name="minQuantity"
              placeholder="Cantidad Mínima"
              value={inputProduct.minQuantity}
              onChange={(e) => setInputProduct({ minQuantity: Number(e.target.value) })}
            />
          </div>
        </div>

      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descripción del Insumo"
          value={inputProduct.description}
          onChange={(e) => setInputProduct({ description: e.target.value })}
        />
      </div>

      <div className="mt-6 flex items-center justify-center">
        <Button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto"
        >
          {
            isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader className="animate-spin" />
                <span>{data ? "Actualizando insumo" : "Creando insumo"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus />
                <span>{data ? "Actualizar insumo" : "Crear insumo"}</span>
              </div>
            )
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateSingleForm;
