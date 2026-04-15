import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define protected routes (excluding API routes which handle their own auth)
  // Dashboard routes are handled by client-side authentication
  const protectedRoutes = [
    '/protected/admin'
  ];

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // If the route is not protected, allow access
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // For protected routes, redirect to login
  // API routes will handle their own Firebase authentication
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/protected/admin/:path*',
    '/profile',
    '/settings',
    // API routes excluded - they handle their own Firebase authentication
    // Dashboard routes excluded - they use client-side authentication
  ],
};
