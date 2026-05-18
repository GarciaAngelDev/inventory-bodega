"use client";

import { useEffect, useState } from "react";
import { DateRange } from "react-day-picker";
import DashboardHeader from "./dashboard-header";
import KpiCards from "./kpi-cards";
import { formatPrice } from "@/lib/format-price";
import SaleChart from "./sale-chart";
import InventoryChart from "./inventory-chart";
import { getDashboardByDateOrDateRange } from "@/actions/dashboard.action";
import { DashboardData } from "@/types/dashboard";
import { Skeleton } from "../ui/skeleton";
import LinkCards from "./link-cards";

const DashboardPage = () => {

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: undefined,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardByDateOrDateRange(dateRange!);
      setDashboardData(data);
    } catch (error) {
      console.error('Error al obtener el dashboard de ventas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const resetDashboardData = () => {
    fetchDashboardData();
    setDateRange({
      from: new Date(),
      to: undefined,
    });
  };

  return (
    <div>
      <DashboardHeader
        dateRange={dateRange}
        setDateRange={setDateRange}
        resetDashboardData={resetDashboardData}
      />

      <div className="grid grid-cols-1 xs:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        {
          loading ? (
            Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[164px] w-full rounded-2xl" />
            ))
          ) : (
            <>
              <KpiCards
                title="Total vendido"
                value={formatPrice({ price: dashboardData?.sales.total || 0, country: { currency: "USD", locale: "en-US" } })}
                change={dashboardData?.sales.percentageChange?.toString() + "%" || "0%"}
                trend={dashboardData?.sales.percentageChange ? dashboardData?.sales.percentageChange > 0 ? "up" : "down" : "up"}
                icon="DollarSign"
                description={`Anterior: ${formatPrice({ price: dashboardData?.sales.yesterdayTotal || 0, country: { currency: "USD", locale: "en-US" } })}`}
              />
              <KpiCards
                title="Total ordenes"
                value={dashboardData?.sales.totalOrders.toString() || "0"}
                change={dashboardData?.sales.ordersPercentageChange?.toString() + "%" || "0%"}
                trend={dashboardData?.sales.ordersPercentageChange ? dashboardData?.sales.ordersPercentageChange > 0 ? "up" : "down" : "up"}
                icon="ArrowUpRight"
                description={`Anterior: ${dashboardData?.sales.yesterdayOrders.toString() || "0"}`}
              />
              {/* <KpiCards
                title="Productos vendidos"
                value={dashboardData?.products.today?.toString() || "0"}
                change={dashboardData?.products.percentageChange?.toString() + "%" || "0%"}
                trend={dashboardData?.products.percentageChange ? dashboardData?.products.percentageChange > 0 ? "up" : "down" : "up"}
                icon="Package"
                description={`Anterior: ${dashboardData?.products.yesterday?.toString() || "0"}`}
              /> */}
              <LinkCards
                title="Productos vendidos"
                value={dashboardData?.products.today?.toString() || "0"}
                labelLink="Ver productos disponibles"
                href="/dashboard/estadisticas/productos-disponibles"
                icon="Package"
              />
              <LinkCards
                title="Productos críticos"
                value={dashboardData?.criticalProducts?.count?.toString() || "0"}
                labelLink="Ver productos críticos"
                href="/dashboard/estadisticas/productos-criticos"
                icon="AlertTriangle"
              />
            </>
          )
        }
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        <SaleChart />
        <InventoryChart />
      </div>
    </div>
  );
};

export default DashboardPage;