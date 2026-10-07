import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { AdminMetrics, AuditEntry, Coupon, Order, Role, User } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { ErrorBox, Field, PageTitle, Spinner, StatusBadge } from '../../components/ui';
import { dateTime, money } from '../../lib/format';
import { useStompTopic } from '../../realtime/useStompTopic';

const TABS = ['Overview', 'Orders', 'Users', 'Coupons', 'Audit log'] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('Overview');
  return (
    <>
      <PageTitle sub="Platform control centre">Admin</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'Overview' && <Overview />}
      {tab === 'Orders' && <Orders />}
      {tab === 'Users' && <Users />}
      {tab === 'Coupons' && <Coupons />}
      {tab === 'Audit log' && <Audit />}
    </>
  );
}

function Overview() {
  const qc = useQueryClient();
  const m = useQuery({ queryKey: ['admin-metrics'], queryFn: () => api<AdminMetrics>('/admin/metrics'), refetchInterval: 15000 });
  useStompTopic('/topic/admin/live', () => qc.invalidateQueries({ queryKey: ['admin-metrics'] }));
  if (m.isLoading) return <Spinner />;
  if (m.error || !m.data) return <ErrorBox error={m.error} />;
  const d = m.data;
  const stat = (label: string, value: string | number) => (
    <div className="card"><p className="text-xs font-semibold uppercase text-stone-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
  );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat('GMV (delivered)', money(d.gmv))}
        {stat('Platform commission', money(d.platformCommission))}
        {stat('Active orders', d.activeOrders)}
        {stat('Riders online', d.ridersOnline)}
        {stat('Restaurants', d.restaurants)}
        {stat('Users', d.users)}
      </div>
      <h2 className="mb-2 mt-6 font-bold">Orders by status</h2>
      <div className="flex flex-wrap gap-2 text-sm">
        {Object.entries(d.ordersByStatus).map(([s, n]) => <span key={s} className="rounded-full bg-stone-200 px-3 py-1">{s}: {n}</span>)}
        {Object.keys(d.ordersByStatus).length === 0 && <span className="text-stone-500">No orders yet.</span>}
      </div>
    </>
  );
}

function Orders() {
  const q = useQuery({ queryKey: ['admin-orders'], queryFn: () => api<Order[]>('/admin/orders'), refetchInterval: 10000 });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-stone-100 text-xs uppercase text-stone-500"><tr><th className="p-2">Order</th><th className="p-2">Source</th><th className="p-2">Status</th><th className="p-2">Payment</th><th className="p-2 text-right">Total</th><th className="p-2">Placed</th></tr></thead>
        <tbody>
          {q.data?.map((o) => (
            <tr key={o.id} className="border-t"><td className="p-2">{o.orderNumber}</td><td className="p-2">{o.restaurantName}</td><td className="p-2"><StatusBadge status={o.status} /></td><td className="p-2">{o.paymentStatus}</td><td className="p-2 text-right">{money(o.total)}</td><td className="p-2">{dateTime(o.createdAt)}</td></tr>
          ))}
        </tbody>
      </table>
      {q.data?.length === 0 && <p className="p-4 text-stone-500">No orders yet.</p>}
    </div>
  );
}

const STAFF_ROLES: Role[] = ['RESTAURANT_OWNER', 'RESTAURANT_MANAGER', 'DELIVERY_PARTNER', 'SUPPORT_AGENT', 'GROCERY_MANAGER', 'ADMIN'];

function Users() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ['admin-users'], queryFn: () => api<User[]>('/admin/users') });
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'RESTAURANT_OWNER' as Role });
  const create = useMutation({
    mutationFn: () => api<User>('/admin/users', { method: 'POST', body: { ...form, phone: form.phone || undefined } }),
    onSuccess: () => {
      setForm({ name: '', email: '', phone: '', password: '', role: 'RESTAURANT_OWNER' });
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="overflow-x-auto rounded-xl border bg-white">
        {users.isLoading ? <Spinner /> : (
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs uppercase text-stone-500"><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th></tr></thead>
            <tbody>{users.data?.map((u) => <tr key={u.id} className="border-t"><td className="p-2">{u.name}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role}</td></tr>)}</tbody>
          </table>
        )}
      </div>
      <form onSubmit={submit} className="card h-fit space-y-3">
        <h2 className="font-bold">Create staff account</h2>
        <Field label="Name"><input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email"><input className="input" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Phone"><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Temporary password"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
        <Field label="Role">
          <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {STAFF_ROLES.filter((r) => r !== 'ADMIN' || me?.role === 'SUPER_ADMIN').map((r) => <option key={r}>{r}</option>)}
          </select>
        </Field>
        {create.error ? <ErrorBox error={create.error} /> : null}
        {create.isSuccess && <p className="text-sm text-green-700">Account created.</p>}
        <button className="btn-primary w-full" disabled={create.isPending}>Create</button>
        <p className="text-xs text-stone-500">Link a restaurant owner to a restaurant, or add a rider profile, with the admin API (`POST /admin/restaurants`, `/admin/riders`).</p>
      </form>
    </div>
  );
}

function Coupons() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['coupons'], queryFn: () => api<Coupon[]>('/coupons') });
  const [f, setF] = useState({ code: '', description: '', type: 'PERCENT' as Coupon['type'], value: '10', maxDiscount: '', minOrder: '0' });
  const create = useMutation({
    mutationFn: () => api('/admin/coupons', { method: 'POST', body: { code: f.code, description: f.description || undefined, type: f.type, value: Number(f.value), maxDiscount: f.maxDiscount ? Number(f.maxDiscount) : undefined, minOrder: Number(f.minOrder) } }),
    onSuccess: () => {
      setF({ ...f, code: '', description: '' });
      qc.invalidateQueries({ queryKey: ['coupons'] });
    },
  });
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="divide-y rounded-xl border bg-white text-sm">
        {list.data?.map((c) => (
          <li key={c.code} className="flex justify-between p-3"><div><strong>{c.code}</strong> <span className="text-stone-500">{c.description}</span></div><span>{c.type} {c.value} · min {money(c.minOrder)}</span></li>
        ))}
      </ul>
      <form onSubmit={(e) => { e.preventDefault(); create.mutate(); }} className="card h-fit space-y-3">
        <h2 className="font-bold">New coupon</h2>
        <Field label="Code"><input className="input" required pattern="[A-Za-z0-9_-]{3,40}" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
        <Field label="Description"><input className="input" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Type"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as Coupon['type'] })}><option value="PERCENT">Percent</option><option value="FLAT">Flat ₹</option><option value="FREE_DELIVERY">Free delivery</option></select></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Value"><input className="input" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
          <Field label="Max ₹"><input className="input" inputMode="decimal" value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} /></Field>
          <Field label="Min order"><input className="input" inputMode="decimal" value={f.minOrder} onChange={(e) => setF({ ...f, minOrder: e.target.value })} /></Field>
        </div>
        {create.error ? <ErrorBox error={create.error} /> : null}
        <button className="btn-primary w-full" disabled={create.isPending}>Create coupon</button>
      </form>
    </div>
  );
}

function Audit() {
  const q = useQuery({ queryKey: ['audit'], queryFn: () => api<AuditEntry[]>('/admin/audit-logs') });
  if (q.isLoading) return <Spinner />;
  if (q.error) return <ErrorBox error={q.error} />;
  return (
    <ul className="divide-y rounded-xl border bg-white text-sm">
      {q.data?.map((a) => (
        <li key={a.id} className="flex flex-wrap justify-between gap-2 p-3"><span><strong>{a.action}</strong> {a.entity} {a.entityId}</span><span className="text-stone-500">{a.actorRole} · {dateTime(a.createdAt)}</span></li>
      ))}
    </ul>
  );
}
