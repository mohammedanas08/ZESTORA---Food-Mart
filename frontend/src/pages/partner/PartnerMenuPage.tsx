import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import type { Product, RestaurantMenu } from '../../api/types';
import { ErrorBox, Field, PageTitle, Spinner, VegDot } from '../../components/ui';
import { money } from '../../lib/format';

export default function PartnerMenuPage() {
  const qc = useQueryClient();
  const menu = useQuery({ queryKey: ['partner-menu'], queryFn: () => api<RestaurantMenu>('/partner/restaurant') });
  const refresh = () => qc.invalidateQueries({ queryKey: ['partner-menu'] });

  const update = useMutation({
    mutationFn: (v: { id: number; price?: number; available?: boolean }) => api(`/partner/products/${v.id}`, { method: 'PUT', body: { price: v.price, available: v.available } }),
    onSuccess: refresh,
  });
  const setOpen = useMutation({
    mutationFn: (open: boolean) => api('/partner/restaurant/open', { method: 'PATCH', body: { open } }),
    onSuccess: refresh,
  });
  const create = useMutation({
    mutationFn: (v: { name: string; category: string; price: number; veg: boolean }) => api('/partner/products', { method: 'POST', body: v }),
    onSuccess: refresh,
  });

  const [draft, setDraft] = useState({ name: '', category: '', price: '', veg: true });
  const [editing, setEditing] = useState<Record<number, string>>({});

  if (menu.isLoading) return <Spinner />;
  if (menu.error || !menu.data) return <ErrorBox error={menu.error} />;
  const { restaurant: r, items } = menu.data;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate({ name: draft.name, category: draft.category, price: Number(draft.price), veg: draft.veg }, { onSuccess: () => setDraft({ name: '', category: '', price: '', veg: true }) });
  };

  return (
    <>
      <PageTitle sub={r.open ? 'Currently open for orders' : 'Currently closed'}>{r.name}: menu</PageTitle>
      <button className="btn-outline mb-4" onClick={() => setOpen.mutate(!r.open)}>{r.open ? 'Close restaurant for now' : 'Reopen restaurant'}</button>
      {update.error ? <ErrorBox error={update.error} /> : null}

      <ul className="divide-y rounded-xl border bg-white">
        {items.map((p: Product) => (
          <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div className="flex items-center gap-2"><VegDot veg={p.veg} /><span className={p.available ? 'font-semibold' : 'text-stone-400 line-through'}>{p.name}</span><span className="text-xs text-stone-500">{p.category}</span></div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <input
                className="input w-24 shrink-0"
                inputMode="decimal"
                aria-label={`Price of ${p.name}`}
                value={editing[p.id] ?? String(p.price)}
                onChange={(e) => setEditing({ ...editing, [p.id]: e.target.value })}
              />
              <button
                className="btn-outline whitespace-nowrap"
                disabled={editing[p.id] === undefined || Number(editing[p.id]) === Number(p.price) || Number.isNaN(Number(editing[p.id]))}
                onClick={() => update.mutate({ id: p.id, price: Number(editing[p.id]) }, { onSuccess: () => setEditing(({ [p.id]: _drop, ...rest }) => rest) })}
              >
                Save
              </button>
              <button className={`${p.available ? 'btn-outline' : 'btn-primary'} ml-auto whitespace-nowrap sm:ml-0`} onClick={() => update.mutate({ id: p.id, available: !p.available })}>
                {p.available ? 'Sold out' : 'Back in stock'}
              </button>
              <span className="hidden text-sm text-stone-500 sm:inline">{money(p.price)}</span>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="card mt-6 grid gap-3 sm:grid-cols-5">
        <h2 className="font-bold sm:col-span-5">Add a dish</h2>
        <Field label="Name"><input className="input" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
        <Field label="Category"><input className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
        <Field label="Price (₹)"><input className="input" required inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={draft.veg} onChange={(e) => setDraft({ ...draft, veg: e.target.checked })} /> Vegetarian</label>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={create.isPending}>Add</button></div>
        {create.error ? <div className="sm:col-span-5"><ErrorBox error={create.error} /></div> : null}
      </form>
    </>
  );
}
