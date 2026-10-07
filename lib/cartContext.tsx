'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartPricing, Coupon, Address, Role, User } from '@/types';

interface LoginResult {
  success: boolean;
  message: string;
  role?: Role;
}

interface RegisterResult {
  success: boolean;
  message: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  tip: number;
  setTip: (amount: number) => void;
  selectedAddress: Address;
  setSelectedAddress: (addr: Address) => void;
  pricing: CartPricing;
  currentRole: Role;
  currentUser: User;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<RegisterResult>;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const DEFAULT_ADDRESS: Address = {
  id: 'addr-default',
  userId: 'user-customer-1',
  label: 'Home',
  fullName: 'Anas Ahmed',
  phone: '+91 98765 43210',
  addressLine1: 'Flat 302, Green Meadows, Near Shams Mosque',
  area: 'Bhatkal Central',
  city: 'Bhatkal',
  state: 'Karnataka',
  postalCode: '581320',
  latitude: 13.9870,
  longitude: 74.5610,
  deliveryInstructions: 'Please leave packet with security if doorbell not answered.',
  isDefault: true,
};

// Default guest user shown before auth state is loaded
const GUEST_USER: User = {
  id: '',
  name: 'Guest',
  email: '',
  phone: '',
  role: 'CUSTOMER',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [tip, setTip] = useState<number>(20);
  const [selectedAddress, setSelectedAddress] = useState<Address>(DEFAULT_ADDRESS);
  const [currentRole, setCurrentRole] = useState<Role>('CUSTOMER');
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // On mount: restore session from cookies + localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zestora_cart');
      if (saved) setItems(JSON.parse(saved));

      // Read session cookies set by server
      const cookieRole = document.cookie
        .split('; ')
        .find((r) => r.startsWith('zestora_role='))
        ?.split('=')[1] as Role | undefined;

      // The signed session token is httpOnly (unreadable by scripts). The role cookie is only a UI hint;
      // the server re-verifies the real session on every request and via /api/auth/me below.
      if (cookieRole) {
        // Try to restore user from localStorage cache
        const cachedUser = localStorage.getItem('zestora_user');
        if (cachedUser) {
          const parsedUser: User = JSON.parse(cachedUser);
          // SECURITY: use role from cookie (set by server), not from localStorage
          setCurrentUser({ ...parsedUser, role: cookieRole });
          setCurrentRole(cookieRole);
          setIsAuthenticated(true);
        } else {
          fetch('/api/auth/me')
            .then((r) => r.json())
            .then((d) => {
              if (d.authenticated && d.user) {
                setCurrentUser(d.user);
                setCurrentRole(d.user.role);
                setIsAuthenticated(true);
              }
            })
            .catch(() => {});
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist cart
  useEffect(() => {
    try {
      localStorage.setItem('zestora_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  /**
   * LOGIN — sends credentials to server, role is returned from server response.
   * Never trusts a role from client code.
   */
  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Role is sourced from the server response — never from client input
        const serverRole: Role = data.role || data.user.role;
        setCurrentUser({ ...data.user, role: serverRole });
        setCurrentRole(serverRole);
        setIsAuthenticated(true);
        localStorage.setItem('zestora_user', JSON.stringify({ ...data.user, role: serverRole }));
        return { success: true, message: data.message, role: serverRole };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error during login' };
    }
  };

  /**
   * REGISTER — always creates a CUSTOMER account.
   * Role is hardcoded on server — client cannot influence it.
   */
  const register = async (
    name: string,
    email: string,
    phone: string,
    password: string
  ): Promise<RegisterResult> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        // Always CUSTOMER — trust server response
        const newUser: User = { ...data.user, role: 'CUSTOMER' as Role };
        setCurrentUser(newUser);
        setCurrentRole('CUSTOMER');
        setIsAuthenticated(true);
        localStorage.setItem('zestora_user', JSON.stringify(newUser));
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error during registration' };
    }
  };

  /**
   * LOGOUT — clears all session data.
   */
  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    // Clear cookies
    if (typeof document !== 'undefined') {
      document.cookie = 'zestora_role=; path=/; max-age=0;';
      document.cookie = 'zestora_token=; path=/; max-age=0;';
    }

    // Clear localStorage
    localStorage.removeItem('zestora_role');
    localStorage.removeItem('zestora_user');
    localStorage.removeItem('zestora_cart');

    // Reset state
    setIsAuthenticated(false);
    setCurrentUser(GUEST_USER);
    setCurrentRole('CUSTOMER');
    setItems([]);
    setAppliedCoupon(null);
  };

  // ── Cart operations ────────────────────────────────────────────────────────

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (i) =>
          i.id === newItem.id &&
          i.selectedVariant?.name === newItem.selectedVariant?.name &&
          JSON.stringify(i.selectedAddons) === JSON.stringify(newItem.selectedAddons)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...prev, newItem];
    });
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/v1/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: pricing.subtotal }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        setAppliedCoupon(data.coupon);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Invalid coupon' };
    } catch {
      // Fallback local validation
      const codeUpper = code.toUpperCase().trim();
      if (codeUpper === 'ZEST50' && pricing.subtotal >= 299) {
        const c: Coupon = {
          id: 'coup-1',
          code: 'ZEST50',
          type: 'PERCENTAGE',
          discountValue: 50,
          minimumOrder: 299,
          maxDiscount: 100,
          description: '50% OFF up to ₹100',
          isActive: true,
        };
        setAppliedCoupon(c);
        return { success: true, message: 'Coupon ZEST50 applied!' };
      } else if (codeUpper === 'FREEDEL') {
        const c: Coupon = {
          id: 'coup-2',
          code: 'FREEDEL',
          type: 'FREE_DELIVERY',
          discountValue: 100,
          minimumOrder: 199,
          maxDiscount: 35,
          description: 'Free delivery applied',
          isActive: true,
        };
        setAppliedCoupon(c);
        return { success: true, message: 'Free delivery coupon applied!' };
      }
      return { success: false, message: 'Invalid or expired coupon' };
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // ── Pricing calculation ────────────────────────────────────────────────────

  const subtotal = items.reduce((sum, item) => {
    let itemPrice = item.unitPrice;
    if (item.selectedVariant) itemPrice = item.selectedVariant.price;
    const addonsCost = (item.selectedAddons || []).reduce((aSum, a) => aSum + a.price, 0);
    return sum + (itemPrice + addonsCost) * item.quantity;
  }, 0);

  const hasGrocery = items.some((i) => i.type === 'GROCERY');
  const packagingFee = items.length > 0 ? (hasGrocery ? 10 : 20) : 0;
  let deliveryFee = items.length > 0 ? 30 : 0;
  if (subtotal >= 499) deliveryFee = 0;
  const platformFee = items.length > 0 ? 5 : 0;
  const taxes = Math.round(subtotal * 0.05);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'PERCENTAGE') {
      discount = Math.min(
        (subtotal * appliedCoupon.discountValue) / 100,
        appliedCoupon.maxDiscount || 100
      );
    } else if (appliedCoupon.type === 'FIXED_AMOUNT') {
      discount = Math.min(appliedCoupon.discountValue, subtotal);
    } else if (appliedCoupon.type === 'FREE_DELIVERY') {
      discount = deliveryFee;
    }
  }

  const total = Math.max(0, subtotal + packagingFee + deliveryFee + platformFee + taxes + tip - discount);

  const pricing: CartPricing = {
    subtotal,
    packagingFee,
    deliveryFee,
    platformFee,
    taxes,
    discount,
    tip,
    total,
    appliedCoupon,
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        tip,
        setTip,
        selectedAddress,
        setSelectedAddress,
        pricing,
        currentRole,
        currentUser,
        isAuthenticated,
        login,
        logout,
        register,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
