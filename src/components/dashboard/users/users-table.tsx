"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, Edit, UserRoundCheck, UserRoundX } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { User, UserRole, UserStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import DataTable from "@/components/data-table";
import CreateUserDialog from "./create-user-dialog";
import { updateUserAction } from "@/actions/user.action";
import { useUsers } from "@/hooks/useUsers";
import { cn } from "@/lib/utils";

interface UsersTableProps extends HTMLAttributes<HTMLDivElement> {
  users: User[];
  isLoading: boolean;
  pagination?: {
    limit: number;
    currentPage: number;
  };
  onSearch: (search: string) => void;
}

const UsersTable = ({ users, isLoading, pagination, onSearch, ...props }: UsersTableProps) => {

  const { getUsersQuery } = useUsers({});

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleStatusChange = async (user: User, newStatus: UserStatus) => {
    try {
      await updateUserAction(user.id!, { ...user, status: newStatus });
      await getUsersQuery.refetch()
      toast.success(`Se ${newStatus === UserStatus.ACTIVE ? 'activo' : 'desactivo'} el usuario ${user.name}`);
    } catch (error) {
      console.log(error);
      toast.error('Error al cambiar el estado del usuario');
    }
  };

  const onSearchChange = (search: string) => {
    onSearch(search);
  };

  const columns: ColumnDef<User>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nombre
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.original.name}</div>,
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Correo
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="lowercase px-4">{row.original.email}</div>,
    },
    {
      id: "role",
      accessorKey: "role",
      size: 160,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Rol
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="px-4">
          <Badge variant='outline'>
            {
              row.original.role === UserRole.ADMIN ? 'Administrador' :
                row.original.role === UserRole.AUXILIAR ? 'Auxiliar' :
                  row.original.role === UserRole.INVENTORY ? 'Gestor de Inventario' :
                    row.original.role === UserRole.PRODUCER ? 'Productor' :
                      row.original.role === UserRole.SELLER ? 'Gestor de Ventas' : 'Desconocido'
            }
          </Badge>
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      size: 160,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Estado
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="px-4">
          <Badge variant='outline' className={cn("select-none", {
            "bg-green-500/10 border-green-300 text-green-500": row.original.status === UserStatus.ACTIVE,
            "bg-red-500/10 border-red-300 text-red-500": row.original.status === UserStatus.INACTIVE,
          })}>
            {row.original.status === UserStatus.ACTIVE ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "actions",
      header: "Acciones",
      size: 120,
      cell: ({ row }) => (
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => handleEdit(row.original)}
              >
                <Edit />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => handleStatusChange(row.original, row.original.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE)}
              >
                {
                  row.original.status === UserStatus.ACTIVE ? <UserRoundX /> : <UserRoundCheck />
                }
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.status === UserStatus.ACTIVE ? 'Desactivar' : 'Activar'} usuario</p>
            </TooltipContent>
          </Tooltip>
        </div>
      )
    },
  ];

  return (
    <>
      <CreateUserDialog open={open} onOpenChange={setOpen} data={selectedUser!} />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro de eliminar el usuario {selectedUser?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esto eliminara permanentemente el usuario.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel /* onClick={handleCancel} */>Cancelar</AlertDialogCancel>
            <AlertDialogAction /* onClick={() => handleDelete(selectedInventary!)} */>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div {...props}>
        <DataTable
          data={users}
          columns={columns}
          initialVisibleColumns={["name", "email", "role", "status", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay usuarios disponibles."
          onSearch={onSearchChange}
        />
      </div>
    </>
  )
}

export default UsersTable