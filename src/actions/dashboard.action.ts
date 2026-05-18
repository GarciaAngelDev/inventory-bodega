import { api } from "@/api/axios";
import { DateRange } from "react-day-picker";

export const getDashboardByDateOrDateRange = async (dateRange: DateRange) => {
  try {
    const data = await api.get('/dashboard', { params: dateRange });
    return data.data;
  } catch (error) {
    console.error('Error al obtener el dashboard de ventas:', error);
    throw error;
  }
}
  