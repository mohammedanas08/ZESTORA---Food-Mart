import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Order, Ticket } from '../../api/types';
import OrderTracker from '../../components/OrderTracker';
import PaymentPanel from '../../components/PaymentPanel';
import { ErrorBox, Field, PageTitle, Spinner, StatusBadge } from '../../components/ui';
import { dateTime, money } from '../../lib/format';
import { useStompTopic } from '../../realtime/useStompTopic';

export function OrdersPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['orders', 'mine'], queryFn: () => api<Order[]>('/orders/me'), refetchInterval: 20000 });
  return (
    <>
      <PageTitle>My orders</PageTitle>
      {isLoading && <Spinner />}
      {error ? <ErrorBox error={error} /> : null}
      {data?.length === 0 && <p className="text-stone-500">No orders yet. <Link className="text-brand underline" to="/">Order something tasty</Link></p>}
      <div className="space-y-3">
        {data?.map((o) => (
          <Link key={o.id} to={`/orders/${o.id}`} className="card flex items-center justify-between transition hover:shadow-md">
            <div>
              <p className="font-semibold">{o.restaurantName ?? 'Order'} <span className="text-sm font-normal text-stone-500">· {o.orderNumber}</span></p>
              <p className="text-sm text-stone-500">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}</p>
              <p className="text-xs text-stone-400">{dateTime(o.createdAt)}</p>
            </div>
            <div className="text-right">
              <StatusBadge status={o.status} />
              <p className="mt-1 font-bold">{money(o.total)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api<Order>(`/orders/${id}`),
    refetchInterval: 15000, // fallback if the WebSocket drops
  });
  // Live updates: the server pushes a message whenever this order changes status.
  useStompTopic(id ? `/topic/order/${id}` : null, () => qc.invalidateQueries({ queryKey: ['order', id] }));

  const cancel = useMutation({
    mutationFn: () => api<Order>(`/orders/${id}/status`, { method: 'PATCH', body: { status: 'CANCELLED', note: 'Cancelled by customer' } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  if (isLoading) return <Spinner />;
  if (error || !order) return <ErrorBox error={error} />;

  const canCancel = ['PLACED', 'CONFIRMED', 'RESTAURANT_ACCEPTED'].includes(order.status);
  const unpaid = order.status === 'PLACED' && order.paymentStatus === 'PENDING';
  const riderActive = order.rider && ['DELIVERY_ASSIGNED', 'PICKED_UP', 'ON_THE_WAY'].includes(order.status);

  return (
    <>
      <PageTitle sub={`${order.orderNumber} · placed ${dateTime(order.createdAt)}`}>{order.restaurantName ?? 'Order'}</PageTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          {unpaid && <PaymentPanel order={order} />}
          <section className="card">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Status</h2><StatusBadge status={order.status} /></div>
            <OrderTracker order={order} />
          </section>
          {riderActive && order.rider && (
            <section className="card text-sm">
              <h2 className="mb-1 font-bold">Your rider</h2>
              <p>{order.rider.name}{order.rider.phone && <> · <a className="text-brand underline" href={`tel:${order.rider.phone}`}>{order.rider.phone}</a></>}</p>
              {order.deliveryOtp && (
                <p className="mt-3 rounded-lg bg-brand-light p-3">
                  Delivery code: <strong className="text-lg tracking-widest" data-testid="delivery-otp">{order.deliveryOtp}</strong>
                  <span className="block text-xs text-stone-600">Tell this code to the rider only when you receive your order.</span>
                </p>
              )}
            </section>
          )}
          {canCancel && (
            <div>
              <button className="btn-danger" disabled={cancel.isPending} onClick={() => window.confirm('Cancel this order?') && cancel.mutate()}>Cancel order</button>
              {cancel.error ? <div className="mt-2"><ErrorBox error={cancel.error} /></div> : null}
            </div>
          )}
          {order.status === 'DELIVERED' && <ReviewForm orderId={order.id} />}
        </div>

        <section className="card h-fit text-sm">
          <h2 className="mb-2 font-bold">Order summary</h2>
          <ul className="mb-3 space-y-1">
            {order.items.map((i, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{i.quantity}× {i.name}{(i.variantName || i.addons) && <span className="text-stone-500"> ({[i.variantName, i.addons].filter(Boolean).join(', ')})</span>}</span>
                <span>{money(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t pt-2">
            <Line l="Items" v={order.subtotal} />
            {order.packagingFee > 0 && <Line l="Packaging" v={order.packagingFee} />}
            <Line l="Delivery" v={order.deliveryFee} free />
            <Line l="Platform fee" v={order.platformFee} />
            <Line l="GST" v={order.tax} />
            {order.tip > 0 && <Line l="Rider tip" v={order.tip} />}
            {order.discount > 0 && <Line l={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`} v={-order.discount} />}
            <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total</span><span>{money(order.total)}</span></div>
          </div>
          <p className="mt-3 text-stone-500">Deliver to: {order.address.street}{order.address.area ? `, ${order.address.area}` : ''}, {order.address.city} {order.address.pincode}</p>
          <p className="mt-1 text-stone-500">Payment: {order.paymentMethod} · {order.paymentStatus}</p>
          <Link className="mt-3 inline-block text-brand underline" to="/support">Need help with this order?</Link>
        </section>
      </div>
    </>
  );
}

function Line({ l, v, free }: { l: string; v: number; free?: boolean }) {
  return <div className="flex justify-between"><span>{l}</span><span>{free && v === 0 ? 'FREE' : money(v)}</span></div>;
}

function ReviewForm({ orderId }: { orderId: number }) {
  const [food, setFood] = useState(5);
  const [delivery, setDelivery] = useState(5);
  const [comment, setComment] = useState('');
  const send = useMutation({
    mutationFn: () => api('/reviews', { method: 'POST', body: { orderId, foodRating: food, deliveryRating: delivery, comment: comment || undefined } }),
  });
  if (send.isSuccess) return <p className="card text-green-700">Thanks for your review!</p>;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    send.mutate();
  };
  return (
    <form onSubmit={submit} className="card space-y-3">
      <h2 className="font-bold">Rate your order</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Food"><select className="input" value={food} onChange={(e) => setFood(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></Field>
        <Field label="Delivery"><select className="input" value={delivery} onChange={(e) => setDelivery(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n}>{n}</option>)}</select></Field>
      </div>
      <Field label="Comment"><textarea className="input" rows={2} maxLength={1000} value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      {send.error ? <ErrorBox error={send.error} /> : null}
      <button className="btn-primary" disabled={send.isPending}>Submit review</button>
    </form>
  );
}

export function SupportPage() {
  const qc = useQueryClient();
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: () => api<Ticket[]>('/support/tickets/me') });
  const [form, setForm] = useState({ category: 'ORDER_ISSUE', subject: '', message: '' });
  const open = useMutation({
    mutationFn: () => api<Ticket>('/support/tickets', { method: 'POST', body: form }),
    onSuccess: () => {
      setForm({ category: 'ORDER_ISSUE', subject: '', message: '' });
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
  return (
    <>
      <PageTitle sub="We usually reply within a few hours">Support</PageTitle>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={(e) => { e.preventDefault(); open.mutate(); }} className="card h-fit space-y-3">
          <h2 className="font-bold">New ticket</h2>
          <Field label="Topic">
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="ORDER_ISSUE">Order issue</option><option value="PAYMENT">Payment / refund</option><option value="ACCOUNT">Account</option><option value="OTHER">Other</option>
            </select>
          </Field>
          <Field label="Subject"><input className="input" required maxLength={200} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></Field>
          <Field label="Message"><textarea className="input" required rows={4} maxLength={2000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></Field>
          {open.error ? <ErrorBox error={open.error} /> : null}
          <button className="btn-primary" disabled={open.isPending}>Send</button>
        </form>
        <div className="space-y-3">
          <h2 className="font-bold">Your tickets</h2>
          {tickets.isLoading && <Spinner />}
          {tickets.data?.length === 0 && <p className="text-sm text-stone-500">No tickets yet.</p>}
          {tickets.data?.map((t) => (
            <div key={t.id} className="card text-sm">
              <div className="flex justify-between"><strong>{t.subject}</strong><span className="text-xs text-stone-500">{t.ticketNo} · {t.status}</span></div>
              <p className="mt-1 text-stone-600">{t.messages[t.messages.length - 1]?.message}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
