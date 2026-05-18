import { Client } from "./client";
import { InventoryItem, InventoryType } from "./inventary";
import { User } from "./user";

export enum SaleStatus {
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

export enum SaleDetailStatus {
  RETURNED = "RETURNED",
  CANCELLED = "CANCELLED",
  RESERVED = "RESERVED",
  SOLD = "SOLD",
}

export interface Sale {
  id?: string;
  userId?: string;
  user?: User;
  details: SaleDetail[];
  enableIva: boolean;
  ivaPercentage: number;
  discount: number;
  status?: SaleStatus;
  clientId?: string;
  client?: Client;
  deliveryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSaleData {
  id?: string;
  details: CreateSaleDetailData[];
  enableIva: boolean;
  ivaPercentage: number;
  discount: number | undefined;
  status?: SaleStatus;
  clientId?: string;
  deliveryDate?: Date;
}

export interface CreateSaleDetailData {
  productId: string; // Solo para comparar entre avaliable product y sale detail
  inventoryItems: CreateSaleInventoryItem[];
  measureUnitValue?: number;
  isRetailPrice: boolean;
  retailPrice: number;
  wholesalePrice: number;
  quantity?: number;
  iva: number;
  ivaPercentage: number;
  status?: SaleDetailStatus;
  inventaryType: InventoryType;
}

export interface CreateSaleInventoryItem {
  inventoryId: string;
  inventoryItemId: string;
}

export interface SaleFetch {
  id?: string;
  userId?: string;
  user?: User;
  details: SaleDetail[];
  enableIva: boolean;
  ivaPercentage: number;
  discount: number;
  status?: SaleStatus;
  clientId?: string;
  client?: Client;
  deliveryDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SaleDetail {
  id?: string;
  retailPrice: number;
  wholesalePrice: number;
  quantity: number;
  measureUnitValue: number;
  isRetailPrice: boolean;
  iva: number;
  ivaPercentage: number;
  saleId: string;
  sale?: Sale;
  inventaryItems: InventoryItem[];
  status?: SaleDetailStatus;
  inventaryType: InventoryType;
}

export interface SaleSummary {
  id: string;
  date: Date;
  totalAmount: number;
  status: SaleStatus;
  discount: number;
  details: number;
}

export interface Pagination {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface SellerSale {
  id: string;
  name: string;
  totalSalesToday: number; // Total de ventas del dia, ejemplo: 5
  totalSalesAmountToday: number; // Total de ventas en dolares del dia, ejemplo: $128,00
  sales: SaleSummary[];
  pagination: Pagination;
}

export interface SellerDailySales {
  totalSalesAllUsersAmountToday: number; // total en dolares de las ventas de hoy de todos los usuarios, ejemplo: $128,00
  users: SellerSale[];
}