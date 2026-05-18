"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, Ban, Check, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreateCategoryDialog from "./create-input-product-dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { MeasureUnit, InputProduct, InputProductStatus } from "@/types";
import { useInputProducts } from "@/hooks/useInputProduct";
import { Badge } from "@/components/ui/badge";
import { deleteInputProduct, updateInputProduct } from "@/actions/input-product.action";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import DataTable from "@/components/data-table";
import { ColumnDef } from "@tanstack/react-table";

interface InputProductTableProps extends HTMLAttributes<HTMLDivElement> {
  inputProducts: InputProduct[];
  isLoading: boolean;
  onSearch: (search: string) => void;
  pagination?: {
    limit: number;
    currentPage: number;
  };
}

const InputProductTable = ({ inputProducts, isLoading, onSearch, pagination, ...props }: InputProductTableProps) => {

  const { getInputProductsQuery } = useInputProducts({}); // TODO: fix this

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedInputProduct, setSelectedInputProduct] = useState<InputProduct | null>(null);

  const handleEdit = (inputProduct: InputProduct) => {
    setSelectedInputProduct(inputProduct);
    setOpen(true);
  };

  const handleToggleStatus = async (inputProduct: InputProduct) => {
    try {
      await updateInputProduct(inputProduct.id!, { ...inputProduct, status: inputProduct.status === InputProductStatus.ACTIVE ? InputProductStatus.INACTIVE : InputProductStatus.ACTIVE });
      await getInputProductsQuery.refetch()
      toast.success(`Insumo ${inputProduct.status === InputProductStatus.ACTIVE ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.log(error);
      toast.error('Error al cambiar el estado del insumo');
    }
  }

  const handleDelete = async (inputProduct: InputProduct) => {
    try {
      await deleteInputProduct(inputProduct.id!);
      await getInputProductsQuery.refetch()
      toast.success(`Insumo ${inputProduct.name} eliminado exitosamente`);
      setOpenDelete(false);
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.error);
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error('Error al eliminar el insumo');
    }
  };

  const handleCancel = () => {
    setOpenDelete(false);
    setSelectedInputProduct(null);
  };

  const columns: ColumnDef<InputProduct>[] = [
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
      id: "measureUnit",
      accessorKey: "measureUnit",
      meta: "Unidad de Medida",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Unidad de Medida
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="px-4">
          <Badge variant="outline">
            {
              row.original.measureUnit == MeasureUnit.KG ? "Kilogramos" :
                row.original.measureUnit == MeasureUnit.G ? "Gramos" :
                  row.original.measureUnit == MeasureUnit.L ? "Litros" :
                    row.original.measureUnit == MeasureUnit.ML ? "Mililitros" :
                      ""
            }
          </Badge>
        </div>
      ),
    },
    {
      id: "minQuantity",
      accessorKey: "minQuantity",
      meta: "Cantidad Mínima",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Cantidad Mínima
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="uppercase px-4">{row.original.minQuantity} {row.original.measureUnit}</div>,
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
          <Badge className={cn("", row.original.status === InputProductStatus.ACTIVE ? "bg-green-500/20 text-green-500 border-green-300" : "bg-red-500/20 text-red-500 border-red-300")}>
            {
              row.original.status == InputProductStatus.ACTIVE ? "Activo" :
                row.original.status == InputProductStatus.INACTIVE ? "Inactivo" :
                  ""
            }
          </Badge>
        </div>
      ),
    },
    {
      id: "actions",
      accessorKey: "actions",
      meta: "Acciones",
      size: 160,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Acciones
            <ArrowUpDown />
          </Button>
        )
      },
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
                {row.original.status === InputProductStatus.ACTIVE ? <Ban /> : <Check />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.status === InputProductStatus.ACTIVE ? 'Desactivar insumo' : 'Activar insumo'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedInputProduct(row.original);
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
      <CreateCategoryDialog open={open} onOpenChange={setOpen} data={selectedInputProduct!} />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro de eliminar el insumo {selectedInputProduct?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esto eliminara permanentemente el insumo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedInputProduct!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div {...props}>
        <DataTable
          columns={columns}
          data={inputProducts}
          initialVisibleColumns={["name", "measureUnit", "minQuantity", "status", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay insumos registrados"
          onSearch={onSearch}
          searchLoading={isLoading}
        />
      </div>
    </>
  )
}

export default InputProductTable