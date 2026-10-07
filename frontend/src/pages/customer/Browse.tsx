import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';
import type { Coupon, Product, Restaurant, RestaurantMenu } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import ProductList from '../../components/ProductList';
import { ErrorBox, HeartIcon, SearchIcon, Spinner } from '../../components/ui';
import { money } from '../../lib/format';

/** Shown only for restaurants flagged pure vegetarian. */
function PureVegBadge() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700"><span className="h-2 w-2 rounded-full bg-green-600" aria-hidden />Pure Veg</span>;
}

function RatingChip({ r }: { r: Restaurant }) {
  return r.reviewCount > 0 ? (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-green-600 px-2 py-0.5 text-xs font-bold text-white">★ {Number(r.rating).toFixed(1)}</span>
  ) : (
    <span className="shrink-0 whitespace-nowrap rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600">New</span>
  );
}

/**
 * The restaurant's own picture when it has one; otherwise a plain monogram. Never a stock or borrowed photo.
 * The pictures we hold are logos and storefronts of different sizes, so they sit contained on a soft panel instead of being stretched.
 */
function RestaurantMedia({ r, className = '', imgClass = 'h-[78%]' }: { r: Restaurant; className?: string; imgClass?: string }) {
  return (
    <div className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-cream to-cream-deep ${className}`}>
      {r.imageUrl ? (
        <img src={r.imageUrl} alt={`${r.name} logo`} loading="lazy" className={`${imgClass} w-auto max-w-[80%] rounded-2xl bg-white object-contain p-1 shadow-soft transition duration-500 group-hover:scale-105`} />
      ) : (
        <span aria-hidden className="flex h-[62%] aspect-square items-center justify-center rounded-full bg-brand-light font-display text-5xl font-semibold text-brand">{r.name.charAt(0)}</span>
      )}
    </div>
  );
}

const FAV_KEY = 'zestora_favourites_v1';
/** Favourites live in this browser only (no account data is involved). */
function useFavourites() {
  const [ids, setIds] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) ?? '[]') as number[]; } catch { return []; }
  });
  const toggle = (id: number) => setIds((prev) => {
    const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    try { localStorage.setItem(FAV_KEY, JSON.stringify(next)); } catch { /* storage unavailable: just not remembered */ }
    return next;
  });
  return { ids, toggle };
}

function RestaurantCard({ r, fav, onFav }: { r: Restaurant; fav: boolean; onFav: () => void }) {
  const facts = [r.city, r.deliveryMax > 0 ? `${r.deliveryMin}–${r.deliveryMax} min` : null, r.costForTwo ? `${money(r.costForTwo)} for two` : null].filter(Boolean).join(' · ');
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-200/70 bg-white shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <Link to={`/restaurants/${r.id}`} className="block" aria-label={`${r.name}, view menu`}>
        <RestaurantMedia r={r} className="aspect-[16/10]" />
        <div className="space-y-1.5 p-5 pb-3">
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-xl font-semibold leading-snug">{r.name}</h2>
            <RatingChip r={r} />
          </div>
          <p className="text-sm text-stone-500">{r.cuisines.join(' • ')}</p>
          {r.vegOnly && <PureVegBadge />}
          {facts && <p className="text-sm text-stone-700">{facts}</p>}
          {!r.open && <p className="text-sm font-semibold text-red-600">Currently closed</p>}
        </div>
      </Link>
      <div className="mt-auto flex items-center justify-between px-5 pb-5">
        <Link to={`/restaurants/${r.id}`} className="btn-primary" tabIndex={-1} aria-hidden>View menu</Link>
      </div>
      <button
        type="button"
        onClick={onFav}
        aria-pressed={fav}
        aria-label={fav ? `Remove ${r.name} from favourites` : `Save ${r.name} to favourites`}
        className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-soft backdrop-blur transition hover:scale-105 ${fav ? 'text-brand' : 'text-stone-500'}`}
      >
        <HeartIcon filled={fav} />
      </button>
    </div>
  );
}

function Hero({ restaurants }: { restaurants?: Restaurant[] }) {
  const withLogo = restaurants?.filter((r) => r.imageUrl).slice(0, 3) ?? [];
  const positions = ['-left-2 top-[18%]', '-right-2 top-[44%]', 'left-[14%] -bottom-3'];
  return (
    <section className="grid items-center gap-8 pb-10 pt-2 lg:grid-cols-[1.05fr_1fr] lg:pb-16 lg:pt-6" aria-labelledby="hero-title">
      <div className="animate-rise">
        <h1 id="hero-title" className="font-display text-[2.6rem] font-semibold leading-[1.08] tracking-tight sm:text-6xl">
          Not just food,<br />a taste of<br /><span className="text-brand">Bhatkal.</span>
        </h1>
        <p className="mt-5 max-w-md text-base text-stone-600">
          Order from local kitchens, with menus and prices exactly as each restaurant prints them. Groceries too, delivered to your door.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <a href="#restaurants" className="btn-primary px-5 py-3 sm:px-7">View restaurants</a>
          <Link to="/grocery" className="btn-outline px-5 py-3 sm:px-7">Explore grocery</Link>
        </div>
      </div>

      <div className="relative mx-auto aspect-square w-full max-w-[300px] sm:max-w-[420px] animate-rise [animation-delay:120ms]" aria-hidden>
        <div className="absolute inset-[6%] rounded-full bg-gradient-to-br from-white to-cream-deep shadow-lift" />
        <div className="absolute inset-[14%] rounded-full border border-stone-200/80 bg-cream shadow-[inset_0_6px_30px_rgba(60,30,20,0.12)]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <p className="font-display text-7xl font-semibold leading-none text-brand">{restaurants ? restaurants.length : '·'}</p>
          <p className="mt-2 max-w-[11rem] text-sm text-stone-600">local kitchens cooking for you</p>
        </div>
        {withLogo.map((r, i) => (
          <img key={r.id} src={r.imageUrl} alt="" loading="lazy" className={`absolute h-16 w-16 rounded-full border-4 border-white bg-white object-cover shadow-lift sm:h-20 sm:w-20 ${positions[i]}`} />
        ))}
        <div className="absolute -top-1 right-[4%] max-w-[170px] rounded-2xl bg-white/95 px-3.5 py-2.5 text-xs shadow-lift backdrop-blur">
          <p className="font-semibold text-brand">Free delivery</p>
          <p className="text-stone-600">on food orders of ₹499 and above</p>
        </div>
      </div>
    </section>
  );
}

export function HomePage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const fav = useFavourites();

  // The header's search icon lands here with ?search=1.
  useEffect(() => {
    if (params.get('search')) {
      searchRef.current?.focus();
      searchRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [params]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['restaurants', q, vegOnly],
    queryFn: () => api<Restaurant[]>(`/restaurants?vegOnly=${vegOnly}${q ? `&q=${encodeURIComponent(q)}` : ''}`),
  });
  // The unfiltered list feeds the hero count and the cuisine chips, so they stay put while a filter is applied.
  const all = useQuery({ queryKey: ['restaurants', '', false], queryFn: () => api<Restaurant[]>('/restaurants?vegOnly=false') });
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: () => api<Coupon[]>('/coupons') });

  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    all.data?.forEach((r) => r.cuisines.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name);
  }, [all.data]);

  return (
    <>
      <Hero restaurants={all.data} />

      <section id="restaurants" className="scroll-mt-24" aria-labelledby="nearby-title">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="nearby-title" className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Nearby restaurants</h2>
            <p className="mt-1 text-sm text-stone-500">Order from local restaurants in Bhatkal and the coast</p>
          </div>
          <Link to="/grocery" className="btn-outline">QuickMart grocery →</Link>
        </div>

        <div className="relative mb-4 max-w-md">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><SearchIcon /></span>
          <input ref={searchRef} className="input rounded-full py-3 pl-12" placeholder="Search restaurants or cuisines" aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Filters">
          <label className={`chip cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand ${vegOnly ? 'chip-on' : ''}`}>
            <input type="checkbox" className="sr-only" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} />
            <span className={`h-2 w-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-green-600'}`} aria-hidden />Pure veg only
          </label>
          {cuisines.map((c) => (
            <button key={c} type="button" className={`chip ${q.toLowerCase() === c.toLowerCase() ? 'chip-on' : ''}`} aria-pressed={q.toLowerCase() === c.toLowerCase()} onClick={() => setQ(q.toLowerCase() === c.toLowerCase() ? '' : c)}>
              {c}
            </button>
          ))}
          {(q || vegOnly) && <button type="button" className="chip border-transparent bg-transparent text-brand" onClick={() => { setQ(''); setVegOnly(false); }}>Clear</button>}
        </div>

        {isLoading && <Spinner />}
        {error ? <ErrorBox error={error} /> : null}
        {data && data.length === 0 && (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white/60 p-10 text-center">
            <p className="font-display text-xl">No restaurants match your search.</p>
            <p className="mt-1 text-sm text-stone-500">Try a different word, or clear the filters.</p>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((r) => <RestaurantCard key={r.id} r={r} fav={fav.ids.includes(r.id)} onFav={() => fav.toggle(r.id)} />)}
        </div>
      </section>

      {coupons.data && coupons.data.length > 0 && (
        <section className="mt-16" aria-labelledby="offers-title">
          <h2 id="offers-title" className="font-display text-3xl font-semibold tracking-tight">Offers for you</h2>
          <p className="mt-1 text-sm text-stone-500">Apply these codes at checkout.</p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.data.map((c) => (
              <li key={c.code} className="rounded-3xl border border-dashed border-brand/50 bg-brand-light/60 p-5">
                <p className="font-display text-2xl font-semibold text-brand">{c.code}</p>
                {c.description && <p className="mt-1 text-sm text-stone-700">{c.description}</p>}
                {c.minOrder > 0 && <p className="mt-2 text-xs text-stone-500">On orders of {money(c.minOrder)} and above</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-16" aria-labelledby="why-title">
        <h2 id="why-title" className="font-display text-3xl font-semibold tracking-tight">Why Zestora</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ['Menus as printed', 'Dish names, prices and veg labels come from the restaurants themselves. Anything they have not told us is left out, not guessed.'],
            ['Prices you can trust', 'The server works out every total from the menu before you pay. Delivery is free on food orders of ₹499 and above.'],
            ['Follow your order', 'Watch it move from the kitchen to your door, step by step.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-3xl bg-white p-6 shadow-soft">
              <h3 className="font-display text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-stone-600">{d}</p>
            </div>
          ))}
        </div>
      </section>
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
  const facts = [r.city, r.deliveryMax > 0 ? `${r.deliveryMin}–${r.deliveryMax} min` : null, r.minOrder > 0 ? `Min order ${money(r.minOrder)}` : null].filter(Boolean);
  return (
    <>
      <Link to="/" className="mb-3 inline-block text-sm text-stone-500 hover:text-brand">← All restaurants</Link>
      <section className="grid overflow-hidden rounded-[2rem] bg-white shadow-soft sm:grid-cols-[minmax(0,260px)_1fr]">
        <RestaurantMedia r={r} className="aspect-[16/9] sm:aspect-auto sm:min-h-[220px]" imgClass="h-[70%] sm:h-[75%]" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <RatingChip r={r} />
            {r.vegOnly && <PureVegBadge />}
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.open ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{r.open ? 'Open now' : 'Closed'}</span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{r.name}</h1>
          {r.cuisines.length > 0 && <p className="mt-1 text-stone-500">{r.cuisines.join(' • ')}</p>}
          {facts.length > 0 && <p className="mt-3 text-sm text-stone-700">{facts.join(' · ')}</p>}
          {r.description && <p className="mt-3 max-w-xl text-sm text-stone-600">{r.description}</p>}
        </div>
      </section>
      {!r.open && <p className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">This restaurant is closed right now. You can browse the menu but cannot order.</p>}
      <div className="mt-8">
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-stone-600 shadow-soft">This restaurant's menu has not been added yet. Please check back soon.</p>
        ) : (
          <ProductList products={items} sourceName={r.name} canOrder={r.open && (!user || user.role === 'CUSTOMER')} filters />
        )}
      </div>
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
      <div className="mb-5">
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Quick<span className="text-brand">Mart</span></h1>
        <p className="mt-1 text-sm text-stone-500">Fresh groceries from local stores, delivered fast</p>
      </div>
      <div className="relative mb-6 max-w-md">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><SearchIcon /></span>
        <input className="input rounded-full py-3 pl-12" placeholder="Search groceries" aria-label="Search groceries" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {isLoading && <Spinner />}
      {error ? <ErrorBox error={error} /> : null}
      {data && data.length === 0 && <p className="text-stone-500">Nothing matches your search.</p>}
      {data && <ProductList products={data} sourceName="QuickMart" canOrder={!user || user.role === 'CUSTOMER'} />}
    </>
  );
}
