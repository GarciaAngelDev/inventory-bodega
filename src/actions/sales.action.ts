import { CreateSaleData } from "@/types";
import { api } from "@/api/axios";

export const createSale = async (data: CreateSaleData) => {
  try {
    const { data: sale } = await api.post('/sales', data);
    return sale;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getAllSales = async ({ limit = 10, offset = 0, query = '' }: { limit?: number; offset?: number, query?: string }) => {
  try {
    const { data } = await api.get('/sales', {
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
}

export const getSaleById = async (id: string) => {
  try {
    const { data } = await api.get(`/sales/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const cancelDetailSale = async (id: string) => {
  try {
    const { data } = await api.get(`/sales/detail/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const cancelSale = async (id: string) => {
  try {
    const { data } = await api.get(`/sales/cancel/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const concludeSale = async (id: string) => {
  try {
    const { data } = await api.put(`/sales/conclude/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getSellersDailySales = async (limit = 10, offset = 0) => {
  try {
    const { data } = await api.get('/sales/today', {
      params: {
        limit,
        offset,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getSalesByUser = async ({userId, limit = 10, offset = 0, query = ''}: {userId: string; limit?: number; offset?: number, query?: string}) => {
  try {
    const { data } = await api.get(`/sales/user/${userId}`, {
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
}
