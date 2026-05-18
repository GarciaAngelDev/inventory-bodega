import jwt, { JwtPayload } from "jsonwebtoken";
import { UserRole } from "@/types/user";

interface TokenPayload extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRES_IN = '1d';

if (!JWT_SECRET) {
  throw new Error('No se encontro la llave de encriptacion');
}

/**
 * Genera un token JWT para el usuario
 */
export const generateToken = (payload: Omit<TokenPayload, 'exp' | 'iat'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
};

/**
 * Verifica y decodifica un token JWT
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new Error('Token invalido o expirado');
  }
};

/**
 * Verifica si el token tiene el rol requerido
 */
export const hasRole = (token: string, requiredRole: UserRole): boolean => {
  try {
    const payload = verifyToken(token);
    return payload.role === requiredRole;
  } catch {
    return false;
  }
};

/**
 * Verifica si el token tiene alguno de los roles requeridos
 */
export const hasAnyRole = (token: string, requiredRoles: UserRole[]): boolean => {
  try {
    const payload = verifyToken(token);
    return requiredRoles.includes(payload.role);
  } catch {
    return false;
  }
};

/**
 * Obtiene el ID del usuario desde el token
 */
export const getUserIdFromToken = (token: string): string => {
  const payload = verifyToken(token);
  return payload.id;
};

/**
 * Refresca un token (extiende su expiracion)
 */
export const refreshToken = (token: string): string => {
  const payload = verifyToken(token);
  return generateToken({
    id: payload.id,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  });
};