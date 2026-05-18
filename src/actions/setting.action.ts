import { api } from "@/api/axios";
import { Setting } from "@/types";

export const getSetting = async () => {
  try {
    const { data } = await api.get('/settings');
    return data;
  } catch (error) {
    console.error('Error al obtener la configuración:', error);
    throw error;
  }
}

export const updateSetting = async (setting: Setting) => {
  try {
    const { data } = await api.put('/settings', setting);
    return data;
  } catch (error) {
    console.error('Error al actualizar la configuración:', error);
    throw error;
  }
}
