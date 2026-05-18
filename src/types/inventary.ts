import { ProductFetch } from "./product";
import { User } from "./user";

export enum InventoryItemStatus {
  STOP = "STOP",
  AVAILABLE = "AVAILABLE",
  OUT_OF_STOCK = "OUT_OF_STOCK",
  RESERVED = "RESERVED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum InventoryStatus {
  STOP = "STOP",
  PENDING = "PENDING",
  PREPARED = "PREPARED",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
}

export enum InventoryType {
  INTERNAL = "INTERNAL",
  SALE = "SALE",
}

export interface InventoryItem {
  id?: string;
  retailPrice: number;
  wholesalePrice: number;
  stock: number;
  initialStock: number;
  ivaPercentage?: number;
  measureUnitValue: number;
  initialMeasureUnitValue: number;
  type?: InventoryType;
  productId: string;
  product?: ProductFetch;
  status?: InventoryItemStatus;
}

export interface CreateInventoryItem {
  id?: string;
  retailPrice: number | string;
  wholesalePrice: number | string;
  stock: number | string;
  initialStock: number;
  ivaPercentage?: number;
  measureUnitValue: number;
  initialMeasureUnitValue: number;
  type?: InventoryType;
  productId: string;
  product?: ProductFetch;
  status?: InventoryItemStatus;
  enabledIva?: boolean;
}

export interface Inventory {
  id?: string;
  name: string;
  invoiceNumber?: string;
  providerName?: string;
  userId?: string;
  user?: User;
  items: InventoryItem[];
  status?: InventoryStatus;
  type: InventoryType;
}

export interface CreateInventoryData {
  id?: string;
  name: string;
  invoiceNumber?: string;
  providerName?: string;
  items: CreateInventoryItem[];
  status?: InventoryStatus;
  type: InventoryType;
}

export interface InventoryFetch {
  id?: string;
  name: string;
  invoiceNumber?: string;
  providerName?: string;
  inventaryItems: InventoryItem[];
  user: User;
  status?: InventoryStatus;
  type: InventoryType;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UpdateInventoryItemData {
  id?: string;
  retailPrice?: number;
  wholesalePrice?: number;
  stock?: number;
  initialStock?: number;
  measureUnitValue?: number;
  initialMeasureUnitValue?: number;
  ivaPercentage?: number;
  type?: InventoryType;
  status?: InventoryItemStatus;
}
