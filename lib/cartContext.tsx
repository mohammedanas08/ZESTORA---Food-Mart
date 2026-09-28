'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, CartPricing, Coupon, Address, Role, User } from '@/types';
import { SEED_USERS } from '@/server/seedData';

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
  switchRole: (role: Role) => void;
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

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [tip, setTip] = useState<number>(20);
  const [selectedAddress, setSelectedAddress] = useState<Address>(DEFAULT_ADDRESS);
  const [currentRole, setCurrentRole] = useState<Role>('CUSTOMER');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);

  // Load cart from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem('zestora_cart');
      if (saved) setItems(JSON.parse(saved));
      const savedRole = localStorage.getItem('zestora_role') as Role;
      if (savedRole) setCurrentRole(savedRole);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('zestora_cart', JSON.stringify(items));
    } catch {}
  }, [items]);

  const switchRole = (role: Role) => {
    setCurrentRole(role);
    try {
      localStorage.setItem('zestora_role', role);
    } catch {}
  };

  const currentUser = SEED_USERS.find((u) => u.role === currentRole) || SEED_USERS[0];

  const addItem = (newItem: CartItem) => {
    setItems((prev) => {
      // Check if exact same item with same variant/addons exists
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
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity } : i))
    );
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
    } catch (e) {
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

  // Pricing calculation
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
      discount = Math.min((subtotal * appliedCoupon.discountValue) / 100, appliedCoupon.maxDiscount || 100);
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
        switchRole,
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
