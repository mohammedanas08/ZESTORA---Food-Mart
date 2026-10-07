import { useMemo, useState } from 'react';
import type { Product } from '../api/types';
import { useCart, type CartLine } from '../cart/CartContext';
import { money } from '../lib/format';
import ProductModal from './ProductModal';
import { CartIcon, PlusIcon, SearchIcon, VegDot } from './ui';

const slug = (s: string) => 'cat-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-');

/** Menu / grocery list with add-to-cart. Handles the "one restaurant per cart" rule. */
export default function ProductList({ products, sourceName, canOrder = true, filters = false }: { products: Product[]; sourceName: string; canOrder?: boolean; filters?: boolean }) {
  const cart = useCart();
  const [picked, setPicked] = useState<Product | null>(null);
  const [q, setQ] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  function addLine(line: Omit<CartLine, 'key'>) {
    if (cart.add(line) === 'conflict') {
      if (window.confirm(`Your cart has items from ${cart.sourceName}. Start a new cart with ${sourceName}?`)) cart.replaceWith(line);
    }
    setPicked(null);
  }

  function quickAdd(p: Product) {
    if (p.variants.length > 0 || p.addons.length > 0) return setPicked(p);
    if (p.price == null) return;
    addLine({
      productId: p.id, name: p.name, imageUrl: p.imageUrl, unitPrice: p.price, quantity: 1,
      addonIds: [], addonNames: [], restaurantId: p.restaurantId, sourceName,
    });
  }

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return products.filter((p) => (!vegOnly || p.veg === true) && (!needle || p.name.toLowerCase().includes(needle) || (p.description ?? '').toLowerCase().includes(needle)));
  }, [products, q, vegOnly]);

  const groups = visible.reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.category ?? 'Other'] ??= []).push(p);
    return acc;
  }, {});
  const names = Object.keys(groups);

  return (
    <>
      {filters && (
        <div className="sticky top-[60px] z-20 -mx-4 mb-6 border-b border-stone-200/60 bg-cream/95 px-4 pb-3 pt-2 backdrop-blur sm:top-[68px]">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"><SearchIcon /></span>
              <input className="input rounded-full pl-12" placeholder="Search this menu" aria-label="Search menu" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <button type="button" className={`chip ${vegOnly ? 'chip-on' : ''}`} aria-pressed={vegOnly} onClick={() => setVegOnly(!vegOnly)}>
              <span className={`h-2 w-2 rounded-full ${vegOnly ? 'bg-white' : 'bg-green-600'}`} aria-hidden />Veg only
            </button>
          </div>
          {names.length > 1 && (
            <nav className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" aria-label="Menu categories">
              {names.map((c) => (
                <a key={c} href={`#${slug(c)}`} className="chip" onClick={(e) => { e.preventDefault(); document.getElementById(slug(c))?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>
                  {c}
                </a>
              ))}
            </nav>
          )}
        </div>
      )}

      {filters && names.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 p-8 text-center text-stone-600">No dishes match your search.</p>
      )}

      {names.map((cat) => (
        <section key={cat} id={slug(cat)} className="mb-10 scroll-mt-44">
          <h3 className="mb-4 font-display text-2xl font-semibold tracking-tight">{cat} <span className="ml-1 text-sm font-normal text-stone-400">{groups[cat].length}</span></h3>
          <ul className="grid gap-4 sm:grid-cols-2">
            {groups[cat].map((p) => {
              const soldOut = !p.available || (p.stock !== null && p.stock !== undefined && p.stock <= 0);
              const noPrice = p.price == null;
              const simple = p.variants.length === 0 && p.addons.length === 0;
              const line = simple ? cart.lines.find((l) => l.productId === p.id && !l.variantId && l.addonIds.length === 0) : undefined;
              return (
                <li key={p.id} className="group relative flex gap-4 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                  {p.imageUrl && (
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full bg-cream shadow-soft">
                      <img src={p.imageUrl} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      {!p.grocery && <VegDot veg={p.veg} />}
                      <span className="font-semibold leading-snug">{p.name}</span>
                    </div>
                    {p.description && <p className="mt-0.5 line-clamp-2 text-sm text-stone-500">{p.description}</p>}
                    {p.grocery && p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= 5 && (
                      <p className="text-xs text-amber-700">Only {p.stock} left</p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                      <p className="font-semibold">
                        {noPrice ? <span className="text-sm font-normal text-stone-500">Price on request</span> : <>{money(p.price)}{p.variants.length > 1 && <span className="text-xs font-normal text-stone-500"> onwards</span>}</>}
                      </p>
                      {canOrder && (line ? (
                        <div className="inline-flex items-center gap-1 rounded-full bg-brand-light p-1" role="group" aria-label={`${p.name} quantity`}>
                          <button type="button" className="h-8 w-8 rounded-full bg-white text-lg leading-none text-brand shadow-sm" aria-label={`Decrease ${p.name}`} onClick={() => cart.setQuantity(line.key, line.quantity - 1)}>−</button>
                          <span className="w-6 text-center text-sm font-semibold" aria-live="polite">{line.quantity}</span>
                          <button type="button" className="h-8 w-8 rounded-full bg-brand text-white shadow-sm" aria-label={`Increase ${p.name}`} onClick={() => cart.setQuantity(line.key, line.quantity + 1)}><span className="flex justify-center"><PlusIcon /></span></button>
                        </div>
                      ) : soldOut || noPrice ? (
                        <button className="btn-outline" disabled aria-label={`Add ${p.name}`}>{soldOut ? 'Sold out' : 'Ask restaurant'}</button>
                      ) : (
                        <button className="inline-flex h-11 min-w-[44px] items-center justify-center gap-1.5 rounded-2xl bg-brand px-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(212,31,44,0.7)] transition hover:bg-brand-dark active:scale-95" onClick={() => quickAdd(p)} aria-label={`Add ${p.name}`}>
                          <CartIcon /><span>Add</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {picked && <ProductModal product={picked} sourceName={sourceName} onClose={() => setPicked(null)} onAdd={addLine} />}
    </>
  );
}
