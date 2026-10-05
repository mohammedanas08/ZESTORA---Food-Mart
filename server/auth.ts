import { NextResponse } from 'next/server';
import { User, Role } from '@/types';
import { zestoraStore } from './dataStore';
import { sanitizeUser } from './passwordUtils';

/**
 * Extracts the authenticated user from request cookies only.
 * The role is ALWAYS sourced from the server-side user record — never trusted from frontend headers.
 */
export function getAuthenticatedUser(request: Request): User | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...v] = c.trim().split('=');
      return [key.trim(), decodeURIComponent(v.join('='))];
    })
  );

  const token = cookies['zestora_token'];
  if (!token) return null;

  // Look up user by ID token from the authoritative store (includes newly registered users)
  const user = zestoraStore.getUserById(token);
  return user || null;
}

/**
 * Returns a sanitized (no passwordHash) version of an authenticated user,
 * or null if unauthenticated.
 */
export function getAuthenticatedUserSafe(request: Request): Omit<User, 'passwordHash'> | null {
  const user = getAuthenticatedUser(request);
  if (!user) return null;
  return sanitizeUser(user) as Omit<User, 'passwordHash'>;
}

/**
 * Enforces that the request has an authenticated user.
 */
export function requireAuth(
  request: Request
): { user: User } | { errorResponse: NextResponse } {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'HTTP 401 UNAUTHORIZED: Please log in to access this resource.',
        },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Enforces strict ADMIN-only authorization for backend endpoints.
 * Returns HTTP 403 FORBIDDEN if the authenticated user is a CUSTOMER or any non-admin role.
 * The role is sourced from the server-side user record — never from client headers.
 */
export function requireAdmin(
  request: Request
): { user: User } | { errorResponse: NextResponse } {
  const user = getAuthenticatedUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'HTTP 401 UNAUTHORIZED: Admin authentication required.',
        },
        { status: 401 }
      ),
    };
  }

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'HTTP 403 FORBIDDEN: Access denied. This endpoint requires ADMIN role.',
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}

/**
 * Enforces Customer Data Isolation (prevents IDOR vulnerabilities).
 * A customer can ONLY view or modify their own orders/data.
 * Admins are permitted to view any customer's data.
 */
export function requireCustomerOrAdmin(
  request: Request,
  targetCustomerId: string
): { user: User } | { errorResponse: NextResponse } {
  const user = getAuthenticatedUser(request);

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'HTTP 401 UNAUTHORIZED: Authentication required.',
        },
        { status: 401 }
      ),
    };
  }

  // Admins have access to inspect all orders
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return { user };
  }

  // Customers are strictly verified against their own customer ID
  if (user.id !== targetCustomerId) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message:
            "HTTP 403 FORBIDDEN: You do not have permission to view or access another customer's data.",
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
