'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Utensils,
  Zap,
  Star,
  Clock,
  Bike,
  Sparkles,
  ArrowRight,
  Plus,
  Tag,
  Percent,
  Compass,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { SEED_RESTAURANTS, SEED_PRODUCTS, SEED_COUPONS } from '@/server/seedData';
import { formatCurrency } from '@/lib/utils';
import FoodCustomizationModal from '@/components/FoodCustomizationModal';
import { MenuItem } from '@/types';

export default function HomePage() {
  const { addItem, selectedAddress, applyCoupon } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customizingItem, setCustomizingItem] = useState<{ item: MenuItem; restName: string } | null>(null);
  const [couponCopied, setCouponCopied] = useState<string | null>(null);

  const categories = [
    { name: 'All', icon: '✨' },
    { name: 'Biryani', icon: '🍗' },
    { name: 'Coastal Seafood', icon: '🐟' },
    { name: 'Pizza', icon: '🍕' },
    { name: 'Burgers', icon: '🍔' },
    { name: 'North Indian', icon: '🥘' },
    { name: 'Chinese', icon: '🍜' },
    { name: 'Desserts & Shakes', icon: '🧁' },
  ];

  const filteredRestaurants = SEED_RESTAURANTS.filter((r) => {
    if (selectedCategory === 'All') return true;
    return (
      r.cuisine.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      r.name.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  const handleCopyCoupon = (code: string) => {
    applyCoupon(code);
    setCouponCopied(code);
    setTimeout(() => setCouponCopied(null), 3000);
  };

  return (
    <div className="min-h-screen pb-20">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-500/10 via-brand-500/5 to-transparent pt-8 pb-14 sm:pb-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-700 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                <span>Now Serving Across Bhatkal & Coastal Karnataka</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Delicious food. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-500">
                  Fast delivery.
                </span>{' '}
                <br />
                One Zestora.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Craving tender heritage dum biryani, fresh Arabian sea catch, or daily groceries in 10-20 minutes? Zestora brings the best of Bhatkal right to your doorstep.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/restaurants"
                  className="px-6 py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-elevated transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Utensils className="w-4 h-4" />
                  Order Food Now
                </Link>

                <Link
                  href="/grocery"
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-transform active:scale-95 flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Shop Groceries (10-20m)
                </Link>

                <Link
                  href="/restaurant-dashboard"
                  className="px-5 py-3.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm transition"
                >
                  Partner Portals &rarr;
                </Link>
              </div>

              {/* Badges / Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200/80 max-w-lg">
                <div>
                  <div className="text-xl font-extrabold text-slate-900">10–25 min</div>
                  <div className="text-xs text-slate-500">Superfast Delivery</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-900">4.8 ★</div>
                  <div className="text-xs text-slate-500">Average Kitchen Rating</div>
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-900">₹0 Fee</div>
                  <div className="text-xs text-slate-500">On Orders Over ₹499</div>
                </div>
              </div>
            </div>

            {/* Visual banner preview */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop&q=80"
                  alt="Special Bhatkali Dum Biryani"
                  className="w-full h-80 object-cover opacity-90 hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Floating promo card */}
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-900">Bhatkal Central Hub</div>
                    <div className="text-[10px] text-slate-500">Live Riders Active</div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>Top Rated This Week</span>
                  </div>
                  <h3 className="text-lg font-black">Spice Garden Special Biryani</h3>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-white">From ₹240</span>
                    <Link
                      href="/restaurants/spice-garden-bhatkal"
                      className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs"
                    >
                      View Menu
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUICK COMMERCE 10-20 MINUTE HIGHLIGHT SECTION */}
      <section className="py-12 bg-emerald-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                Quick Commerce
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                Zestora QuickMart — Delivered in 10–20 Mins
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200">
                Fresh milk, bread, eggs, crisp vegetables, snacks, and daily essentials.
              </p>
            </div>

            <Link
              href="/grocery"
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <span>Explore All Mart Items</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Product cards horizontal carousel */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SEED_PRODUCTS.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="bg-emerald-950/70 border border-emerald-800/80 rounded-2xl p-3 flex flex-col justify-between hover:border-emerald-500 transition group"
              >
                <div>
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-emerald-900 mb-2.5">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/60 backdrop-blur-xs px-1.5 py-0.5 rounded text-white">
                      {product.unit}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-white line-clamp-2 leading-snug">
                    {product.name}
                  </h4>
                  <div className="text-[10px] text-emerald-300 mt-0.5">{product.brand}</div>
                </div>

                <div className="pt-3 mt-2 border-t border-emerald-800/60 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-white">{formatCurrency(product.price)}</div>
                    {product.mrp > product.price && (
                      <div className="text-[10px] text-emerald-400 line-through">
                        {formatCurrency(product.mrp)}
                      </div>
                    )}
                  </div>
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
                    className="w-7 h-7 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center font-bold shadow-xs active:scale-95 transition"
                    title="Add to basket"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO COUPONS BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 z-10 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SEED_COUPONS.map((coupon) => (
            <div
              key={coupon.id}
              className="bg-white rounded-2xl p-4 shadow-lg border border-amber-100 flex items-center justify-between gap-3 group hover:border-amber-400 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold border border-amber-200">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-slate-900 tracking-wide">
                    {coupon.code}
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-1">{coupon.description}</div>
                </div>
              </div>

              <button
                onClick={() => handleCopyCoupon(coupon.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                  couponCopied === coupon.code
                    ? 'bg-emerald-500 text-white'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-800'
                }`}
              >
                {couponCopied === coupon.code ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Applied
                  </>
                ) : (
                  'Apply'
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FOOD CATEGORIES CHIPS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Inspiration for your first order
            </h2>
            <p className="text-xs text-slate-500 mt-1">Explore authentic cuisines crafted by top local chefs</p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-elevated scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* RESTAURANT CARDS GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Top Restaurants in {selectedAddress.area || 'Bhatkal'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Showing {filteredRestaurants.length} verified dining and takeaway partners
            </p>
          </div>
          <Link
            href="/restaurants"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            See All &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.slug}`}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                {/* Cover with badge */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Rating badge */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-slate-900">{restaurant.rating}</span>
                    <span className="text-[10px] text-slate-400">({restaurant.ratingCount})</span>
                  </div>

                  {/* Delivery time */}
                  <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-xl text-white flex items-center gap-1.5 text-xs font-semibold">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>{restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax} min</span>
                  </div>

                  {/* Offer tag */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-brand-600 to-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>20% OFF</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-black text-slate-900 group-hover:text-brand-600 transition">
                      {restaurant.name}
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Open
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{restaurant.cuisine}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5 text-slate-400" />
                      <span>₹{restaurant.deliveryFee} delivery</span>
                    </div>
                    <span>•</span>
                    <div>Min. ₹{restaurant.minimumOrder}</div>
                    <span>•</span>
                    <div className="truncate">{restaurant.area}</div>
                  </div>
                </div>
              </div>

              {/* Quick sample dish CTA */}
              <div className="px-5 pb-4">
                <div className="w-full py-2 rounded-xl bg-slate-50 group-hover:bg-brand-50 group-hover:text-brand-700 text-slate-600 font-bold text-xs text-center transition">
                  Browse Menu &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Food Customization Modal */}
      {customizingItem && (
        <FoodCustomizationModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={customizingItem.item}
          restaurantName={customizingItem.restName}
        />
      )}
    </div>
  );
}
