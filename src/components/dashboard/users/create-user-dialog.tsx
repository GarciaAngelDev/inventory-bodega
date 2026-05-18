"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useEffect } from "react";
import { User } from "@/types";
import { useUserForm } from "@/stores/create-user.store";
import CreateSingleForm from "./forms/create-single-form";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data?: User;
}

const CreateUserDialog = ({ open, onOpenChange, data }: CreateUserDialogProps) => {

  const { resetUser } = useUserForm();

  useEffect(() => {
    if (!open && data) {
      resetUser();
    }
  }, [open, data]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{data ? "Editar usuario" : "Crear usuario"}</DialogTitle>
          <DialogDescription>{data ? "Editar los datos del usuario" : "Ingresa los datos del usuario"}</DialogDescription>
        </DialogHeader>
        <CreateSingleForm data={data} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;
