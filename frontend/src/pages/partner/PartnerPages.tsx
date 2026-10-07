import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Order, OrderStatus } from '../../api/types';
import { ErrorBox, Field, PageTitle, Spinner, StatusBadge } from '../../components/ui';
import { dateTime, money } from '../../lib/format';
import { useStompTopic } from '../../realtime/useStompTopic';

/** The next action the kitchen can take for each order status. */
const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  CONFIRMED: { label: 'Accept order', to: 'RESTAURANT_ACCEPTED' },
  RESTAURANT_ACCEPTED: { label: 'Start preparing', to: 'PREPARING' },
  PREPARING: { label: 'Mark ready for pickup', to: 'READY_FOR_PICKUP' },
};

export function PartnerOrdersPage() {
  const qc = useQueryClient();
  const orders = useQuery({ queryKey: ['partner-orders'], queryFn: () => api<Order[]>('/partner/orders'), refetchInterval: 5000 });
  const restaurantId = orders.data?.[0]?.restaurantId;
  useStompTopic(restaurantId ? `/topic/restaurant/${restaurantId}/orders` : null, () => qc.invalidateQueries({ queryKey: ['partner-orders'] }));

  const act = useMutation({
    mutationFn: (v: { id: number; status: OrderStatus; note?: string }) => api(`/orders/${v.id}/status`, { method: 'PATCH', body: { status: v.status, note: v.note } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-orders'] }),
  });
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const active = orders.data?.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)) ?? [];
  const past = orders.data?.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status)) ?? [];

  return (
    <>
      <PageTitle sub="New paid orders appear here automatically">Kitchen orders</PageTitle>
      <OpenToggle />
      {orders.isLoading && <Spinner />}
      {orders.error ? <ErrorBox error={orders.error} /> : null}
      {act.error ? <ErrorBox error={act.error} /> : null}
      {active.length === 0 && !orders.isLoading && <p className="text-stone-500">No active orders.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {active.map((o) => {
          const next = NEXT[o.status];
          return (
            <div key={o.id} className="card space-y-2" data-testid={`order-${o.id}`}>
              <div className="flex items-center justify-between"><strong>{o.orderNumber}</strong><StatusBadge status={o.status} /></div>
              <ul className="text-sm">{o.items.map((i, k) => <li key={k}>{i.quantity}× {i.name}{(i.variantName || i.addons) && ` (${[i.variantName, i.addons].filter(Boolean).join(', ')})`}{i.notes && <em className="text-stone-500"> — {i.notes}</em>}</li>)}</ul>
              <p className="text-sm text-stone-500">{dateTime(o.createdAt)} · {money(o.subtotal)}</p>
              <div className="flex flex-wrap gap-2">
                {next && <button className="btn-primary" disabled={act.isPending} onClick={() => act.mutate({ id: o.id, status: next.to })}>{next.label}</button>}
                {['CONFIRMED', 'RESTAURANT_ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP'].includes(o.status) && <button className="btn-outline" onClick={() => setRejecting(o.id)}>Reject / cancel</button>}
              </div>
              {o.status === 'READY_FOR_PICKUP' && <p className="text-xs text-amber-700">Waiting for a rider to be assigned…</p>}
              {o.status === 'DELIVERY_ASSIGNED' && o.rider && <p className="text-xs text-stone-600">Rider {o.rider.name} is on the way to collect.</p>}
              {rejecting === o.id && (
                <form className="space-y-2" onSubmit={(e: FormEvent) => { e.preventDefault(); act.mutate({ id: o.id, status: 'CANCELLED', note: reason }); setRejecting(null); setReason(''); }}>
                  <Field label="Reason (shown to the customer)"><input className="input" required value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                  <button className="btn-danger">Confirm cancellation</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
      {past.length > 0 && (
        <>
          <h2 className="mb-2 mt-8 font-bold">Recent history</h2>
          <ul className="divide-y rounded-xl border bg-white text-sm">
            {past.slice(0, 15).map((o) => <li key={o.id} className="flex justify-between p-3"><span>{o.orderNumber}</span><span>{money(o.subtotal)}</span><StatusBadge status={o.status} /></li>)}
          </ul>
        </>
      )}
    </>
  );
}

function OpenToggle() {
  const [open, setOpen] = useState<boolean | null>(null);
  const toggle = useMutation({
    mutationFn: (v: boolean) => api<{ open: boolean }>('/partner/restaurant/open', { method: 'PATCH', body: { open: v } }),
    onSuccess: (r) => setOpen(r.open),
  });
  return (
    <div className="mb-4 flex items-center gap-3">
      <button className="btn-outline" onClick={() => toggle.mutate(!(open ?? true))}>{open === false ? 'Reopen restaurant' : 'Close restaurant for now'}</button>
      {open !== null && <span className={`text-sm font-semibold ${open ? 'text-green-700' : 'text-red-600'}`}>{open ? 'Open for orders' : 'Closed'}</span>}
      {toggle.error ? <ErrorBox error={toggle.error} /> : null}
    </div>
  );
}
