import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken, refreshToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  try {
    if (!token) {
      return NextResponse.json({ error: 'No estas autorizado para realizar esta accion' }, {
        status: 401,
        headers: {
          'Set-Cookie': `token=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax`
        }
      });
    }

    verifyToken(token);

    const newToken = refreshToken(token);

    return NextResponse.json({ message: "autenticado" }, {
      headers: { 'Set-Cookie': `token=${newToken}; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Max-Age=${60 * 60 * 24}` }
    });
  } catch (error) {
    console.error('No estas autorizado para realizar esta accion:', error);
    if (error instanceof Error && error.message === 'Token invalido o expirado') {
      return NextResponse.json({ error: 'No autorizado' }, {
        status: 401,
        headers: {
          'Set-Cookie': `token=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax`
        }
      });
    }
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
