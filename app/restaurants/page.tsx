'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Star,
  Clock,
  Bike,
  Filter,
  SlidersHorizontal,
  Check,
  Tag,
  ArrowLeft,
  X,
} from 'lucide-react';
import { SEED_RESTAURANTS } from '@/server/seedData';
import { Restaurant } from '@/types';

function RestaurantsInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [restaurants, setRestaurants] = useState<Restaurant[]>(SEED_RESTAURANTS);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [minRating, setMinRating] = useState<number>(0);
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [fastDeliveryOnly, setFastDeliveryOnly] = useState<boolean>(false);
  const [selectedCuisine, setSelectedCuisine] = useState<string>('All');

  const cuisinesList = [
    'All',
    'North Indian',
    'Biryani',
    'Coastal Seafood',
    'Pizza',
    'Burgers',
    'Chinese',
    'Desserts',
  ];

  useEffect(() => {
    let filtered = SEED_RESTAURANTS;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.menuCategories?.some((c) =>
            c.items.some((i) => i.name.toLowerCase().includes(q))
          )
      );
    }

    if (selectedCuisine !== 'All') {
      filtered = filtered.filter((r) =>
        r.cuisine.toLowerCase().includes(selectedCuisine.toLowerCase())
      );
    }

    if (minRating > 0) {
      filtered = filtered.filter((r) => r.rating >= minRating);
    }

    if (fastDeliveryOnly) {
      filtered = filtered.filter((r) => r.deliveryTimeMin <= 20);
    }

    if (vegOnly) {
      filtered = filtered.filter((r) =>
        r.menuCategories?.some((c) => c.items.some((i) => i.isVeg))
      );
    }

    setRestaurants(filtered);
  }, [searchTerm, selectedCuisine, minRating, fastDeliveryOnly, vegOnly]);

  const clearFilters = () => {
    setSearchTerm('');
    setMinRating(0);
    setVegOnly(false);
    setFastDeliveryOnly(false);
    setSelectedCuisine('All');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Breadcrumb & Title */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Restaurants in Bhatkal</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Discover Restaurants
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Order from authentic top-rated coastal & city kitchens
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search restaurants, biryani, burgers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pb-6 border-b border-slate-200 mb-8">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-2">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Cuisines Pill List */}
        {cuisinesList.map((cuisine) => {
          const isSelected = selectedCuisine === cuisine;
          return (
            <button
              key={cuisine}
              onClick={() => setSelectedCuisine(cuisine)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {cuisine}
            </button>
          );
        })}

        <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block" />

        {/* Rating Filter */}
        <button
          onClick={() => setMinRating(minRating === 4.5 ? 0 : 4.5)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            minRating === 4.5
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>Ratings 4.5+</span>
        </button>

        {/* Fast Delivery */}
        <button
          onClick={() => setFastDeliveryOnly(!fastDeliveryOnly)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            fastDeliveryOnly
              ? 'bg-brand-50 border-brand-300 text-brand-700'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <Clock className="w-3 h-3 text-brand-500" />
          <span>Fast (≤ 20 min)</span>
        </button>

        {/* Veg Only */}
        <button
          onClick={() => setVegOnly(!vegOnly)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
            vegOnly
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <span>Pure Veg Options</span>
        </button>

        {(minRating > 0 || vegOnly || fastDeliveryOnly || selectedCuisine !== 'All' || searchTerm) && (
          <button
            onClick={clearFilters}
            className="text-xs text-brand-600 hover:text-brand-700 font-semibold px-2 py-1 ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Results */}
      {restaurants.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-100 p-8 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto">
            <Filter className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No restaurants found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            We couldn't find any restaurants matching your active filters. Try searching for Biryani, Pizza, or clear filters.
          </p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <Link
              key={restaurant.id}
              href={`/restaurants/${restaurant.slug}`}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={restaurant.coverImage}
                    alt={restaurant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Rating */}
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

                  {/* Offer */}
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-brand-600 to-amber-500 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shadow-md uppercase tracking-wider flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>20% OFF</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-base font-black text-slate-900 group-hover:text-brand-600 transition">
                    {restaurant.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-1">{restaurant.cuisine}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <Bike className="w-3.5 h-3.5 text-slate-400" />
                      <span>₹{restaurant.deliveryFee} fee</span>
                    </div>
                    <span>•</span>
                    <div>Min ₹{restaurant.minimumOrder}</div>
                    <span>•</span>
                    <div className="truncate">{restaurant.area}</div>
                  </div>
                </div>
              </div>

              <div className="px-5 pb-4">
                <div className="w-full py-2 rounded-xl bg-slate-50 group-hover:bg-brand-50 group-hover:text-brand-700 text-slate-600 font-bold text-xs text-center transition">
                  View Full Menu &rarr;
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading restaurants...</p>
      </div>
    }>
      <RestaurantsInner />
    </Suspense>
  );
}
