"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import { useEffect } from "react";
import { Category } from "@/types/category";
import CreateSingleForm from "./forms/create-single-form";
import { useCategoryForm } from "@/stores/create-category.store";

interface CreateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: Category;
}

const CreateCategoryDialog = ({ open, onOpenChange, data }: CreateCategoryDialogProps) => {

  const { resetCategory } = useCategoryForm();

  useEffect(() => {
    if (!open && data) {
      resetCategory();
    }
  }, [open, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data ? "Editar categoría" : "Crear categoría"}</DialogTitle>
          <DialogDescription>{data ? "Editar los datos de la categoría" : "Ingresa los datos de la categoría"}</DialogDescription>
        </DialogHeader>
        <CreateSingleForm data={data} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateCategoryDialog;
