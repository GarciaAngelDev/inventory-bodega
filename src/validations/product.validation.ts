import { CreateProductData } from "@/types";

export const createProductValidation = (data: CreateProductData) => {
  if (!data.name || data.name.trim() === '') {
    return 'El nombre del producto es requerido';
  }
  
  if (!data.category || data.category.trim() === '') {
    return 'La categoría es requerida';
  }
  
  if (data.characteristics) {
    for (const char of data.characteristics) {
      if (!char.name || char.name.trim() === '') {
        return 'El nombre de la característica es requerido';
      }
      
      if (!char.items || char.items.length === 0) {
        return `La característica '${char.name}' debe tener al menos un ítem`;
      }
      
      for (const item of char.items) {
        if (!item.value || item.value.trim() === '') {
          return 'Los valores de las características no pueden estar vacíos';
        }
      }
    }
  }

  if(data.inputProductId){
    if(!data.measureUnitValue){
      return 'La cantidad en unidad de medida es requerida';
    }
    
    if(Number(data.measureUnitValue) <= 0){
      return 'La cantidad en unidad de medida debe ser mayor a 0';
    }
  }

  return null;
};
