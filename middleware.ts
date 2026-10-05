import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Zestora Role-Based Access Control Middleware
//
// SECURITY RULES:
// 1. Role is ALWAYS read from server-set cookies — never from client headers.
// 2. /admin/* pages require ADMIN or SUPER_ADMIN role.
// 3. /api/v1/admin/* and /api/admin/* endpoints require ADMIN role.
// 4. Customer-facing protected pages require any valid session.
// 5. Unauthenticated users are redirected to /login.
// 6. Authenticated CUSTOMERs trying /admin are redirected to /.
// ─────────────────────────────────────────────────────────────────────────────

function getSessionFromRequest(request: NextRequest): {
  token: string | null;
  role: string | null;
} {
  const token = request.cookies.get('zestora_token')?.value || null;
  const role = request.cookies.get('zestora_role')?.value || null;
  return { token, role };
}

function isAdminRole(role: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { token, role } = getSessionFromRequest(request);

  // ── 1. PROTECT ADMIN API ROUTES (/api/admin/* and /api/v1/admin/*) ──────────
  if (
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/api/v1/admin')
  ) {
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'HTTP 401 UNAUTHORIZED: You must be logged in.',
        },
        { status: 401 }
      );
    }

    if (!isAdminRole(role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'HTTP 403 FORBIDDEN: Access restricted to ADMIN role only.',
        },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // ── 2. PROTECT ADMIN PAGES (/admin and /admin/*) ────────────────────────────
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // Unauthenticated → redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated as non-admin → redirect to customer home
    if (!isAdminRole(role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // ── 3. PROTECT CUSTOMER-ONLY PAGES ─────────────────────────────────────────
  const customerProtectedPaths = [
    '/checkout',
    '/my-orders',
    '/profile',
    '/orders',
    '/favorites',
  ];

  const isCustomerProtected = customerProtectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  );

  if (isCustomerProtected) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ── 4. REDIRECT AUTHENTICATED USERS AWAY FROM AUTH PAGES ───────────────────
  if (pathname === '/login' || pathname === '/signup') {
    if (token && role) {
      // Already logged in — redirect to appropriate home
      if (isAdminRole(role)) {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Admin pages
    '/admin',
    '/admin/:path*',
    // Admin APIs
    '/api/admin/:path*',
    '/api/v1/admin/:path*',
    // Customer protected pages
    '/checkout',
    '/checkout/:path*',
    '/my-orders',
    '/my-orders/:path*',
    '/profile',
    '/profile/:path*',
    '/orders',
    '/orders/:path*',
    '/favorites',
    '/favorites/:path*',
    // Auth pages (redirect if already logged in)
    '/login',
    '/signup',
  ],
};
