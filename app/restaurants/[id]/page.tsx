'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Star,
  Clock,
  Bike,
  ShieldCheck,
  Tag,
  Plus,
  ArrowLeft,
  Flame,
  ShoppingBag,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { SEED_RESTAURANTS } from '@/server/seedData';
import { MenuItem, Restaurant } from '@/types';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';
import FoodCustomizationModal from '@/components/FoodCustomizationModal';

export default function RestaurantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { addItem, items, setIsCartDrawerOpen, pricing } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  const restaurant: Restaurant | undefined = SEED_RESTAURANTS.find(
    (r) => r.slug === params.id || r.id === params.id
  );

  if (!restaurant) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center">
        <h2 className="text-2xl font-black text-slate-900">Restaurant Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          The requested eatery could not be located in Bhatkal.
        </p>
        <Link
          href="/restaurants"
          className="mt-4 inline-block px-5 py-2.5 rounded-2xl bg-brand-500 text-white font-bold text-xs"
        >
          Browse All Restaurants
        </Link>
      </div>
    );
  }

  const menuCategories = restaurant.menuCategories || [];
  const currentCartCount = items
    .filter((i) => i.restaurantId === restaurant.id)
    .reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* RESTAURANT HERO BANNER */}
      <div className="relative h-64 sm:h-80 w-full bg-slate-950">
        <img
          src={restaurant.coverImage}
          alt={restaurant.name}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-8">
          <Link
            href="/restaurants"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/50 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>All Restaurants</span>
          </Link>
        </div>

        {/* Restaurant Header Info Card */}
        <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 text-white max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-white/80 object-cover shadow-xl bg-white"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black">{restaurant.name}</h1>
                  <span className="p-1 rounded-full bg-emerald-500 text-white" title="FSSAI & Zestora Verified">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{restaurant.cuisine}</p>
                <div className="text-xs text-slate-300 flex items-center gap-2 mt-1">
                  <span>{restaurant.addressLine}, {restaurant.area}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Open Now</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs">
              <div className="text-center pr-3 border-r border-white/20">
                <div className="flex items-center justify-center gap-1 font-extrabold text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{restaurant.rating}</span>
                </div>
                <div className="text-[10px] text-slate-300">{restaurant.ratingCount}+ ratings</div>
              </div>

              <div className="text-center pr-3 border-r border-white/20">
                <div className="font-extrabold text-white">
                  {restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax}m
                </div>
                <div className="text-[10px] text-slate-300">Delivery Time</div>
              </div>

              <div className="text-center">
                <div className="font-extrabold text-white">₹{restaurant.deliveryFee}</div>
                <div className="text-[10px] text-slate-300">Delivery Fee</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OFFERS & DISCOUNTS TICKER */}
      <div className="bg-amber-50 border-y border-amber-200/70 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4 text-xs font-medium text-amber-900 overflow-x-auto">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-brand-600 whitespace-nowrap">
            <Tag className="w-4 h-4" />
            <span>Available Deals:</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-white px-3 py-1 rounded-xl border border-amber-200 whitespace-nowrap">
              🎉 <strong>ZEST50</strong>: 50% OFF up to ₹100 on min ₹299
            </span>
            <span className="bg-white px-3 py-1 rounded-xl border border-amber-200 whitespace-nowrap">
              🚀 <strong>FREEDEL</strong>: Free delivery on orders above ₹199
            </span>
            <span className="bg-white px-3 py-1 rounded-xl border border-amber-200 whitespace-nowrap">
              🔥 20% Direct Discount applied at checkout
            </span>
          </div>
        </div>
      </div>

      {/* MENU SECTION */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Menu Categories Navigation (Sticky Sidebar) */}
          <div className="lg:col-span-3">
            <div className="sticky top-24 bg-white rounded-3xl p-4 border border-slate-100 shadow-card space-y-1">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-2">
                Menu Categories
              </div>
              {menuCategories.map((cat, idx) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-between ${
                    activeCategory === cat.id || (!activeCategory && idx === 0)
                      ? 'bg-brand-500 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      activeCategory === cat.id || (!activeCategory && idx === 0)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items List */}
          <div className="lg:col-span-9 space-y-10">
            {menuCategories.map((cat) => (
              <div key={cat.id} id={cat.id} className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <h2 className="text-xl font-black text-slate-900">{cat.name}</h2>
                  <span className="text-xs text-slate-400">({cat.items.length} dishes)</span>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6"
                    >
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
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
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {item.isVeg ? 'Veg' : 'Non-Veg'}
                          </span>
                          {item.spiceLevel && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-amber-500" /> {item.spiceLevel}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-black text-slate-900">{item.name}</h3>

                        <div className="text-sm font-extrabold text-slate-900">
                          ₹{item.price}
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                          {item.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Prep: {item.preparationTime}m
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-amber-500 font-semibold">
                            <Star className="w-3 h-3 fill-amber-400" /> {item.rating}
                          </span>
                          {(item.variants || item.addons) && (
                            <>
                              <span>•</span>
                              <span className="text-brand-600 font-bold">Customizable</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Image & Add Button */}
                      <div className="relative w-full sm:w-32 flex-shrink-0 flex sm:flex-col items-center justify-between sm:justify-center">
                        <div className="w-28 h-24 sm:w-32 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shadow-sm">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>

                        <button
                          onClick={() => {
                            if (item.variants || item.addons) {
                              setCustomizingItem(item);
                            } else {
                              addItem({
                                id: item.id,
                                type: 'FOOD',
                                menuItemId: item.id,
                                name: item.name,
                                restaurantId: restaurant.id,
                                restaurantName: restaurant.name,
                                unitPrice: item.price,
                                quantity: 1,
                                image: item.image,
                                isVeg: item.isVeg,
                              });
                            }
                          }}
                          className="sm:-mt-4 px-5 py-2 rounded-xl bg-white hover:bg-brand-50 border-2 border-brand-500 text-brand-600 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>ADD</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING CART BAR ON MOBILE / QUICK ACCESS */}
      {currentCartCount > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-40">
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="w-full p-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-float flex items-center justify-between transition-transform active:scale-98 animate-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center font-black text-xs">
                {currentCartCount}
              </div>
              <div>
                <div>{currentCartCount} {currentCartCount === 1 ? 'item' : 'items'} added</div>
                <div className="text-xs text-white/80 font-normal">From {restaurant.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span>View Cart &rarr;</span>
            </div>
          </button>
        </div>
      )}

      {/* Food Customization Modal */}
      {customizingItem && (
        <FoodCustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={customizingItem}
          restaurantName={restaurant.name}
        />
      )}
    </div>
  );
}
