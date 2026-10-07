import { useState } from 'react';
import type { Product } from '../api/types';
import { useCart, type CartLine } from '../cart/CartContext';
import { money } from '../lib/format';
import ProductModal from './ProductModal';
import { VegDot } from './ui';

/** Menu / grocery list with add-to-cart. Handles the "one restaurant per cart" rule. */
export default function ProductList({ products, sourceName, canOrder = true }: { products: Product[]; sourceName: string; canOrder?: boolean }) {
  const cart = useCart();
  const [picked, setPicked] = useState<Product | null>(null);

  function addLine(line: Omit<CartLine, 'key'>) {
    if (cart.add(line) === 'conflict') {
      if (window.confirm(`Your cart has items from ${cart.sourceName}. Start a new cart with ${sourceName}?`)) cart.replaceWith(line);
    }
    setPicked(null);
  }

  function quickAdd(p: Product) {
    if (p.variants.length > 0 || p.addons.length > 0) return setPicked(p);
    addLine({
      productId: p.id, name: p.name, imageUrl: p.imageUrl, unitPrice: p.price, quantity: 1,
      addonIds: [], addonNames: [], restaurantId: p.restaurantId, sourceName,
    });
  }

  const groups = products.reduce<Record<string, Product[]>>((acc, p) => {
    (acc[p.category ?? 'Other'] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(groups).map(([cat, items]) => (
        <section key={cat} className="mb-6">
          <h3 className="mb-2 text-lg font-bold">{cat}</h3>
          <ul className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
            {items.map((p) => {
              const soldOut = !p.available || (p.stock !== null && p.stock !== undefined && p.stock <= 0);
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!p.grocery && <VegDot veg={p.veg} />}
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    {p.description && <p className="truncate text-sm text-stone-500">{p.description}</p>}
                    <p className="text-sm font-medium">{money(p.price)}{p.variants.length > 0 && ' onwards'}</p>
                    {p.grocery && p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= 5 && (
                      <p className="text-xs text-amber-700">Only {p.stock} left</p>
                    )}
                  </div>
                  {canOrder && (
                    <button className="btn-outline shrink-0" disabled={soldOut} onClick={() => quickAdd(p)} aria-label={`Add ${p.name}`}>
                      {soldOut ? 'Sold out' : 'Add'}
                    </button>
                  )}
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
