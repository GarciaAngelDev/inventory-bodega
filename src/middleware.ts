import { NextResponse, NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole } from './types';
import { dashboardNavigation } from './config/dashboard-navigation';

const publicPaths = ['/'];
const protectedPaths = ['/dashboard'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  const isPublicPath = publicPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));
  const isProtectedPath = protectedPaths.some(path => pathname === path || pathname.startsWith(`${path}/`));

  try {
    if (token) {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
      const userRole = payload.role as UserRole;
      
      if (isPublicPath) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      const hasPermission = dashboardNavigation.some(item => item.roles?.includes(userRole) && (item.url === pathname || pathname.startsWith(`${item.url}/`)));
      const firstUrl = dashboardNavigation.find(item => item.roles?.includes(userRole))?.url;

      if(!hasPermission) {
        if((userRole === UserRole.SUPER || userRole === UserRole.ADMIN) && pathname === '/dashboard/configuracion') {
          return NextResponse.next();
        } else {
          if(pathname === '/dashboard/perfil') {
            return NextResponse.next();
          }
          return NextResponse.redirect(new URL(firstUrl!, request.url));
        }
      }
    } 
    else if (isProtectedPath) {
      return NextResponse.redirect(new URL('/', request.url), {
        headers: {
          'Set-Cookie': `token=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax`
        }
      });
    }
    
    return NextResponse.next();
  } catch (error) {
    console.error('Authentication error:', error);
    const response = NextResponse.redirect(new URL('/', request.url), {
      headers: {
        'Set-Cookie': `token=; Path=/; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax`
      }
    });
    return response;
  }
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
}