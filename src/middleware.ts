import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de la aplicación.
 * Intercepta el token Bearer en el encabezado Authorization y lo inyecta como una cookie de token.
 */
export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    // Clonar las cabeceras de la petición
    const requestHeaders = new Headers(request.headers);
    let cookieString = request.headers.get('cookie') || '';

    // Si ya existe la cookie token, la reemplazamos. De lo contrario, la agregamos.
    if (cookieString.includes('token=')) {
      cookieString = cookieString.replace(/token=[^;]+/, `token=${token}`);
    } else {
      cookieString = cookieString ? `${cookieString}; token=${token}` : `token=${token}`;
    }

    requestHeaders.set('cookie', cookieString);

    // Retornar NextResponse.next con las cabeceras de la petición modificadas
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
}

/**
 * Configuración del Middleware.
 * Aplica a todas las rutas excepto assets estáticos y rutas internas de Next,
 * permitiendo expresamente procesar las peticiones a /api/*.
 */
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};