import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const AUTH_COOKIE = 'auth_token';
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production'
);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root redirect
  if (pathname === '/') {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/dashboard/todos', request.url));
      } catch {
        // fall through to redirect login
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Public routes
  if (pathname === '/login' || pathname === '/register') {
    const token = request.cookies.get(AUTH_COOKIE)?.value;
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/dashboard/todos', request.url));
      } catch {
        // Invalid token, allow access to login
      }
    }
    return NextResponse.next();
  }

  // Protected routes
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Admin-only routes
    if (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/dashboard/overview') ||
      pathname.startsWith('/dashboard/customers') ||
      pathname.startsWith('/dashboard/branches')
    ) {
      if (role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/todos', request.url));
      }
    }
  } catch {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
