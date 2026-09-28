'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, Star, Clock, ArrowLeft, ArrowRight, Utensils } from 'lucide-react';
import { SEED_RESTAURANTS } from '@/server/seedData';

export default function FavoritesPage() {
  const favoriteRestaurants = SEED_RESTAURANTS.slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Your Saved Favorites</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>Favorite Spots</span>
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your most loved kitchens and signature dishes in Bhatkal
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {favoriteRestaurants.map((restaurant) => (
          <Link
            key={restaurant.id}
            href={`/restaurants/${restaurant.slug}`}
            className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-card hover:shadow-xl transition group"
          >
            <div className="relative h-44 w-full bg-slate-100">
              <img
                src={restaurant.coverImage}
                alt={restaurant.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              />
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 shadow-sm">
                <Heart className="w-4 h-4 fill-red-500" />
              </div>
              <div className="absolute bottom-3 left-3 bg-white/95 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{restaurant.rating}</span>
              </div>
            </div>

            <div className="p-5">
              <h3 className="font-black text-base text-slate-900 group-hover:text-brand-600 transition">
                {restaurant.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{restaurant.cuisine}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                <Clock className="w-3.5 h-3.5" />
                <span>{restaurant.deliveryTimeMin}–{restaurant.deliveryTimeMax} min</span>
                <span>•</span>
                <span>{restaurant.area}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
