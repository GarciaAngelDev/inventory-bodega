import axios from "axios";

export const api = axios.create({
  baseURL: '/api',
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // redirigir a la pagina de login
      window.location.href = '/';
      throw new Error('No estas autorizado para realizar esta accion');
    }
    throw error;
  }
);
