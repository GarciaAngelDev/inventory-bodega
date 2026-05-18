"use client";

import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const chartData = [
  { date: "2024-04-01", sales: 222, orders: 150 },
  { date: "2024-04-02", sales: 97, orders: 180 },
  { date: "2024-04-03", sales: 167, orders: 120 },
  { date: "2024-04-04", sales: 242, orders: 260 },
  { date: "2024-04-05", sales: 373, orders: 290 },
  { date: "2024-04-06", sales: 301, orders: 340 },
  { date: "2024-04-07", sales: 245, orders: 180 },
  { date: "2024-04-08", sales: 409, orders: 320 },
  { date: "2024-04-09", sales: 59, orders: 110 },
  { date: "2024-04-10", sales: 261, orders: 190 },
  { date: "2024-04-11", sales: 327, orders: 350 },
  { date: "2024-04-12", sales: 292, orders: 210 },
  { date: "2024-04-13", sales: 342, orders: 380 },
  { date: "2024-04-14", sales: 137, orders: 220 },
  { date: "2024-04-15", sales: 120, orders: 170 },
  { date: "2024-04-16", sales: 138, orders: 190 },
  { date: "2024-04-17", sales: 446, orders: 360 },
  { date: "2024-04-18", sales: 364, orders: 410 },
  { date: "2024-04-19", sales: 243, orders: 180 },
  { date: "2024-04-20", sales: 89, orders: 150 },
  { date: "2024-04-21", sales: 137, orders: 200 },
  { date: "2024-04-22", sales: 224, orders: 170 },
  { date: "2024-04-23", sales: 138, orders: 230 },
  { date: "2024-04-24", sales: 387, orders: 290 },
  { date: "2024-04-25", sales: 215, orders: 250 },
  { date: "2024-04-26", sales: 75, orders: 130 },
  { date: "2024-04-27", sales: 383, orders: 420 },
  { date: "2024-04-28", sales: 122, orders: 180 },
  { date: "2024-04-29", sales: 315, orders: 240 },
  { date: "2024-04-30", sales: 454, orders: 380 },
  { date: "2024-05-01", sales: 165, orders: 220 },
  { date: "2024-05-02", sales: 293, orders: 310 },
  { date: "2024-05-03", sales: 247, orders: 190 },
  { date: "2024-05-04", sales: 385, orders: 420 },
  { date: "2024-05-05", sales: 481, orders: 390 },
  { date: "2024-05-06", sales: 498, orders: 520 },
  { date: "2024-05-07", sales: 388, orders: 300 },
  { date: "2024-05-08", sales: 149, orders: 210 },
  { date: "2024-05-09", sales: 227, orders: 180 },
  { date: "2024-05-10", sales: 293, orders: 330 },
  { date: "2024-05-11", sales: 335, orders: 270 },
  { date: "2024-05-12", sales: 197, orders: 240 },
  { date: "2024-05-13", sales: 197, orders: 160 },
  { date: "2024-05-14", sales: 448, orders: 490 },
  { date: "2024-05-15", sales: 473, orders: 380 },
  { date: "2024-05-16", sales: 338, orders: 400 },
  { date: "2024-05-17", sales: 499, orders: 420 },
  { date: "2024-05-18", sales: 315, orders: 350 },
  { date: "2024-05-19", sales: 235, orders: 180 },
  { date: "2024-05-20", sales: 177, orders: 230 },
  { date: "2024-05-21", sales: 82, orders: 140 },
  { date: "2024-05-22", sales: 81, orders: 120 },
  { date: "2024-05-23", sales: 252, orders: 290 },
  { date: "2024-05-24", sales: 294, orders: 220 },
  { date: "2024-05-25", sales: 201, orders: 250 },
  { date: "2024-05-26", sales: 213, orders: 170 },
  { date: "2024-05-27", sales: 420, orders: 460 },
  { date: "2024-05-28", sales: 233, orders: 190 },
  { date: "2024-05-29", sales: 78, orders: 130 },
  { date: "2024-05-30", sales: 340, orders: 280 },
  { date: "2024-05-31", sales: 178, orders: 230 },
  { date: "2024-06-01", sales: 178, orders: 200 },
  { date: "2024-06-02", sales: 470, orders: 410 },
  { date: "2024-06-03", sales: 103, orders: 160 },
  { date: "2024-06-04", sales: 439, orders: 380 },
  { date: "2024-06-05", sales: 88, orders: 140 },
  { date: "2024-06-06", sales: 294, orders: 250 },
  { date: "2024-06-07", sales: 323, orders: 370 },
  { date: "2024-06-08", sales: 385, orders: 320 },
  { date: "2024-06-09", sales: 438, orders: 480 },
  { date: "2024-06-10", sales: 155, orders: 200 },
  { date: "2024-06-11", sales: 92, orders: 150 },
  { date: "2024-06-12", sales: 492, orders: 420 },
  { date: "2024-06-13", sales: 81, orders: 130 },
  { date: "2024-06-14", sales: 426, orders: 380 },
  { date: "2024-06-15", sales: 307, orders: 350 },
  { date: "2024-06-16", sales: 371, orders: 310 },
  { date: "2024-06-17", sales: 475, orders: 520 },
  { date: "2024-06-18", sales: 107, orders: 170 },
  { date: "2024-06-19", sales: 341, orders: 290 },
  { date: "2024-06-20", sales: 408, orders: 450 },
  { date: "2024-06-21", sales: 169, orders: 210 },
  { date: "2024-06-22", sales: 317, orders: 270 },
  { date: "2024-06-23", sales: 480, orders: 530 },
  { date: "2024-06-24", sales: 132, orders: 180 },
  { date: "2024-06-25", sales: 141, orders: 190 },
  { date: "2024-06-26", sales: 434, orders: 380 },
  { date: "2024-06-27", sales: 448, orders: 490 },
  { date: "2024-06-28", sales: 149, orders: 200 },
  { date: "2024-06-29", sales: 103, orders: 160 },
  { date: "2024-06-30", sales: 446, orders: 400 },
]
const chartConfig = {
  sales: {
    label: "Ventas",
    color: "var(--chart-1)",
  },
  orders: {
    label: "Órdenes",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const SaleChart = () => {

  const [sales, setSales] = useState(5200)
  const [orders, setOrders] = useState(520)

  const [timeRange, setTimeRange] = useState("7d")
  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="w-full pt-0">
      <CardHeader className="flex flex-col sm:items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Análisis de Ventas</CardTitle>
          <CardDescription>
            Tendencias de ventas y órdenes
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-full sm:w-[160px] rounded-lg sm:ml-auto flex"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Últimos 7 días" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 días
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 días
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6 h-[340px]">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-full w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-sales)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillOrders" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-orders)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="orders"
              type="natural"
              fill="url(#fillOrders)"
              stroke="var(--color-orders)"
              stackId="a"
            />
            <Area
              dataKey="sales"
              type="natural"
              fill="url(#fillSales)"
              stroke="var(--color-sales)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="border-t">
        <div className="flex justify-evenly items-center w-full">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold">{sales.toLocaleString()}</h2>
            <span className="text-sm text-muted-foreground">Ventas</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold">{orders.toLocaleString()}</h2>
            <span className="text-sm text-muted-foreground">Órdenes</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SaleChart;
