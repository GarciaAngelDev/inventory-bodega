"use client";

import { useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Skeleton } from "../ui/skeleton";
import { formatPrice } from "@/lib/format-price";
import { SoldProduct } from "@/types/dashboard";

interface TodaySoldProductsProps {
  soldProducts: SoldProduct[];
  loading: boolean;
}

const TodaySoldProducts = ({ soldProducts, loading }: TodaySoldProductsProps) => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Obtener categorías únicas
  const categories = Array.from(
    new Map(
      soldProducts
        .filter((p) => p.categoryName)
        .map((p) => [p.categoryId ?? p.categoryName, p.categoryName])
    ).entries()
  ).map(([id, name]) => ({ id, name }));

  // Filtrar productos por búsqueda y categoría
  const filteredProducts = soldProducts.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "ALL" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calcular totales basados en lista filtrada
  const maxTotal = filteredProducts.length > 0 ? Math.max(...filteredProducts.map((p) => p.total)) : 1;
  const grandTotal = filteredProducts.reduce((acc, p) => acc + p.total, 0);
  const totalItemsSold = filteredProducts.reduce((acc, p) => acc + p.quantity, 0);

  return (
    <Card className="w-full pt-0 flex flex-col md:col-span-2">
      <CardHeader className="flex flex-col sm:items-center gap-4 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Productos Vendidos</CardTitle>
          <CardDescription>
            Resumen detallado de productos vendidos en el periodo seleccionado
          </CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-[180px]">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs rounded-lg w-full"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 w-full sm:w-[160px] text-xs rounded-lg cursor-pointer">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Todas las categorías</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id} className="text-xs capitalize">
                  {cat.name.toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto max-h-[340px]">
        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="p-3 bg-muted rounded-full mb-3">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No se encontraron ventas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Prueba con otro término de búsqueda" : "No hay registros de ventas para este periodo"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-xs font-semibold">Producto</TableHead>
                <TableHead className="text-right text-xs font-semibold w-[100px]">Cantidad</TableHead>
                <TableHead className="text-right text-xs font-semibold w-[120px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const percentage = maxTotal > 0 ? (product.total / maxTotal) * 100 : 0;
                return (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="py-3">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-semibold text-xs md:text-sm text-foreground truncate capitalize">
                          {product.name}
                        </span>
                        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-3 font-medium text-xs md:text-sm text-muted-foreground">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right py-3 font-semibold text-xs md:text-sm text-foreground">
                      {formatPrice({
                        price: product.total,
                        country: { currency: "USD", locale: "en-US" },
                      })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <div className="border-t py-4 px-6 bg-muted/20 flex justify-between items-center text-xs md:text-sm">
        <div className="flex gap-4">
          <div>
            <span className="text-muted-foreground">Cant. Vendida: </span>
            <span className="font-bold text-foreground">{totalItemsSold.toLocaleString()}</span>
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Total Periodo: </span>
          <span className="font-bold text-blue-500 text-sm md:text-base">
            {formatPrice({
              price: grandTotal,
              country: { currency: "USD", locale: "en-US" },
            })}
          </span>
        </div>
      </div>
    </Card>
  );
};

export default TodaySoldProducts;
