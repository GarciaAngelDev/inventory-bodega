import { CreateProducerData } from "@/types/producer";

export const createProducerValidation = (sale: CreateProducerData) => {

  for (const detail of sale.details) {
    if (!detail.inventaryItems || detail.inventaryItems.length === 0) {
      return 'El producto es requerido';
    }
    
    if (detail.quantity < 0) {
      return 'La cantidad debe ser mayor o igual a 0';
    }
    
  }

  return null;
}
