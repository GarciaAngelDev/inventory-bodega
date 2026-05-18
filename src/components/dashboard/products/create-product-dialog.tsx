"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateSingleForm from "./forms/create-single-form";

import { CreateProductData } from "@/types";
import { useEffect } from "react";
import { useProductForm } from "@/stores/create-product.store";

interface CreateProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: CreateProductData;
}

const CreateProductDialog = ({ open, onOpenChange, data }: CreateProductDialogProps) => {

  const { resetProduct } = useProductForm();

  useEffect(() => {
    if (!open && data) {
      resetProduct();
    }
  }, [open, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl w-full overflow-y-auto max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <DialogTitle>{data ? "Editar producto" : "Crear producto"}</DialogTitle>
          <DialogDescription>{data ? "Editar los datos del producto" : "Ingresa los datos del producto"}</DialogDescription>
        </DialogHeader>
        <CreateSingleForm data={data} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateProductDialog;
