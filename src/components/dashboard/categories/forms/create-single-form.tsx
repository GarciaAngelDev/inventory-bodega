"use client";

import { useEffect } from "react";
import { Loader, Plus } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useCategoryForm } from "@/stores/create-category.store";
import { createCategoryValidation } from "@/validations/category.validation";
import { createCategory, updateCategory } from "@/actions/categories.action";
import { useCategories } from "@/hooks/useCategories";

import { Category } from "@/types/category";

interface CreateSingleFormProps {
  data?: Category;
  onOpenChange?: (open: boolean) => void;
}

const CreateSingleForm = ({ data, onOpenChange }: CreateSingleFormProps) => {

  const { category, setCategory, isSubmitting, setIsSubmitting, resetCategory } = useCategoryForm();

  const { getCategoriesQuery } = useCategories({});

  useEffect(() => {
    if (data) {
      setCategory(data);
    }
  }, [data]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const error = createCategoryValidation(category);
    if (error) {
      toast.error(error);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if(data) {
        await updateCategory(data.id!, category);
      } else {
        await createCategory(category);
      }
      getCategoriesQuery.refetch();
      toast.success(data ? "Categoria actualizada exitosamente" : "Categoria creada exitosamente");
      if(onOpenChange) {
        onOpenChange(false);
      }
      resetCategory();
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      if(error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al crear la categoria');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="flex flex-col gap-2 w-full mb-4">
        <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Nombre de la categoria"
          value={category.name}
          onChange={(e) => setCategory({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descripción de la categoria"
          value={category.description}
          onChange={(e) => setCategory({ description: e.target.value })}
        />
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
                <span>{ data ? "Actualizando categoria" : "Creando categoria" }</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus />
                <span>{ data ? "Actualizar categoria" : "Crear categoria" }</span>
              </div>
            )
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateSingleForm;
