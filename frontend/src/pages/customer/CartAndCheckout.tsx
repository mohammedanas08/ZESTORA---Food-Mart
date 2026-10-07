import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import type { Coupon, CreateOrderRequest, Order } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { useCart } from '../../cart/CartContext';
import { ErrorBox, Field, PageTitle } from '../../components/ui';
import { money } from '../../lib/format';
import { estimateBill } from '../../lib/pricing';

export function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (cart.lines.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="font-display text-3xl font-semibold">Your cart is empty.</p>
        <p className="mb-6 mt-2 text-stone-500">Pick something delicious from a local kitchen.</p>
        <Link className="btn-primary px-7 py-3" to="/">Browse restaurants</Link>
      </div>
    );
  }
  return (
    <>
      <PageTitle sub={`From ${cart.sourceName}`}>Your cart</PageTitle>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-3">
          {cart.lines.map((l) => (
            <li key={l.key} className="flex flex-col gap-3 rounded-3xl border border-stone-200/70 bg-white p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                {l.imageUrl && <img src={l.imageUrl} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-full object-cover" />}
                <div className="min-w-0">
                  <p className="font-semibold">{l.name}</p>
                  <p className="text-xs text-stone-500">{[l.variantName, ...l.addonNames, l.notes].filter(Boolean).join(' · ')}</p>
                  <p className="text-sm text-stone-600">{money(l.unitPrice)} each</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-brand-light p-1">
                  <button className="h-9 w-9 rounded-full bg-white text-lg leading-none text-brand shadow-sm" aria-label={`Decrease ${l.name}`} onClick={() => cart.setQuantity(l.key, l.quantity - 1)}>−</button>
                  <span className="w-7 text-center font-semibold">{l.quantity}</span>
                  <button className="h-9 w-9 rounded-full bg-brand text-lg leading-none text-white shadow-sm" aria-label={`Increase ${l.name}`} onClick={() => cart.setQuantity(l.key, l.quantity + 1)}>+</button>
                </div>
                <button className="ml-auto inline-flex min-h-[44px] items-center px-2 text-sm text-stone-500 underline hover:text-red-600" onClick={() => cart.remove(l.key)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-3 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-semibold">Order summary</h2>
          <p className="flex items-baseline justify-between text-lg font-bold"><span>Subtotal</span><span>{money(cart.subtotal)}</span></p>
          <button className="btn-primary w-full py-3" onClick={() => navigate(user ? '/checkout' : '/login', { state: { from: '/checkout' } })}>
            {user ? 'Checkout' : 'Log in to checkout'}
          </button>
          <p className="text-xs text-stone-500">Delivery, taxes and fees are calculated at checkout. Final prices are always confirmed by the server.</p>
        </aside>
      </div>
    </>
  );
}

export function CheckoutPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [addr, setAddr] = useState({ street: '', area: '', city: 'Bhatkal', pincode: '', instructions: '' });
  const [payment, setPayment] = useState<CreateOrderRequest['paymentMethod']>('UPI');
  const [tip, setTip] = useState(0);
  const [code, setCode] = useState('');
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const grocery = cart.lines[0]?.restaurantId === null;
  const coupons = useQuery({ queryKey: ['coupons'], queryFn: () => api<Coupon[]>('/coupons') });
  const bill = useMemo(() => estimateBill(cart.subtotal, grocery, tip, applied?.discount ?? 0), [cart.subtotal, grocery, tip, applied]);

  async function applyCoupon(c: string) {
    setCouponError(null);
    try {
      const v = await api<{ code: string; discount: number }>('/coupons/validate', { method: 'POST', body: { code: c, subtotal: cart.subtotal } });
      setApplied({ code: v.code, discount: Number(v.discount) });
      setCode(v.code);
    } catch (e) {
      setApplied(null);
      setCouponError(e instanceof Error ? e.message : 'Invalid coupon');
    }
  }

  const place = useMutation({
    mutationFn: () =>
      api<Order>('/orders', {
        method: 'POST',
        body: {
          items: cart.lines.map((l) => ({ productId: l.productId, quantity: l.quantity, variantId: l.variantId, addonIds: l.addonIds, notes: l.notes })),
          address: { street: addr.street, area: addr.area || undefined, city: addr.city, pincode: addr.pincode || undefined, instructions: addr.instructions || undefined },
          paymentMethod: payment,
          couponCode: applied?.code,
          tip,
        } satisfies CreateOrderRequest,
      }),
    onSuccess: (order) => {
      cart.clear();
      navigate(`/orders/${order.id}`, { replace: true });
    },
  });

  if (cart.lines.length === 0) return <p className="py-10 text-center text-stone-500">Your cart is empty. <Link className="text-brand underline" to="/">Browse restaurants</Link></p>;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    place.mutate();
  };

  return (
    <div className="pb-20 md:pb-0">
      <PageTitle sub={`From ${cart.sourceName}`}>Checkout</PageTitle>
      <form id="checkout-form" onSubmit={submit} className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <section className="card space-y-3">
            <h2 className="font-display text-xl font-semibold">Delivery address</h2>
            <Field label="Street / building"><input className="input" required value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Area"><input className="input" value={addr.area} onChange={(e) => setAddr({ ...addr, area: e.target.value })} /></Field>
              <Field label="City"><input className="input" required value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} /></Field>
              <Field label="Pincode"><input className="input" inputMode="numeric" pattern="[0-9]{6}" title="6 digits" value={addr.pincode} onChange={(e) => setAddr({ ...addr, pincode: e.target.value })} /></Field>
            </div>
            <Field label="Delivery instructions"><input className="input" value={addr.instructions} onChange={(e) => setAddr({ ...addr, instructions: e.target.value })} /></Field>
          </section>

          <section className="card space-y-3">
            <h2 className="font-display text-xl font-semibold">Coupon</h2>
            <div className="flex gap-2">
              <input className="input" placeholder="Enter code" aria-label="Coupon code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
              <button type="button" className="btn-outline" onClick={() => code && applyCoupon(code)}>Apply</button>
            </div>
            {couponError && <p role="alert" className="text-sm text-red-600">{couponError}</p>}
            {applied && <p className="text-sm text-green-700">{applied.code} applied, you save {money(applied.discount)}</p>}
            <div className="flex flex-wrap gap-2">
              {coupons.data?.map((c) => (
                <button type="button" key={c.code} className="inline-flex min-h-[40px] items-center rounded-full border border-dashed border-brand bg-brand-light/50 px-3 text-xs font-semibold text-brand-dark" onClick={() => applyCoupon(c.code)} title={c.description}>
                  {c.code}
                </button>
              ))}
            </div>
          </section>

          <section className="card grid gap-3 sm:grid-cols-2">
            <Field label="Payment method">
              <select className="input" value={payment} onChange={(e) => setPayment(e.target.value as CreateOrderRequest['paymentMethod'])}>
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="NETBANKING">Net banking</option>
              </select>
            </Field>
            <Field label="Tip for rider">
              <select className="input" value={tip} onChange={(e) => setTip(Number(e.target.value))}>
                {[0, 10, 20, 30, 50].map((t) => <option key={t} value={t}>{t === 0 ? 'No tip' : money(t)}</option>)}
              </select>
            </Field>
          </section>
        </div>

        <aside className="card h-fit space-y-1 text-sm md:sticky md:top-24">
          <h2 className="mb-2 font-display text-xl font-semibold">Bill (estimate)</h2>
          <Row l="Items" v={bill.subtotal} />
          {bill.packagingFee > 0 && <Row l="Packaging" v={bill.packagingFee} />}
          <Row l="Delivery" v={bill.deliveryFee} free />
          <Row l="Platform fee" v={bill.platformFee} />
          <Row l="GST (5%)" v={bill.tax} />
          {bill.tip > 0 && <Row l="Rider tip" v={bill.tip} />}
          {bill.discount > 0 && <Row l="Discount" v={-bill.discount} />}
          <div className="mt-3 flex items-baseline justify-between border-t border-stone-200 pt-3 text-xl font-bold text-brand"><span>Total</span><span>{money(bill.total)}</span></div>
          <p className="pt-1 text-xs text-stone-500">The server confirms the exact amount when you place the order.</p>
          {place.error ? <ErrorBox error={place.error} /> : null}
          <button className="btn-primary mt-2 hidden w-full md:inline-flex" disabled={place.isPending}>{place.isPending ? 'Placing order…' : 'Place order'}</button>
        </aside>
      </form>

      {/* Phones: the total and the main action stay reachable while scrolling the long form. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-stone-200 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
        <div className="min-w-0">
          <p className="text-xs text-stone-500">Total (estimate)</p>
          <p className="text-lg font-bold leading-tight">{money(bill.total)}</p>
        </div>
        <button type="submit" form="checkout-form" className="btn-primary ml-auto flex-1" disabled={place.isPending}>
          {place.isPending ? 'Placing…' : `Place order · ${money(bill.total)}`}
        </button>
      </div>
    </div>
  );
}

function Row({ l, v, free }: { l: string; v: number; free?: boolean }) {
  return <div className="flex justify-between"><span>{l}</span><span>{free && v === 0 ? 'FREE' : money(v)}</span></div>;
}
