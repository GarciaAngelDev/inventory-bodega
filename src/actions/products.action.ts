import { api } from "@/api/axios";
import { InventaryType } from "@/generated/prisma";
import { CreateProductData } from "@/types/product";

export const createProduct = async (productData: CreateProductData) => {
  try {
    const { data } = await api.post('/products', productData);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllProducts = async ({ limit = 20, offset = 0, query = '', type = '' }: { limit?: number; offset?: number, query?: string, type?: string }) => {
  try {
    const { data } = await api.get('/products', {
      params: {
        limit,
        offset,
        query,
        type,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProductById = async (id: string) => {
  try {
    const { data } = await api.get(`/products/id?id=${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateProduct = async (id: string, productData: CreateProductData) => {
  try {
    const { data } = await api.put(`/products/id?id=${id}`, productData);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getProductBySlug = async (slug: string) => {
  try {
    const { data } = await api.get(`/products/slug?slug=${slug}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAvailableProducts = async ({ type = InventaryType.SALE, limit, offset, search }: { type: InventaryType; limit?: number; offset?: number; search?: string }) => {
  try {
    const { data } = await api.get(`/products/avaliable/${type}`, {
      params: {
        limit,
        offset,
        search,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAvailableProductById = async (id: string) => {
  try {
    const { data } = await api.get(`/products/avaliable/id/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const deleteProduct = async (id: string) => {
  try {
    const { data } = await api.delete(`/products/id?id=${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const getAllCriticalProducts = async ({ limit = 20, offset = 0, query = '' }: { limit?: number; offset?: number, query?: string }) => {
  try {
    const { data } = await api.get('/products/critical', {
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

export const productDetail = async (id: string) => {
  try {
    const { data } = await api.get(`/products/detail/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
