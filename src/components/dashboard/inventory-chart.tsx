"use client";

import { useState } from "react";
import { Search, Package, BarChart2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Input } from "../ui/input";
import { Skeleton } from "../ui/skeleton";
import { DashboardInventoryStatus } from "@/types/dashboard";

interface InventoryChartProps {
  data?: DashboardInventoryStatus;
  loading: boolean;
}

const InventoryChart = ({ data, loading }: InventoryChartProps) => {
  const [inventoryType, setInventoryType] = useState<"sale" | "internal">("sale");
  const [search, setSearch] = useState("");

  const currentData = data?.[inventoryType];
  const products = currentData?.products || [];

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  // Calcular totales
  const totalInitial = filteredProducts.reduce((acc, p) => acc + p.initialStock, 0);
  const totalCurrent = filteredProducts.reduce((acc, p) => acc + p.currentStock, 0);
  const totalDifference = filteredProducts.reduce((acc, p) => acc + p.difference, 0);

  return (
    <Card className="w-full pt-0 flex flex-col md:col-span-1">
      <CardHeader className="p-3.5 border-b flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-foreground">
            <BarChart2 className="h-4 w-4 text-blue-500" />
            Movimiento de Stock
          </CardTitle>
          <span className="ml-5 text-[10px] text-muted-foreground font-medium">
            Inicial vs Actual
          </span>
        </div>

        {/* Controles de búsqueda y filtrado integrados y compactos */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7.5 h-8 text-[11px] rounded-lg bg-muted/10 border-muted-foreground/10 focus-visible:ring-1"
            />
          </div>
          <Select value={inventoryType} onValueChange={(value) => setInventoryType(value as "sale" | "internal")}>
            <SelectTrigger className="w-[90px] h-8 text-[11px] rounded-lg bg-background border-muted-foreground/10 flex" aria-label="Tipo">
              <SelectValue placeholder="Venta" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="sale" className="rounded-lg text-[11px]">
                Ventas
              </SelectItem>
              <SelectItem value="internal" className="rounded-lg text-[11px]">
                Interno
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0 overflow-auto h-[340px]">
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
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No se encontraron productos</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Prueba con otro término de búsqueda" : "No hay registros de inventario disponibles"}
            </p>
          </div>
        ) : (
          <Table className="w-full">
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="text-[10px] sm:text-xs font-semibold px-2 py-2 sm:px-4 sm:py-3">Producto</TableHead>
                <TableHead className="text-right text-[10px] sm:text-xs font-semibold w-[55px] sm:w-[75px] px-1 py-2 sm:px-4 sm:py-3">Inicial</TableHead>
                <TableHead className="text-right text-[10px] sm:text-xs font-semibold w-[55px] sm:w-[75px] px-1 py-2 sm:px-4 sm:py-3">Actual</TableHead>
                <TableHead className="text-right text-[10px] sm:text-xs font-semibold w-[55px] sm:w-[75px] px-1 py-2 sm:px-4 sm:py-3">Dif.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const percentage = product.initialStock > 0
                  ? Math.min(100, (product.difference / product.initialStock) * 100)
                  : 0;

                // Definir colores y avisos según el stock actual
                const isOutOfStock = product.currentStock <= 0;

                return (
                  <TableRow key={product.id} className="hover:bg-muted/30">
                    <TableCell className="py-2 px-2 sm:py-2.5 sm:px-4">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-semibold text-[11px] sm:text-xs text-foreground capitalize max-w-[110px] sm:max-w-none line-clamp-2 break-words whitespace-normal leading-tight">
                          {product.name}
                        </span>
                        <div className="w-full bg-secondary h-1 rounded-full overflow-hidden mt-1">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 px-1 sm:py-2.5 sm:px-4 font-medium text-[11px] sm:text-xs text-muted-foreground">
                      {product.initialStock} <span className="text-[9px] sm:text-[10px]">{product.measureUnit !== "UNIDAD" ? product.measureUnit : ""}</span>
                    </TableCell>
                    <TableCell className={`text-right py-2 px-1 sm:py-2.5 sm:px-4 font-semibold text-[11px] sm:text-xs ${isOutOfStock ? "text-red-500" : "text-foreground"}`}>
                      {product.currentStock} <span className="text-[9px] sm:text-[10px]">{product.measureUnit !== "UNIDAD" ? product.measureUnit : ""}</span>
                    </TableCell>
                    <TableCell className="text-right py-2 px-1 sm:py-2.5 sm:px-4 font-semibold text-[11px] sm:text-xs text-blue-500">
                      {product.difference > 0 ? `-${product.difference}` : product.difference} <span className="text-[9px] sm:text-[10px]">{product.measureUnit !== "UNIDAD" ? product.measureUnit : ""}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CardFooter className="border-t py-3 px-4 bg-muted/20 flex flex-col gap-2 text-xs">
        <div className="flex justify-between w-full font-medium text-muted-foreground">
          <span>Totales del Periodo</span>
        </div>
        <div className="grid grid-cols-3 gap-2 w-full text-center border-t pt-2">
          <div>
            <p className="text-[10px] text-muted-foreground">Inicial total</p>
            <p className="font-bold text-foreground text-sm">{parseFloat(totalInitial.toFixed(2))}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Actual total</p>
            <p className="font-bold text-foreground text-sm">{parseFloat(totalCurrent.toFixed(2))}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Vendidos / Dif.</p>
            <p className="font-bold text-emerald-600 text-sm">-{parseFloat(totalDifference.toFixed(2))}</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InventoryChart;
