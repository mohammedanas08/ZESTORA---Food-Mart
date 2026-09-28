'use client';

import React from 'react';
import Link from 'next/link';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';

export default function CartDrawer() {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeItem,
    clearCart,
    pricing,
  } = useCart();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Basket</h3>
                <p className="text-xs text-slate-500">
                  {items.length} {items.length === 1 ? 'item' : 'items'} selected
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cart items list */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-20 h-20 rounded-3xl bg-brand-50 text-brand-400 flex items-center justify-center">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Your basket is empty</h4>
                <p className="text-sm text-slate-400 max-w-xs">
                  Discover local delicacies or order groceries in 10-20 minutes!
                </p>
                <button
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="mt-2 px-5 py-2.5 rounded-2xl bg-brand-500 text-white font-semibold text-sm shadow-sm hover:bg-brand-600 transition"
                >
                  Explore Delicious Food
                </button>
              </div>
            ) : (
              items.map((item) => {
                const itemTotal = (item.selectedVariant ? item.selectedVariant.price : item.unitPrice) * item.quantity;
                return (
                  <div
                    key={`${item.id}-${item.selectedVariant?.name || ''}`}
                    className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {item.type === 'FOOD' && (
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              item.isVeg ? 'border-emerald-600' : 'border-red-600'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isVeg ? 'bg-emerald-600' : 'bg-red-600'
                              }`}
                            />
                          </span>
                        )}
                        <h5 className="font-bold text-sm text-slate-800 leading-tight">
                          {item.name}
                        </h5>
                      </div>

                      {item.selectedVariant && (
                        <div className="text-xs text-brand-600 font-medium mt-0.5">
                          Portion: {item.selectedVariant.name}
                        </div>
                      )}

                      {item.selectedAddons && item.selectedAddons.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Addons: {item.selectedAddons.map((a) => a.name).join(', ')}
                        </div>
                      )}

                      {item.instructions && (
                        <div className="text-[11px] text-slate-400 italic mt-0.5">
                          Note: "{item.instructions}"
                        </div>
                      )}

                      <div className="text-xs font-bold text-slate-900 mt-2">
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="font-bold text-xs text-slate-800 w-4 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bill summary & checkout button */}
          {items.length > 0 && (
            <div className="p-5 border-t border-slate-100 bg-white space-y-4">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Item Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(pricing.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Packaging Charges</span>
                  <span>{formatCurrency(pricing.packagingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Partner Fee</span>
                  <span className={pricing.deliveryFee === 0 ? 'text-emerald-600 font-semibold' : ''}>
                    {pricing.deliveryFee === 0 ? 'FREE' : formatCurrency(pricing.deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(pricing.platformFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Government GST & Taxes</span>
                  <span>{formatCurrency(pricing.taxes)}</span>
                </div>
                {pricing.discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>- {formatCurrency(pricing.discount)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-sm font-bold text-slate-900">
                  <span>To Pay</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>100% Secure contactless delivery guaranteed</span>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm flex items-center justify-between shadow-elevated transition-transform active:scale-98"
              >
                <span>Proceed to Checkout</span>
                <div className="flex items-center gap-2">
                  <span>{formatCurrency(pricing.total)}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
