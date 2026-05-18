import { Inventory } from "@/types/inventary";

export const createInventaryValidation = (inventory: Inventory) => {

  if (!inventory.name || inventory.name === "") {
    return "El nombre es requerido";
  }

  if (inventory.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }

  if (!inventory.items || inventory.items.length === 0) {
    return "Debes agregar al menos un producto";
  }

  if (!inventory.type) {
    return "El tipo es requerido";
  }

  for (const item of inventory.items) {
    if (!item.productId || item.productId === "") {
      return 'El producto es requerido';
    }
    
    if (item.stock <= 0) {
      return 'El stock debe ser mayor a 0';
    }

    if(item.retailPrice <= 0){
      return 'El precio de al detal debe ser mayor a 0';
    }
    
    if(item.wholesalePrice < 0){
      return 'El precio de al por mayor debe ser mayor a 0';
    }
    
  }

  return null;
}
