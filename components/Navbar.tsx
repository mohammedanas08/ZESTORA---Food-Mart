'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  MapPin,
  Search,
  ShoppingBag,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Utensils,
  Zap,
  Tag,
  ShieldAlert,
  Store,
  Bike,
  Heart,
  Clock,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import LocationModal from './LocationModal';
import { Role } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const {
    items,
    pricing,
    selectedAddress,
    setIsCartDrawerOpen,
    currentRole,
    currentUser,
    switchRole,
  } = useCart();

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Top Demo Bar for Reviewer / Instant Role Switching */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="bg-slate-900 text-white text-xs px-4 py-1.5 font-medium flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 hidden sm:inline">Active Persona:</span>
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              {currentRole === 'CUSTOMER' && '👤 Customer (Anas Ahmed)'}
              {currentRole === 'RESTAURANT_OWNER' && '🍳 Restaurant Partner (Spice Garden)'}
              {currentRole === 'DELIVERY_PARTNER' && '🛵 Delivery Partner (Rahul Naik)'}
              {currentRole === 'ADMIN' && '⚡ Platform Admin (Zestora HQ)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] hidden md:inline">Quick Switch:</span>
            <div className="flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                onClick={() => {
                  switchRole('CUSTOMER');
                  router.push('/');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentRole === 'CUSTOMER'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Customer
              </button>
              <button
                onClick={() => {
                  switchRole('RESTAURANT_OWNER');
                  router.push('/restaurant-dashboard');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentRole === 'RESTAURANT_OWNER'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kitchen
              </button>
              <button
                onClick={() => {
                  switchRole('DELIVERY_PARTNER');
                  router.push('/delivery-dashboard');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentRole === 'DELIVERY_PARTNER'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Driver
              </button>
              <button
                onClick={() => {
                  switchRole('ADMIN');
                  router.push('/admin');
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  currentRole === 'ADMIN'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo + Location */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5 fill-white/30" />
                </div>
                <div>
                  <span className="text-2xl font-black tracking-tight text-slate-900 flex items-center">
                    Zestora<span className="text-brand-500">.</span>
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 -mt-1">
                    Food & Mart
                  </span>
                </div>
              </Link>

              {/* Location Picker */}
              <button
                onClick={() => setIsLocationOpen(true)}
                className="hidden md:flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-100 transition text-left group border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="max-w-[180px]">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1 group-hover:text-brand-600">
                    <span className="truncate">{selectedAddress.area || 'Bhatkal Central'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {selectedAddress.addressLine1}
                  </div>
                </div>
              </button>
            </div>

            {/* Navigation Category Tabs */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
              <Link
                href="/restaurants"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  pathname.startsWith('/restaurant') && !pathname.includes('dashboard')
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5 text-brand-500" />
                Restaurants
              </Link>
              <Link
                href="/grocery"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  pathname === '/grocery'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                Grocery (10-20m)
              </Link>
              <Link
                href="/offers"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  pathname === '/offers'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                Coupons & Offers
              </Link>
            </nav>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search food, biryani, burgers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-brand-500 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition"
              />
            </form>

            {/* Actions: Cart & Profile */}
            <div className="flex items-center gap-3">
              {/* Cart Drawer Trigger */}
              <button
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-brand-50 hover:bg-brand-100/80 text-brand-700 border border-brand-200 transition active:scale-95 group"
              >
                <div className="relative">
                  <ShoppingBag className="w-4 h-4 text-brand-600 group-hover:scale-110 transition-transform" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold hidden sm:inline">
                  {totalCartCount > 0 ? formatCurrency(pricing.total) : 'Cart'}
                </span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                >
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-xl object-cover"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 mr-1" />
                </button>

                {isUserMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                      <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition font-medium"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      Profile & Settings
                    </Link>
                    <Link
                      href="/orders"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition font-medium"
                    >
                      <Clock className="w-4 h-4 text-slate-400" />
                      Your Orders
                    </Link>
                    <Link
                      href="/favorites"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition font-medium"
                    >
                      <Heart className="w-4 h-4 text-slate-400" />
                      Favorites
                    </Link>
                    <Link
                      href="/support"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-brand-600 transition font-medium"
                    >
                      <HelpCircle className="w-4 h-4 text-slate-400" />
                      Customer Support
                    </Link>

                    <div className="border-t border-slate-100 my-1 pt-1">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Ecosystem Portals
                      </div>
                      <Link
                        href="/restaurant-dashboard"
                        className="flex items-center gap-2.5 px-4 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-700 transition font-medium"
                      >
                        <Store className="w-4 h-4 text-amber-500" />
                        Restaurant Kitchen
                      </Link>
                      <Link
                        href="/delivery-dashboard"
                        className="flex items-center gap-2.5 px-4 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition font-medium"
                      >
                        <Bike className="w-4 h-4 text-emerald-500" />
                        Driver App
                      </Link>
                      <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition font-medium"
                      >
                        <ShieldAlert className="w-4 h-4 text-slate-700" />
                        Admin Command Center
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      <LocationModal isOpen={isLocationOpen} onClose={() => setIsLocationOpen(false)} />
    </>
  );
}
