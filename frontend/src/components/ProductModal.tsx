import { useState } from 'react';
import type { Product } from '../api/types';
import type { CartLine } from '../cart/CartContext';
import { money } from '../lib/format';

/** Lets the customer choose a variant, add-ons, quantity and a note before adding to the cart. */
export default function ProductModal({
  product,
  sourceName,
  onClose,
  onAdd,
}: {
  product: Product;
  sourceName: string;
  onClose: () => void;
  onAdd: (line: Omit<CartLine, 'key'>) => void;
}) {
  const [variantId, setVariantId] = useState<number | undefined>(product.variants[0]?.id);
  const [addonIds, setAddonIds] = useState<number[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const variant = product.variants.find((v) => v.id === variantId);
  const chosenAddons = product.addons.filter((a) => addonIds.includes(a.id));
  const unit = (variant?.price ?? product.price ?? 0) + chosenAddons.reduce((s, a) => s + a.price, 0);

  const toggle = (id: number) => setAddonIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:rounded-2xl">
        <h2 className="text-lg font-bold">{product.name}</h2>
        {product.description && <p className="mb-3 text-sm text-stone-500">{product.description}</p>}

        {product.variants.length > 0 && (
          <fieldset className="mb-3">
            <legend className="label">Size</legend>
            {product.variants.map((v) => (
              <label key={v.id} className="flex cursor-pointer items-center justify-between py-1 text-sm">
                <span><input type="radio" name="variant" className="mr-2" checked={variantId === v.id} onChange={() => setVariantId(v.id)} />{v.name}</span>
                <span>{money(v.price)}</span>
              </label>
            ))}
          </fieldset>
        )}

        {product.addons.length > 0 && (
          <fieldset className="mb-3">
            <legend className="label">Add-ons</legend>
            {product.addons.map((a) => (
              <label key={a.id} className="flex cursor-pointer items-center justify-between py-1 text-sm">
                <span><input type="checkbox" className="mr-2" checked={addonIds.includes(a.id)} onChange={() => toggle(a.id)} />{a.name}</span>
                <span>+{money(a.price)}</span>
              </label>
            ))}
          </fieldset>
        )}

        <label className="mb-3 block">
          <span className="label">Cooking instructions</span>
          <input className="input" maxLength={250} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Less spicy, no onion…" />
        </label>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button className="btn-outline px-3" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span className="w-6 text-center" aria-label="Quantity">{quantity}</span>
            <button className="btn-outline px-3" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(50, q + 1))}>+</button>
          </div>
          <span className="font-bold">{money(unit * quantity)}</span>
        </div>

        <div className="flex gap-2">
          <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary flex-1"
            onClick={() =>
              onAdd({
                productId: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
                unitPrice: unit,
                quantity,
                variantId,
                variantName: variant?.name,
                addonIds,
                addonNames: chosenAddons.map((a) => a.name),
                notes: notes.trim() || undefined,
                restaurantId: product.restaurantId,
                sourceName,
              })
            }
          >
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
}
