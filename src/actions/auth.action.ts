import { api } from "@/api/axios";

export const login = async (email: string, password: string) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const logout = async () => {
  try {
    const { data } = await api.get('/auth/logout');
    return data;
  } catch (error) {
    console.log(error);
    throw error
  }
}

/* export const me = async () => {
  try {
    const { data } = await api.get('/auth/me');
    return data;
  } catch (error) {
    console.log(error);
    throw error
  }
}
 */