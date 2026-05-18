import { Status } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { User, UserRole } from "@/types";
import bcrypt from 'bcryptjs';

export const createUser = async (name: string, email: string, password: string, role: UserRole) => {
  try {

    if(role === UserRole.SUPER) {
      throw new Error('Error al crear el usuario');
    }

    const existUser = await prisma.user.findUnique({
      where: {
        email
      },
    });

    if (existUser) {
      throw new Error('El email ya esta en uso');
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role
      },
    });

    const { password: _, ...restUser } = user;

    return { user: restUser };
  } catch (error) {
    console.log('Error al crear usuario:', error);
    throw error;
  }
};

export const getAllUsers = async ({ limit = 20, offset = 0, query = '' }: { limit?: number, offset?: number, query?: string }) => {

  const searchQuery = query.trim().toLowerCase();
  const searchCondition = searchQuery
    ? {
      OR: [
        { name: { contains: searchQuery, mode: 'insensitive' as const } },
        { email: { contains: searchQuery, mode: 'insensitive' as const } },
      ],
    }
    : {};

  try {
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: {
          role: {
            not: UserRole.SUPER,
          },
          ...searchCondition,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({
        where: {
          status: Status.ACTIVE,
          role: {
            not: UserRole.SUPER,
          },
          ...searchCondition,
        },
      })]);
  
    return {
      data: users,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    console.log('Error al obtener usuarios:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, data: User) => {
  try {
    const existUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existUser) {
      throw new Error('El usuario no existe');
    }

    // Preparar los datos de actualización
    const updateData: Partial<User> = {
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status,
    };

    // Solo actualizar la contraseña si se proporciona una nueva
    if (data.password) {
      if (data.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      // Hashear la nueva contraseña
      updateData.password = data.password;
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
    const { password: _, ...restUser } = user;
    return { user: restUser };
  } catch (error) {
    console.log('Error al actualizar usuario:', error);
    throw error;
  }
}

export const updateProfileUser = async (userId: string, data: { name?: string, oldPassword?: string, newPassword?: string }) => {
  try {
    const existUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        password: true,
      },
    });

    if (!existUser) {
      throw new Error('El usuario no existe');
    }

    // Preparar los datos de actualización
    const updateData: Partial<User> = {
      name: data.name,
    };

    // Solo actualizar la contraseña si se proporciona una nueva
    if (data.oldPassword) {
      if (data.oldPassword.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      const isPasswordValid = await bcrypt.compare(data.oldPassword, existUser.password);

      if (!isPasswordValid) {
        throw new Error('La contraseña actual no coincide');
      }

      if (!data.newPassword) {
        throw new Error('La nueva contraseña es requerida para actualizar la contraseña');
      }

      if (data.newPassword.length < 8) {
        throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
      }

      // Hashear la nueva contraseña
      updateData.password = data.newPassword;
    }

    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: updateData,
    });
    const { password: _, ...restUser } = user;
    return { user: restUser };
  } catch (error) {
    console.log('Error al actualizar usuario:', error);
    throw error;
  }
}
