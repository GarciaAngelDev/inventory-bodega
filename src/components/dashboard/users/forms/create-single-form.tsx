"use client";

import { useEffect, useState } from "react";
import { Loader, Plus } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { useUserForm } from "@/stores/create-user.store";
import { useUsers } from "@/hooks/useUsers";
import { createUserAction, updateUserAction } from "@/actions/user.action";
import { User, UserRole } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface CreateSingleFormProps {
  data?: User;
  onOpenChange?: (open: boolean) => void;
}

const CreateSingleForm = ({ data, onOpenChange }: CreateSingleFormProps) => {

  const [loadingSelects, setLoadingSelects] = useState(true);

  const { user, setUser, isSubmitting, setIsSubmitting, resetUser } = useUserForm();

  const { getUsersQuery } = useUsers({});

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  useEffect(() => {
    // timeput de 500ms
    const timeout = setTimeout(() => {
      setLoadingSelects(false);
    }, 10);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      if (data) {
        await updateUserAction(data.id!, user);
      } else {
        await createUserAction(user.name, user.email, user.password, user.role!);
      }
      getUsersQuery.refetch();
      toast.success(data ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente");
      if (onOpenChange) {
        onOpenChange(false);
      }
      resetUser();
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al crear el usuario');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="overflow-y-auto">
      <div className="flex flex-col gap-2 w-full mb-4">
        <Label htmlFor="name" className="after:ml-0.5 after:text-red-500 after:content-['*']">Nombre completo</Label>
        <Input
          type="text"
          id="name"
          name="name"
          placeholder="Nombre del usuario"
          value={user.name}
          onChange={(e) => setUser({ name: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 w-full mb-4">
        <Label htmlFor="email" className="after:ml-0.5 after:text-red-500 after:content-['*']">Correo electrónico</Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Correo del usuario"
          value={user.email}
          onChange={(e) => setUser({ email: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 w-full mb-4">
        <Label htmlFor="password">{data ? "Actualizar contraseña" : "Contraseña"}</Label>
        <Input
          type="password"
          id="password"
          name="password"
          placeholder="Contraseña del usuario"
          value={user.password}
          onChange={(e) => setUser({ password: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2 w-full">
        <Label htmlFor="role" className="after:ml-0.5 after:text-red-500 after:content-['*']">Rol</Label>
        {
          loadingSelects ? (
            <Skeleton className="w-full h-9" />
          ) : (
            <Select value={user.role} onValueChange={(value) => setUser({ role: value as UserRole })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rol del usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                <SelectItem value={UserRole.AUXILIAR}>Auxiliar</SelectItem>
                <SelectItem value={UserRole.INVENTORY}>Gestor de Inventario</SelectItem>
                <SelectItem value={UserRole.PRODUCER}>Productor</SelectItem>
                <SelectItem value={UserRole.SELLER}>Gestor de Ventas</SelectItem>
              </SelectContent>
            </Select>
          )
        }
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
                <span>{data ? "Actualizando usuario" : "Creando usuario"}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus />
                <span>{data ? "Actualizar usuario" : "Crear usuario"}</span>
              </div>
            )
          }
        </Button>
      </div>
    </form>
  );
};

export default CreateSingleForm;
