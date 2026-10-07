import type { ReactNode } from 'react';
import { ApiError } from '../api/client';
import type { OrderStatus } from '../api/types';
import { STATUS_LABEL } from '../lib/format';

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <p className="py-10 text-center text-stone-500" role="status">{label}</p>;
}

export function ErrorBox({ error }: { error: unknown }) {
  const msg = error instanceof ApiError ? error.message : error instanceof Error ? error.message : 'Something went wrong';
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {msg}
    </p>
  );
}

const COLORS: Record<OrderStatus, string> = {
  PLACED: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  RESTAURANT_ACCEPTED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-indigo-100 text-indigo-800',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-800',
  DELIVERY_ASSIGNED: 'bg-purple-100 text-purple-800',
  PICKED_UP: 'bg-cyan-100 text-cyan-800',
  ON_THE_WAY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COLORS[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function VegDot({ veg }: { veg?: boolean | null }) {
  if (veg == null) return null; // unknown: do not claim either way
  return (
    <span
      title={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-block h-3.5 w-3.5 rounded-sm border-2 p-[1px] ${veg ? 'border-green-600' : 'border-red-600'}`}
    >
      <span className={`block h-full w-full rounded-full ${veg ? 'bg-green-600' : 'bg-red-600'}`} />
    </span>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-stone-500">{sub}</p>}
    </div>
  );
}

/** Small inline icons (no icon library needed). All are decorative: the buttons that use them carry their own labels. */
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true } as const;
export const CartIcon = () => (<svg {...base}><path d="M3 4h2l2.2 10.2a1 1 0 0 0 1 .8h8.6a1 1 0 0 0 1-.76L19.5 8H6" /><circle cx="9" cy="19.5" r="1.2" /><circle cx="17" cy="19.5" r="1.2" /></svg>);
export const SearchIcon = () => (<svg {...base}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg>);
export const PlusIcon = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const MenuIcon = () => (<svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const CloseIcon = () => (<svg {...base}><path d="m6 6 12 12M18 6 6 18" /></svg>);
export const HeartIcon = ({ filled }: { filled?: boolean }) => (<svg {...base} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>);
