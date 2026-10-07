import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────────────────────
// Zestora Role-Based Access Control Middleware
//
// SECURITY RULES:
// 1. Role is ALWAYS read from the HMAC-signed httpOnly session token — never from a plain cookie or header.
// 2. /admin/* pages require ADMIN or SUPER_ADMIN role.
// 3. /api/v1/admin/* and /api/admin/* endpoints require ADMIN role.
// 4. Customer-facing protected pages require any valid session.
// 5. Unauthenticated users are redirected to /login.
// 6. Authenticated CUSTOMERs trying /admin are redirected to /.
// ─────────────────────────────────────────────────────────────────────────────

// Edge-runtime verification of the HMAC-signed session token (Web Crypto).
// Mirrors server/session.ts — the role is taken from the SIGNED token, never from a plain cookie.
async function verifyToken(token: string | undefined): Promise<{ sub: string; role: string } | null> {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const secret = process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32
    ? process.env.SESSION_SECRET
    : process.env.NODE_ENV === 'production'
      ? null
      : 'dev-only-insecure-session-secret-change-me';
  if (!secret) return null;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = Array.from(new Uint8Array(mac)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const data = JSON.parse(atob(b64));
    if (typeof data.exp !== 'number' || data.exp < Date.now() / 1000) return null;
    return { sub: data.sub, role: data.role };
  } catch {
    return null;
  }
}

async function getSessionFromRequest(request: NextRequest): Promise<{
  token: string | null;
  role: string | null;
}> {
  const session = await verifyToken(request.cookies.get('zestora_token')?.value);
  return session ? { token: session.sub, role: session.role } : { token: null, role: null };
}

function isAdminRole(role: string | null): boolean {
  return role === 'ADMIN' || role === 'SUPER_ADMIN';
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { token, role } = await getSessionFromRequest(request);

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

  // ── 2b. PROTECT PARTNER DASHBOARDS ──────────────────────────────────────────
  const partnerPaths: Array<[string, string[]]> = [
    ['/restaurant-dashboard', ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'ADMIN', 'SUPER_ADMIN']],
    ['/delivery-dashboard', ['DELIVERY_PARTNER', 'ADMIN', 'SUPER_ADMIN']],
  ];
  for (const [base, roles] of partnerPaths) {
    if (pathname === base || pathname.startsWith(base + '/')) {
      if (!token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (!role || !roles.includes(role)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      return NextResponse.next();
    }
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
    // Partner dashboards
    '/restaurant-dashboard',
    '/restaurant-dashboard/:path*',
    '/delivery-dashboard',
    '/delivery-dashboard/:path*',
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
