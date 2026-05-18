import { Category } from "@/types/category";

export const createCategoryValidation = (category: Category) => {

  if (!category.name || category.name === "") {
    return "El nombre es requerido";
  }

  if (category.name.length < 2) {
    return "El nombre debe tener al menos 2 caracteres";
  }

  return null;
}
