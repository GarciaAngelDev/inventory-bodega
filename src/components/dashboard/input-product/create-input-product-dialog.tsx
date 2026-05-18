"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


import { useEffect } from "react";
import { useInputProductForm } from "@/stores/create-input-product.store";
import CreateSingleForm from "./forms/create-single-form";
import { InputProduct } from "@/types";

interface CreateInputProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: InputProduct;
}

const CreateInputProductDialog = ({ open, onOpenChange, data }: CreateInputProductDialogProps) => {

  const { resetInputProduct } = useInputProductForm();

  useEffect(() => {
    if (!open && data) {
      resetInputProduct();
    }
  }, [open, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl w-full overflow-y-auto max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <DialogTitle>{data ? "Editar Insumo" : "Crear Insumo"}</DialogTitle>
          <DialogDescription>{data ? "Editar los datos del Insumo" : "Ingresa los datos del Insumo"}</DialogDescription>
        </DialogHeader>
        <CreateSingleForm data={data} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateInputProductDialog;
