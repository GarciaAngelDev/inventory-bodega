import { api } from "@/api/axios";
import { User, UserRole } from "@/types";

export const createUserAction = async (name: string, email: string, password: string, role: UserRole) => {
  try {
    const user = await api.post('/users', { name, email, password, role });
    return user.data;
  } catch (error) {
    console.log('Error al crear usuario:', error);
    throw error;
  }
};

export const getAllUsersAction = async ({ limit = 10, offset = 0, query = '' }: { limit?: number; offset?: number, query?: string }) => {
  try {
    const users = await api.get('/users', {
      params: {
        limit,
        offset,
        query,
      },
    });
    return users.data;
  } catch (error) {
    console.log('Error al obtener usuarios:', error);
    throw error;
  }
};

export const updateUserAction = async (userId: string, data: User) => {
  try {
    const user = await api.put(`/users/${userId}`, data);
    return user.data;
  } catch (error) {
    console.log('Error al actualizar usuario:', error);
    throw error;
  }
};

export const updateProfileUserAction = async (userId: string, data: { name?: string, oldPassword?: string, newPassword?: string }) => {
  try {
    const user = await api.put(`/users/profile/${userId}`, data);
    return user.data;
  } catch (error) {
    console.log('Error al actualizar usuario:', error);
    throw error;
  }
};
