import { CreateSaleData } from "@/types";

export const createSaleValidation = (sale: CreateSaleData) => {

  for (const detail of sale.details) {
    if (!detail.inventoryItems || detail.inventoryItems.length === 0) {
      return 'El producto es requerido';
    }
  }

  return null;
}
