import { InputProduct } from "@/types";

export const createInputProductValidation = (inputProduct: InputProduct) => {

  if (!inputProduct.name) {
    return "El nombre es requerido";
  }

  if(!inputProduct.measureUnit) {
    return "La unidad de medida es requerida";
  }

  if(inputProduct.minQuantity && inputProduct.minQuantity < 0) {
    return "La cantidad minima no puede ser menor a 0";
  }

  if(inputProduct.maxQuantity && inputProduct.maxQuantity < 0) {
    return "La cantidad maxima no puede ser menor a 0";
  }

  if(inputProduct.minQuantity && inputProduct.maxQuantity && inputProduct.minQuantity > inputProduct.maxQuantity) {
    return "La cantidad minima no puede ser mayor a la cantidad maxima";
  }

  return null;
};
