"use client";

import { useState } from "react";
import { Pie, PieChart, Sector } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { PieSectorDataItem } from "recharts/types/polar/Pie";

const chartData = [
  { inventary: "avaliable", value: 275, fill: "var(--color-avaliable)" },
  { inventary: "lowStock", value: 15, fill: "var(--color-lowStock)" },
  { inventary: "outOfStock", value: 7, fill: "var(--color-outOfStock)" },
  { inventary: "reserved", value: 2, fill: "var(--color-reserved)" },
]

const chartConfig = {
  avaliable: {
    label: "Disponible",
    color: "var(--chart-1)",
  },
  lowStock: {
    label: "Stock Bajo",
    color: "var(--chart-2)",
  },
  outOfStock: {
    label: "Agotado",
    color: "var(--chart-3)",
  },
  reserved: {
    label: "Reservado",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

const InventoryChart = () => {

  const [inventoryType, setInventoryType] = useState<"sale" | "internal">("sale");
  const [totalProducts, setTotalProducts] = useState(7512);

  return (
    <Card className="w-full pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Estado del Inventario</CardTitle>
          <CardDescription>
            Distribución por estado
          </CardDescription>
        </div>
        <Select value={inventoryType} onValueChange={(value) => setInventoryType(value as "sale" | "internal")}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Elije una opción"
          >
            <SelectValue placeholder="Venta" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="sale" className="rounded-lg">
              Venta
            </SelectItem>
            <SelectItem value="internal" className="rounded-lg">
              Interno
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 max-h-[340px] h-full">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Pie
              data={chartData}
              dataKey="value"
              nameKey="inventary"
              innerRadius={60}
              strokeWidth={5}
              activeIndex={0}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 10} />
              )}
            />
          </PieChart>
        </ChartContainer>
        <div className="flex justify-center mt-2">
          <div className="max-w-xs w-full grid grid-cols-2 gap-2">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold capitalize">
                    {
                      item.inventary === "avaliable" ? "Disponible" :
                        item.inventary === "lowStock" ? "Stock Bajo" :
                          item.inventary === "outOfStock" ? "Agotado" :
                            item.inventary === "reserved" ? "Reservado" : ""
                    }
                  </span>: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex justify-center  w-full">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold">{totalProducts.toLocaleString()}</h2>
            <span className="text-sm text-muted-foreground">Productos totales</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InventoryChart;
