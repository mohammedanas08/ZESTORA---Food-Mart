import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { CartProvider, useCart, type CartLine } from './CartContext';

const wrapper = ({ children }: { children: ReactNode }) => <CartProvider>{children}</CartProvider>;
const line = (over: Partial<Omit<CartLine, 'key'>> = {}): Omit<CartLine, 'key'> => ({
  productId: 1, name: 'Biryani', unitPrice: 100, quantity: 1, addonIds: [], addonNames: [], restaurantId: 10, sourceName: 'Spice Garden', ...over,
});

describe('cart', () => {
  it('adds lines, merges identical ones and totals them', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(line()); });
    act(() => { result.current.add(line()); });
    act(() => { result.current.add(line({ productId: 2, name: 'Naan', unitPrice: 30 })); });
    expect(result.current.lines).toHaveLength(2);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(230);
  });

  it('treats different variants / add-ons as separate lines', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(line({ variantId: 1 })); });
    act(() => { result.current.add(line({ variantId: 2 })); });
    act(() => { result.current.add(line({ variantId: 2, addonIds: [5] })); });
    expect(result.current.lines).toHaveLength(3);
  });

  it('refuses items from another restaurant until the user replaces the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(line()); });
    let r = '';
    act(() => { r = result.current.add(line({ productId: 9, restaurantId: 11, sourceName: 'Pizza Street' })); });
    expect(r).toBe('conflict');
    expect(result.current.lines).toHaveLength(1);
    act(() => { result.current.replaceWith(line({ productId: 9, restaurantId: 11, sourceName: 'Pizza Street' })); });
    expect(result.current.sourceName).toBe('Pizza Street');
    expect(result.current.lines).toHaveLength(1);
  });

  it('does not mix grocery (restaurantId null) with restaurant food', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(line({ restaurantId: null, sourceName: 'QuickMart' })); });
    let r = '';
    act(() => { r = result.current.add(line()); });
    expect(r).toBe('conflict');
  });

  it('removes a line when quantity drops to zero and caps at 50', () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => { result.current.add(line()); });
    const key = result.current.lines[0].key;
    act(() => { result.current.setQuantity(key, 999); });
    expect(result.current.lines[0].quantity).toBe(50);
    act(() => { result.current.setQuantity(key, 0); });
    expect(result.current.lines).toHaveLength(0);
  });

  it('persists to localStorage and restores', () => {
    const first = renderHook(() => useCart(), { wrapper });
    act(() => { first.result.current.add(line()); });
    first.unmount();
    const second = renderHook(() => useCart(), { wrapper });
    expect(second.result.current.count).toBe(1);
  });
});
