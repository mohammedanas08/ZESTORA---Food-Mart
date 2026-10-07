import { NextResponse } from 'next/server';
import { User, Role } from '@/types';
import { zestoraStore } from './dataStore';
import { sanitizeUser } from './passwordUtils';
import { SESSION_COOKIE, verifySession } from './session';

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

  // The token is HMAC-signed and expiring; a forged or tampered value fails verification.
  const session = verifySession(cookies[SESSION_COOKIE]);
  if (!session) return null;

  // Role always comes from the server-side user record, never from the cookie/token.
  const user = zestoraStore.getUserById(session.sub);
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

// ─────────────────────────────────────────────────────────────────────────────
// Order-level authorization
// ─────────────────────────────────────────────────────────────────────────────
import type { Order, OrderStatus } from '@/types';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const RESTAURANT_ROLES = ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER'];

export function unauthorized(message = 'HTTP 401 UNAUTHORIZED: Please log in.'): NextResponse {
  return NextResponse.json({ success: false, error: 'Unauthorized', message }, { status: 401 });
}

export function forbidden(message = 'HTTP 403 FORBIDDEN: You are not allowed to do this.'): NextResponse {
  return NextResponse.json({ success: false, error: 'Forbidden', message }, { status: 403 });
}

function restaurantOwnedBy(user: User, restaurantId?: string): boolean {
  if (!restaurantId) return false;
  const r = zestoraStore.getRestaurantById(restaurantId);
  return !!r && r.ownerId === user.id;
}

function partnerForUser(user: User) {
  return zestoraStore.getDeliveryPartners().find((p) => p.userId === user.id);
}

/** Can this user see this order? */
export function canViewOrder(user: User, order: Order): boolean {
  if (ADMIN_ROLES.includes(user.role)) return true;
  if (user.role === 'CUSTOMER') return order.customerId === user.id;
  if (RESTAURANT_ROLES.includes(user.role)) return restaurantOwnedBy(user, order.restaurantId);
  if (user.role === 'DELIVERY_PARTNER') {
    const partner = partnerForUser(user);
    if (!partner) return false;
    return order.deliveryPartnerId === user.id || (!order.deliveryPartnerId && order.status === 'READY_FOR_PICKUP');
  }
  return false;
}

/** May this user move this order to `next`? Returns an error message or null when allowed. */
export function checkOrderTransition(user: User, order: Order, next: OrderStatus): string | null {
  if (ADMIN_ROLES.includes(user.role)) return null;

  if (user.role === 'CUSTOMER') {
    if (order.customerId !== user.id) return 'You can only change your own orders.';
    if (next !== 'CANCELLED') return 'Customers may only cancel an order.';
    if (!['PLACED', 'PAYMENT_PENDING', 'CONFIRMED'].includes(order.status)) {
      return 'This order can no longer be cancelled.';
    }
    return null;
  }

  if (RESTAURANT_ROLES.includes(user.role)) {
    if (!restaurantOwnedBy(user, order.restaurantId)) return 'This order belongs to another restaurant.';
    if (!['RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'CANCELLED'].includes(next)) {
      return 'Restaurants cannot set this status.';
    }
    return null;
  }

  if (user.role === 'DELIVERY_PARTNER') {
    const partner = partnerForUser(user);
    if (!partner) return 'No delivery partner profile for this user.';
    if (!['DELIVERY_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'ARRIVING', 'DELIVERED'].includes(next)) {
      return 'Riders cannot set this status.';
    }
    if (order.deliveryPartnerId && order.deliveryPartnerId !== user.id) return 'Order assigned to another rider.';
    return null;
  }

  return 'Your role cannot change order status.';
}
