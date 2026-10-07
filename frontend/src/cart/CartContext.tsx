import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Cart lines hold only what the server needs (ids + quantity) plus display data.
 * Prices here are for DISPLAY; the server recomputes every price from the database when the order is placed.
 * A cart holds items from ONE source: a single restaurant, or grocery (the backend rejects mixed orders).
 */
export interface CartLine {
  key: string;
  productId: number;
  name: string;
  imageUrl?: string;
  unitPrice: number;
  quantity: number;
  variantId?: number;
  variantName?: string;
  addonIds: number[];
  addonNames: string[];
  notes?: string;
  /** Source: restaurant id, or null for grocery. */
  restaurantId: number | null;
  sourceName: string;
}

type AddResult = 'added' | 'conflict';

interface CartState {
  lines: CartLine[];
  count: number;
  subtotal: number;
  sourceName: string | null;
  add: (line: Omit<CartLine, 'key'>) => AddResult;
  /** Empty the cart, then add (used after the user confirms switching restaurant). */
  replaceWith: (line: Omit<CartLine, 'key'>) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const Ctx = createContext<CartState | null>(null);
const STORAGE_KEY = 'zestora_cart_v1';

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function lineKey(l: Omit<CartLine, 'key'>): string {
  return [l.productId, l.variantId ?? '', [...l.addonIds].sort().join('.'), l.notes ?? ''].join('|');
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable: the cart just won't persist */
    }
  }, [lines]);

  const insert = (prev: CartLine[], line: Omit<CartLine, 'key'>): CartLine[] => {
    const key = lineKey(line);
    const existing = prev.find((l) => l.key === key);
    if (existing) return prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, l.quantity + line.quantity) } : l));
    return [...prev, { ...line, key }];
  };

  const add = useCallback(
    (line: Omit<CartLine, 'key'>): AddResult => {
      if (lines.length > 0 && lines[0].restaurantId !== line.restaurantId) return 'conflict';
      setLines((prev) => insert(prev, line));
      return 'added';
    },
    [lines],
  );

  const replaceWith = useCallback((line: Omit<CartLine, 'key'>) => setLines(insert([], line)), []);
  const setQuantity = useCallback(
    (key: string, quantity: number) =>
      setLines((prev) => (quantity <= 0 ? prev.filter((l) => l.key !== key) : prev.map((l) => (l.key === key ? { ...l, quantity: Math.min(50, quantity) } : l)))),
    [],
  );
  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => l.key !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
      sourceName: lines[0]?.sourceName ?? null,
      add,
      replaceWith,
      setQuantity,
      remove,
      clear,
    }),
    [lines, add, replaceWith, setQuantity, remove, clear],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart(): CartState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCart must be used inside <CartProvider>');
  return v;
}
