"use client";

import { useState, HTMLAttributes } from "react";
import { ArrowUpDown, Ban, Check, Edit, Eye, Trash } from "lucide-react";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import CreateProductDialog from "./create-product-dialog";
import { Button } from "@/components/ui/button";

import { ProductFetch, CreateProductData, ProductStatus, ProductType } from "@/types";
import { Badge } from "@/components/ui/badge";
import { deleteProduct, updateProduct } from "@/actions/products.action";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import DataTable from "@/components/data-table";
import ShowDetail from "./show-detail";

interface ProductsTableProps extends HTMLAttributes<HTMLDivElement> {
  products: ProductFetch[];
  isLoading: boolean;
  onSearch: (search: string) => void;
}

const ProductsTable = ({ products, isLoading, onSearch, ...props }: ProductsTableProps) => {

  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CreateProductData | null>(null);
  const [productId, setProductId] = useState('');
  const [openDetail, setOpenDetail] = useState(false);

  const convertData = (data: ProductFetch) => {
    const product: CreateProductData = {
      id: data.id,
      name: data.name,
      refCode: data.refCode,
      type: data.type,
      description: data.description!,
      brand: data.brand!,
      status: data.status!,
      category: data.category.name,
      tags: data.tags!,
      characteristics: data.characteristics!,
      images: data.images!,
      inputProductId: data.inputProductId || "",
      measureUnitValue: data.measureUnitValue || 0,
      minStock: data.minStock || 0,
    };
    // handleEdit(product);
    return product;
  }

  const handleDelete = async (product: CreateProductData) => {
    try {
      // const response = await updateProduct(product.id!, { ...product, status: ProductStatus.INACTIVE });
      await deleteProduct(product.id!);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado exitosamente');
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
      toast.error('Error al eliminar el producto');
    }
  };

  const handleToggleStatus = async (product: CreateProductData) => {
    try {
      await updateProduct(product.id!, { ...product, status: product.status === ProductStatus.ACTIVE ? ProductStatus.INACTIVE : ProductStatus.ACTIVE });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`Producto ${product.status === ProductStatus.ACTIVE ? 'desactivado' : 'activado'} exitosamente`);
    } catch (error) {
      console.log(error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data.message);
        return;
      }
      if (error instanceof Error) {
        toast.error(error.message);
        return;
      }
      toast.error('Error al cambiar el estado del producto');
    }
  };

  const handleCancel = () => {
    setOpenDelete(false);
    setSelectedProduct(null);
  };

  const handleDetail = (id: string) => {
    setProductId(id);
    setOpenDetail(true);
  };

  const columns: ColumnDef<ProductFetch>[] = [
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
      id: "inputProduct",
      accessorKey: "inputProduct",
      meta: "Insumo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Insumo
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.original.inputProduct?.name || "---"}</div>,
    },
    {
      id: "refCode",
      accessorKey: "refCode",
      meta: "Código",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Codigo
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.getValue("refCode")}</div>,
    },
    {
      id: "type",
      accessorKey: "type",
      meta: "Tipo",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Tipo
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.getValue("type") === ProductType.PRODUCT ? 'Producto' : 'Materia Prima'}</div>,
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
      id: "brand",
      accessorKey: "brand",
      meta: "Marca",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Marca
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.original.brand || "---"}</div>,
    },
    {
      id: "category",
      accessorKey: "category",
      meta: "Categoría",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Categoría
            <ArrowUpDown />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize px-4">{row.original.category.name}</div>,
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
          <Badge className={cn("", row.original.status === ProductStatus.ACTIVE ? 'bg-green-500/20 text-green-500 border-green-300' : 'bg-red-500/20 text-red-500 border-red-300')}>
            {row.original.status === ProductStatus.ACTIVE ? 'Activo' : 'Inactivo'}
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
                onClick={() => {
                  if (!row.original.id) return;
                  handleDetail(row.original.id);
                }}
              >
                <Eye />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver detalles</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedProduct(convertData(row.original));
                  setOpen(true);
                }}
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
                onClick={() => handleToggleStatus(convertData(row.original))}
              >
                {row.original.status === ProductStatus.ACTIVE ? <Ban /> : <Check />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{row.original.status === ProductStatus.ACTIVE ? 'Desactivar producto' : 'Activar producto'}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedProduct(convertData(row.original));
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

  const onSearchChange = (search: string) => {
    onSearch(search);
  };

  return (
    <>
      {
        productId && openDetail && (
          <ShowDetail open={openDetail} onClose={() => setOpenDetail(false)} productId={productId} />
        )
      }
      <CreateProductDialog open={open} onOpenChange={setOpen} data={selectedProduct!} />
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estas seguro de eliminar el producto {selectedProduct?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no puede ser deshecha. Esto eliminara permanentemente el producto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(selectedProduct!)}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div {...props}>
        <DataTable
          columns={columns}
          data={products}
          initialVisibleColumns={["name", "inputProduct", "refCode", "type", "brand", "status", "actions"]}
          isLoading={isLoading}
          emptyLabel="No hay productos registrados"
          onSearch={onSearchChange}
          searchLoading={isLoading}
        />
      </div>
    </>
  )
}

export default ProductsTable
