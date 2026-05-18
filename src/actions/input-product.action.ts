import { api } from "@/api/axios";
import { InputProduct } from "@/types";

export const createInputProduct = async (inputProduct: InputProduct) => {
  try {
    const { data } = await api.post('/input-products', inputProduct);
    return data;
  } catch (error) {
    console.log('Error al crear el insumo:', error);
    throw error;
  }
}

export const getAllInputProducts = async ({ limit = 10, offset = 0, search = "" }: { limit?: number; offset?: number; search?: string }) => {
  try {
    const { data } = await api.get('/input-products', {
      params: {
        limit,
        offset,
        search,
      },
    });
    return data;
  } catch (error) {
    console.log('Error al obtener los insumos:', error);
    throw error;
  }
}

export const updateInputProduct = async (id: string, inputProduct: InputProduct) => {
  try {
    const { data } = await api.put(`/input-products/${id}`, inputProduct);
    return data;
  } catch (error) {
    console.log('Error al actualizar el insumo:', error);
    throw error;
  }
}

export const deleteInputProduct = async (id: string) => {
  try {
    const { data } = await api.delete(`/input-products/${id}`);
    return data;
  } catch (error) {
    console.log('Error al eliminar el insumo:', error);
    throw error;
  }
}
