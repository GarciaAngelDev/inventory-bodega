import { api } from "@/api/axios";
import { Category } from "@/types/category";

export const createCategory = async (category: Category) => {
  try {
    const { data } = await api.post('/categories', category);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllCategories = async ({ limit = 10, offset = 0, query = "" }: { limit?: number; offset?: number; query?: string }) => {
  try {
    const { data } = await api.get('/categories', {
      params: {
        limit,
        offset,
        query,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateCategory = async (id: string, category: Category) => {
  try {
    const { data } = await api.put(`/categories/id?id=${id}`, category);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const { data } = await api.delete(`/categories/id?id=${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
