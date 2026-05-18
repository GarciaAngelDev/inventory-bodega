import { Category } from "./category";
import { InputProduct } from "./input-product";
import { InventoryType } from "./inventary";

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export enum ProductType {
  PRODUCT = "PRODUCT",
  RAWMATERIAL = "RAWMATERIAL"
}

export interface ProductCharacteristicsItem {
  value: string;
}

export interface ProductCharacteristics {
  name: string;
  items: ProductCharacteristicsItem[];
}

export interface Product {
  id?: string;
  name: string;
  type: ProductType;
  description?: string;
  refCode?: string;
  brand?: string;
  minStock?: number;
  maxStock?: number;
  category: string;
  inputProductId?: string;
  inputProduct?: InputProduct;
  measureUnitValue?: number;
  images?: string[];
  slug?: string;
  status?: ProductStatus;
  tags?: string[];
  characteristics?: ProductCharacteristics[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateProductData {
  id?: string;
  name: string;
  type: ProductType;
  refCode?: string;
  slug?: string;
  description: string;
  brand: string;
  minStock?: number;
  maxStock?: number;
  category: string;
  inputProductId?: string;
  inputProduct?: InputProduct;
  measureUnitValue?: number;
  status?: ProductStatus;
  images: string[];
  tags: string[];
  characteristics?: Array<{
    name: string;
    items: Array<{
      value: string;
    }>;
  }>;
}

export interface ProductFetch {
  id?: string;
  name: string;
  type: ProductType;
  refCode?: string;
  description?: string;
  brand?: string;
  minStock?: number;
  maxStock?: number;
  category: Category;
  inputProductId?: string;
  inputProduct?: InputProduct;
  measureUnitValue?: number;
  images?: string[];
  slug: string;
  status: ProductStatus;
  tags?: string[];
  characteristics?: ProductCharacteristics[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AvaliableProduct {
  product: Product;
  availableQuantity: number;
  soldQuantity: number;
  availableMeasureUnitValue: number,
  soldMeasureUnitValue: number,
  totalStock: number;
  retailPrice: number;
  wholesalePrice: number;
  isInputProduct: boolean,
  ivaPercentage: number;
  inventoryItems: InventoryItems[];
}

export interface InventoryItems {
  inventoryId: string;
  inventoryName: string;
  inventoryItemId: string;
  availableQuantity: number;
  availableMeasureUnitValue: number,
  soldQuantity: number;
  soldMeasureUnitValue: number,
  stock: number;
  measureUnitValue: number,
  isInputProduct: boolean,
  ivaPercentage: number
  inventaryType: InventoryType;
}