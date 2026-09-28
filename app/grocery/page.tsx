'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Zap,
  Clock,
  Search,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { SEED_PRODUCTS, SEED_GROCERY_STORE } from '@/server/seedData';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';
import { Product } from '@/types';

export default function GroceryPage() {
  const { addItem, items, updateQuantity, setIsCartDrawerOpen, pricing } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    'All',
    'Dairy & Eggs',
    'Bakery & Bread',
    'Fruits & Vegetables',
    'Snacks & Munchies',
    'Beverages & Juices',
    'Staples & Cooking Oils',
  ];

  const filteredProducts = SEED_PRODUCTS.filter((product) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      product.categoryName.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch =
      !searchTerm.trim() ||
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getItemQuantityInCart = (productId: string) => {
    const cartItem = items.find((i) => i.productId === productId);
    return cartItem ? cartItem.quantity : 0;
  };

  const groceryItemCount = items
    .filter((i) => i.type === 'GROCERY')
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {/* QUICK COMMERCE MART BANNER */}
      <section className="bg-emerald-900 text-white py-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-700/30 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                <span>10–20 Minute Instant Quick Commerce</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                {SEED_GROCERY_STORE.name}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-300" />
                <span>Deliveries dispatched instantly from Central Hub, Bhatkal</span>
              </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-emerald-700" />
              <input
                type="text"
                placeholder="Search milk, bread, snacks, cooking oil..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400 shadow-md"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES NAVIGATION BAR */}
      <div className="sticky top-20 z-20 bg-white border-b border-slate-200 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900">
              {selectedCategory === 'All' ? 'All Daily Essentials' : selectedCategory}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredProducts.length} items in stock for instant dispatch
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {filteredProducts.map((product) => {
            const qty = getItemQuantityInCart(product.id);
            const availableStock = product.stock - product.reserved;

            return (
              <div
                key={product.id}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-card hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden bg-slate-100 mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg">
                      {product.unit}
                    </span>
                    {availableStock <= 10 && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-md">
                        Only {availableStock} left
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                    {product.brand || product.categoryName}
                  </div>
                  <h3 className="font-bold text-xs text-slate-800 line-clamp-2 mt-0.5 leading-snug">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-slate-900">
                      {formatCurrency(product.price)}
                    </div>
                    {product.mrp > product.price && (
                      <div className="text-[10px] text-slate-400 line-through">
                        {formatCurrency(product.mrp)}
                      </div>
                    )}
                  </div>

                  {qty === 0 ? (
                    <button
                      onClick={() => {
                        addItem({
                          id: product.id,
                          type: 'GROCERY',
                          productId: product.id,
                          name: product.name,
                          storeId: product.storeId,
                          unitPrice: product.price,
                          quantity: 1,
                          image: product.image,
                        });
                      }}
                      className="px-4 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-500 text-emerald-700 font-extrabold text-xs flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>ADD</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-emerald-600 text-white rounded-xl px-2 py-1 shadow-sm">
                      <button
                        onClick={() => updateQuantity(product.id, qty - 1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-emerald-700 rounded-lg text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs w-4 text-center">{qty}</span>
                      <button
                        onClick={() => updateQuantity(product.id, qty + 1)}
                        className="w-5 h-5 flex items-center justify-center hover:bg-emerald-700 rounded-lg text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FLOATING QUICK BASKET BAR */}
      {groceryItemCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-float flex items-center justify-between transition-transform active:scale-98 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-800 flex items-center justify-center font-black text-xs">
                {groceryItemCount}
              </div>
              <div>
                <div>{groceryItemCount} {groceryItemCount === 1 ? 'grocery item' : 'grocery items'} in cart</div>
                <div className="text-xs text-emerald-200 font-normal">Arriving in 10-20 min</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>Checkout &rarr;</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
