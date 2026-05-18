"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, Ban, Check, Edit, Trash, X } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreateCategoryDialog from "./create-category-dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { Category, CategoryStatus } from "@/types/category";
import { deleteCategory, updateCategory } from "@/actions/categories.action";
import { useCategories } from "@/hooks/useCategories";
import { AxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/data-table";

interface CategoryTableProps extends HTMLAttributes<HTMLDivElement> {
  categories: Category[];
  isLoading: boolean;
  onSearchChange: (query: string) => void;
  pagination?: {
    limit: number;
    currentPage: number;
  };
}

const CategoryTable = ({ categories, isLoading, pagination, onSearchChange, ...props }: CategoryTableProps) => {

  const { getCategoriesQuery } = useCategories({});

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setOpen(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      // const response = await updateCategory(category.id!, { ...category, status: CategoryStatus.INACTIVE });
      await deleteCategory(category.id!);
      await getCategoriesQuery.refetch()
      toast.success('Categoria eliminada exitosamente');
      setOpenDelete(false);
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al eliminar la categoria');
    }
  };

  const handleToggleStatus = async (category: Category) => {
    try {
      await updateCategory(category.id!, { ...category, status: category.status === CategoryStatus.ACTIVE ? CategoryStatus.INACTIVE : CategoryStatus.ACTIVE });
      await getCategoriesQuery.refetch()
      toast.success(`Categoría ${category.status === CategoryStatus.ACTIVE ? 'desactivada' : 'activada'} exitosamente`);
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      toast.error('Error al cambiar el estado de la categoria');
    }
  };

  const handleCancel = () => {
    setOpenDelete(false);
    setSelectedCategory(null);
  };

  const columns: ColumnDef<Category>[] = [
    {
      id: "name",
      accessorKey: "name",
      meta: "Nombre",
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
      cell: ({ row }) => <div className="capitalize px-4">{row.getValue("name")}</div>,
    },
    {
      id: "description",
      accessorKey: "description",
      meta: "Descripción",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Descripción
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="px-4">{row.getValue("description")}</div>,
    },
    {
      id: "status",
      accessorKey: "status",
      meta: "Estado",
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
          <Badge className={cn("select-none", row.original.status === CategoryStatus.ACTIVE ? 'bg-green-500/20 border border-green-300 text-green-500' : 'bg-red-500/20 border border-red-300 text-red-500')}>
            {row.original.status === CategoryStatus.ACTIVE ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "actions",
      meta: "Acciones",
      header: "Acciones",
      size: 160,
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
                onClick={() => handleToggleStatus(row.original)}
              >
                {row.original.status === CategoryStatus.ACTIVE ? <Ban /> : <Check />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.status === CategoryStatus.ACTIVE ? 'Desactivar categoría' : 'Activar categoría'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedCategory(row.original);
                  setOpenDelete(true);
                }}
              >
                <Trash />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Eliminar</p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <>
      <CreateCategoryDialog open={open} onOpenChange={setOpen} data={selectedCategory!} />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro de eliminar la categoria {selectedCategory?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esto eliminara permanentemente la categoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedCategory!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div {...props}>
      <DataTable
          columns={columns}
          data={categories}
          initialVisibleColumns={["name", "description", "status", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay categorías registradas"
          onSearch={onSearchChange}
          searchLoading={isLoading}
        />
      </div>
    </>
  )
}

export default CategoryTable