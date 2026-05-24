import { ForwardRefExoticComponent, RefAttributes } from "react";
import { LucideProps } from "lucide-react";

export interface DashboardNavigationItem {
  title: string;
  url: string;
  icon?: ForwardRefExoticComponent<Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>>
  roles?: string[]
}

export interface CriticalProduct {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  hasInputProduct: boolean;
  measureUnit?: string;
}

export interface SoldProduct {
  id: string;
  name: string;
  quantity: number;
  total: number;
}

export interface InventoryProductStock {
  id: string;
  name: string;
  initialStock: number;
  currentStock: number;
  difference: number;
  measureUnit: string;
  hasInputProduct: boolean;
}

export interface DashboardInventoryStatusDetail {
  available: number;
  lowStock: number;
  outOfStock: number;
  reserved: number;
  total: number;
  products: InventoryProductStock[];
}

export interface DashboardInventoryStatus {
  sale: DashboardInventoryStatusDetail;
  internal: DashboardInventoryStatusDetail;
}

export interface DashboardData {
  sales: {
    exemptAmount: number;    // Monto exento (sin IVA)
    taxableAmount: number;   // Base imponible (BI G)
    taxAmount: number;       // IVA G
    total: number;           // Total general
    totalOrders: number;     // Número total de órdenes
    percentageChange: number; // Porcentaje de cambio
    yesterdayTotal: number;  // Total de ayer
    yesterdayOrders: number; // Número de órdenes de ayer
    ordersPercentageChange: number; // Porcentaje de cambio en órdenes
  };
  products: {
    today: number;           // Total de productos vendidos hoy
    yesterday: number;       // Total de productos vendidos ayer
    percentageChange: number; // Porcentaje de cambio en productos
  };
  criticalProducts: {
    count: number;           // Cantidad de productos críticos
    products: CriticalProduct[]; // Lista de productos críticos
  };
  soldProducts: SoldProduct[];
  inventoryStatus: DashboardInventoryStatus;
}
