import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de la aplicación.
 * Si tienes lógica personalizada, añádela aquí.
 * Por defecto solo deja pasar la petición.
 */
export function middleware(request: NextRequest) {
  // Ejemplo de registro (puedes eliminarlo en producción)
  console.log('Middleware ejecutado para', request.nextUrl.pathname);
  return NextResponse.next();
}

/**
 * Configuración del Middleware.
 * Aplica a todas las rutas excepto assets estáticos, API y rutas internas de Next.
 */
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
};