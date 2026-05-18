import { generateToken, refreshToken, verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserStatus } from "@/types";
import bcrypt from 'bcryptjs';

export const login = async (email: string, password: string) => {

  try {
    const user = await prisma.user.findUnique({
      where: {
        email
      },
    });

    if (!user) {
      throw new Error('EL email o contraseña son incorrectos');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new Error('No puedes iniciar sesion, comuniquese con el administrador');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('EL email o contraseña son incorrectos');
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    const { password: _, ...restUser } = user;

    return { token, user: restUser };
  } catch (error) {
    console.log('Error logging in:', error);
    throw error;
  }
};

export const register = async (name: string, email: string, password: string) => {
  try {
    
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
        password
      },
    });
    const { password: _, ...restUser } = user;
    return { user: restUser };
  } catch (error) {
    console.log('Error registering user:', error);
    throw error;
  }
};

export const me = async (token: string) => {
  try {
    verifyToken(token);
    const newToekn = refreshToken(token);
    return { token: newToekn };
  } catch (error) {
    console.log('Error verifying token:', error);
    throw error;
  }
};