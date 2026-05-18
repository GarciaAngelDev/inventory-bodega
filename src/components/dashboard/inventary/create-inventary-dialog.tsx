"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useEffect } from "react";
import { Inventory } from "@/types";
import CreateSingleForm from "./forms/create-single-form";
import { useInventaryForm } from "@/stores/create-inventary.store";
import { CreateInventoryData } from "@/types/inventary";

interface CreateInventaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: CreateInventoryData;
}

const CreateInventaryDialog = ({ open, onOpenChange, data }: CreateInventaryDialogProps) => {

  const { resetForm } = useInventaryForm();

  useEffect(() => {
    if (!open && data) {
      resetForm();
    }
  }, [open, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl w-full overflow-y-auto max-h-[calc(100vh-10rem)]">
        <DialogHeader>
          <DialogTitle>{data ? "Editar inventario" : "Crear inventario"}</DialogTitle>
          <DialogDescription>{data ? "Editar los datos del inventario" : "Ingresa los datos del inventario"}</DialogDescription>
        </DialogHeader>
        <CreateSingleForm data={data} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateInventaryDialog;
