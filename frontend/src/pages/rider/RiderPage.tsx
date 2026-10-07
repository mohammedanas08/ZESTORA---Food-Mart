import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import type { Order, OrderStatus, RiderProfile } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, PageTitle, Spinner, StatusBadge } from '../../components/ui';
import { money } from '../../lib/format';
import { useStompTopic } from '../../realtime/useStompTopic';

const NEXT: Partial<Record<OrderStatus, { label: string; to: OrderStatus }>> = {
  DELIVERY_ASSIGNED: { label: 'I picked up the order', to: 'PICKED_UP' },
  PICKED_UP: { label: 'Start delivery', to: 'ON_THE_WAY' },
  ON_THE_WAY: { label: 'Mark delivered', to: 'DELIVERED' },
};

export default function RiderPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const profile = useQuery({ queryKey: ['rider-profile'], queryFn: () => api<RiderProfile>('/rider/profile') });
  const orders = useQuery({ queryKey: ['rider-orders'], queryFn: () => api<Order[]>('/rider/orders'), refetchInterval: 5000 });
  // New job offers arrive on the rider's personal queue.
  useStompTopic(user ? '/user/queue/jobs' : null, () => qc.invalidateQueries({ queryKey: ['rider-orders'] }));

  const setOnline = useMutation({
    mutationFn: (online: boolean) => api<RiderProfile>('/rider/status', { method: 'PUT', body: { online } }),
    onSuccess: (p) => qc.setQueryData(['rider-profile'], p),
  });
  const advance = useMutation({
    mutationFn: (v: { id: number; status: OrderStatus; otp?: string }) => api(`/orders/${v.id}/status`, { method: 'PATCH', body: { status: v.status, otp: v.otp } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rider-orders'] });
      qc.invalidateQueries({ queryKey: ['rider-profile'] });
    },
  });
  const [otp, setOtp] = useState<Record<number, string>>({});

  // While online and delivering, share the rider's position (used by the customer's tracking later).
  const online = profile.data?.online;
  useEffect(() => {
    if (!online || !('geolocation' in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => void api('/rider/location', { method: 'POST', body: { lat: pos.coords.latitude, lng: pos.coords.longitude } }).catch(() => {}),
      () => {},
      { maximumAge: 15000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [online]);

  const active = orders.data?.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status)) ?? [];
  const done = orders.data?.filter((o) => o.status === 'DELIVERED') ?? [];

  return (
    <>
      <PageTitle sub="Go online to receive deliveries">Deliveries</PageTitle>
      {profile.isLoading ? <Spinner /> : profile.data && (
        <div className="card mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className={`font-bold ${profile.data.online ? 'text-green-700' : 'text-stone-500'}`}>{profile.data.online ? '● Online' : '○ Offline'}</p>
            <p className="text-sm text-stone-500">{profile.data.totalTrips} trips · wallet {money(profile.data.walletBalance)}</p>
          </div>
          <button className={profile.data.online ? 'btn-outline' : 'btn-primary'} disabled={setOnline.isPending} onClick={() => setOnline.mutate(!profile.data!.online)}>
            {profile.data.online ? 'Go offline' : 'Go online'}
          </button>
        </div>
      )}
      {orders.error ? <ErrorBox error={orders.error} /> : null}
      {advance.error ? <ErrorBox error={advance.error} /> : null}
      {active.length === 0 && <p className="text-stone-500">No active deliveries{profile.data?.online ? '. Waiting for the next order…' : '.'}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {active.map((o) => {
          const next = NEXT[o.status];
          const finishing = next?.to === 'DELIVERED';
          return (
            <div key={o.id} className="card space-y-2" data-testid={`job-${o.id}`}>
              <div className="flex items-center justify-between"><strong>{o.orderNumber}</strong><StatusBadge status={o.status} /></div>
              <p className="text-sm"><span className="font-semibold">Pickup:</span> {o.restaurantName}</p>
              <p className="text-sm"><span className="font-semibold">Drop:</span> {o.customerName} · {o.address.street}, {o.address.area} {o.address.city}</p>
              {o.address.instructions && <p className="text-sm text-stone-500">Note: {o.address.instructions}</p>}
              {o.customerPhone && <a className="text-sm text-brand underline" href={`tel:${o.customerPhone}`}>Call customer</a>}
              <p className="text-sm">Earning: {money(o.deliveryFee + o.tip)} {o.paymentMethod === 'COD' && <strong className="text-red-600"> · Collect {money(o.total)}</strong>}</p>
              {finishing && (
                <input className="input" inputMode="numeric" maxLength={4} placeholder="Customer's 4-digit code" aria-label="Delivery code" value={otp[o.id] ?? ''} onChange={(e) => setOtp({ ...otp, [o.id]: e.target.value })} />
              )}
              {next && (
                <button className="btn-primary w-full" disabled={advance.isPending || (finishing && (otp[o.id] ?? '').length !== 4)} onClick={() => advance.mutate({ id: o.id, status: next.to, otp: finishing ? otp[o.id] : undefined })}>
                  {next.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {done.length > 0 && <p className="mt-6 text-sm text-stone-500">Completed deliveries: {done.length}</p>}
    </>
  );
}
