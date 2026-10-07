import type { OrderStatus, Role } from '../api/types';

export function money(n: number | undefined | null): string {
  const v = Number(n ?? 0);
  return '₹' + (Number.isInteger(v) ? v.toString() : v.toFixed(2));
}

export function dateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PLACED: 'Awaiting payment',
  CONFIRMED: 'Confirmed',
  RESTAURANT_ACCEPTED: 'Accepted by restaurant',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  DELIVERY_ASSIGNED: 'Rider assigned',
  PICKED_UP: 'Picked up',
  ON_THE_WAY: 'On the way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

/** The happy-path stages shown in the customer tracker. */
export const TRACK_STAGES: OrderStatus[] = [
  'PLACED', 'CONFIRMED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'DELIVERY_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY', 'DELIVERED',
];

export function isRestaurantRole(r?: Role) {
  return r === 'RESTAURANT_OWNER' || r === 'RESTAURANT_MANAGER';
}

export function isAdminRole(r?: Role) {
  return r === 'ADMIN' || r === 'SUPER_ADMIN';
}

/** Where each role lands after signing in. */
export function homeFor(role?: Role): string {
  if (isAdminRole(role)) return '/admin';
  if (isRestaurantRole(role)) return '/partner';
  if (role === 'DELIVERY_PARTNER') return '/rider';
  return '/';
}
