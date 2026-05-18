import { api } from "@/api/axios";
import { RateType } from "@/types";

export const getRates = async (rateType: RateType) => {
  try {
    const { data } = await api.get(`/rate?rateType=${rateType}`);
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export const getAllRates = async () => {
  try {
    const { data } = await api.get('/rate');
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
}