import { api } from "@/api/axios";
import { CreateProducerData } from "@/types/producer";

export const createProducer = async (data: CreateProducerData) => {
  try {
    const { data: producer } = await api.post('/producers', data);
    return producer;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getAllProducers = async ({ limit = 10, offset = 0, query = '' }: { limit?: number; offset?: number, query?: string }) => {
  try {
    const { data } = await api.get('/producers', {
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

export const getProducersDaily = async () => {
  try {
    const { data } = await api.get('/producers/daily');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getProducerById = async (id: string) => {
  try {
    const { data } = await api.get(`/producers/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const cancelProducer = async (id: string) => {
  try {
    const { data } = await api.get(`/producers/cancel/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const cancelDetailProducer = async (id: string) => {
  try {
    const { data } = await api.get(`/producers/cancel/details/${id}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getProducersByUser = async ({ userId, limit = 10, offset = 0, query = '' }: { userId: string; limit?: number; offset?: number, query?: string }) => {
  try {
    const { data } = await api.get(`/producers/user/${userId}`, {
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