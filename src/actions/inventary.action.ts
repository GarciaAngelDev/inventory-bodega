import { CreateInventoryData, UpdateInventoryItemData } from "@/types";
import { api } from "@/api/axios";
import { DateRange } from "react-day-picker";

export const createInventary = async (data: CreateInventoryData) => {
  try {
    const { data: inventary } = await api.post('/inventary', data);
    return inventary;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getAllInventary = async ({ limit = 10, offset = 0, query = '', dateFrom, dateTo }: { limit?: number; offset?: number, query?: string, dateFrom?: Date, dateTo?: Date }) => {
  try {
    const { data } = await api.get('/inventary', {
      params: {
        limit,
        offset,
        query,
        dateFrom,
        dateTo,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getInventaryById = async (id: string) => {
  try {
    const { data } = await api.get(`/inventary/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateInventary = async (id: string, data: CreateInventoryData) => {
  try {
    const { data: inventary } = await api.put(`/inventary/${id}`, data);
    return inventary;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const deleteInventary = async (id: string) => {
  try {
    const { data } = await api.delete(`/inventary/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const deleteInventaryItem = async (id: string) => {
  try {
    const { data } = await api.delete(`/inventary/items/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const updateInventaryItem = async (id: string, data: UpdateInventoryItemData) => {
  try {
    const { data: inventaryItem } = await api.put(`/inventary/items/${id}`, data);
    return inventaryItem;
  } catch (error) {
    console.log(error);
    throw error;
  }
}
