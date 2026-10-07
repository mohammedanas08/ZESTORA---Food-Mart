import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Product, Restaurant, RestaurantMenu } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import ProductList from '../../components/ProductList';
import { ErrorBox, PageTitle, Spinner } from '../../components/ui';
import { money } from '../../lib/format';

/** The restaurant's logo, only when it has one (nothing is shown otherwise). */
function RestaurantLogo({ r, className }: { r: Restaurant; className: string }) {
  if (!r.imageUrl) return null;
  return <img src={r.imageUrl} alt={`${r.name} logo`} loading="lazy" className={`${className} shrink-0 rounded-lg border border-stone-200 bg-white object-contain p-0.5`} />;
}

export function HomePage() {
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants', q, vegOnly],
    queryFn: () => api<Restaurant[]>(`/restaurants?vegOnly=${vegOnly}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  });

  return (
    <>
      <PageTitle sub="Order from local restaurants in Bhatkal and the coast">Hungry? Let&apos;s fix that.</PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-sm" placeholder="Search restaurants or cuisines" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} /> Pure veg only</label>
        <Link to="/grocery" className="btn-outline ml-auto">QuickMart grocery →</Link>
      </div>
      {isLoading && <Spinner />}
      {error ? <ErrorBox error={error} /> : null}
      {data && data.length === 0 && <p className="text-stone-500">No restaurants match your search.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((r) => (
          <Link key={r.id} to={`/restaurants/${r.id}`} className="card block transition hover:shadow-md">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <RestaurantLogo r={r} className="h-12 w-12" />
                <h2 className="truncate text-lg font-bold">{r.name}</h2>
              </div>
              {r.reviewCount > 0 ? (
                <span className="rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">★ {Number(r.rating).toFixed(1)}</span>
              ) : (
                <span className="rounded bg-stone-200 px-1.5 py-0.5 text-xs font-bold text-stone-600">New</span>
              )}
            </div>
            <p className="text-sm text-stone-500">{r.cuisines.join(' • ')}</p>
            <p className="mt-2 text-sm">{[r.city, r.deliveryMax > 0 ? `${r.deliveryMin}–${r.deliveryMax} min` : null, r.costForTwo ? `${money(r.costForTwo)} for two` : null].filter(Boolean).join(' · ')}</p>
            {!r.open && <p className="mt-1 text-sm font-semibold text-red-600">Currently closed</p>}
          </Link>
        ))}
      </div>
    </>
  );
}

export function RestaurantPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, isLoading, error } = useQuery({ queryKey: ['menu', id], queryFn: () => api<RestaurantMenu>(`/restaurants/${id}`) });

  if (isLoading) return <Spinner />;
  if (error || !data) return <ErrorBox error={error} />;
  const { restaurant: r, items } = data;
  const facts = [r.cuisines.join(' • '), r.city, r.deliveryMax > 0 ? `${r.deliveryMin}–${r.deliveryMax} min` : null, r.minOrder > 0 ? `min order ${money(r.minOrder)}` : null].filter(Boolean).join(' · ');
  return (
    <>
      <div className="flex items-start gap-4">
        <RestaurantLogo r={r} className="h-16 w-16 sm:h-20 sm:w-20" />
        <div className="min-w-0 flex-1"><PageTitle sub={facts}>{r.name}</PageTitle></div>
      </div>
      {r.description && <p className="-mt-2 mb-4 text-sm text-stone-600">{r.description}</p>}
      {!r.open && <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">This restaurant is closed right now. You can browse the menu but cannot order.</p>}
      <ProductList products={items} sourceName={r.name} canOrder={r.open && (!user || user.role === 'CUSTOMER')} />
    </>
  );
}

export function GroceryPage() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const { data, isLoading, error } = useQuery({
    queryKey: ['grocery', q],
    queryFn: () => api<Product[]>(`/grocery/products${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });
  return (
    <>
      <PageTitle sub="Fresh groceries from local stores, delivered fast">QuickMart</PageTitle>
      <input className="input mb-4 max-w-sm" placeholder="Search groceries" aria-label="Search groceries" value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <Spinner />}
      {error ? <ErrorBox error={error} /> : null}
      {data && <ProductList products={data} sourceName="QuickMart" canOrder={!user || user.role === 'CUSTOMER'} />}
    </>
  );
}
