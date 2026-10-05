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
  Clock,
  HelpCircle,
  LogOut,
  LayoutDashboard,
  Package,
  Users,
  CreditCard,
  Heart,
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import LocationModal from './LocationModal';
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
    isAuthenticated,
    logout,
  } = useCart();

  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/restaurants?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    await logout();
    router.replace('/login');
  };

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo + Location */}
            <div className="flex items-center gap-5">
              <Link href={isAdmin ? '/admin' : '/'} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-300/30 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-4.5 h-4.5 fill-white/30" />
                </div>
                <div>
                  <span className="text-xl font-black tracking-tight text-slate-900 flex items-center">
                    Zestora<span className="text-orange-500">.</span>
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 -mt-0.5">
                    {isAdmin ? 'Admin Console' : 'Food & Mart'}
                  </span>
                </div>
              </Link>

              {/* Location Picker (Customer only) */}
              {!isAdmin && (
                <button
                  onClick={() => setIsLocationOpen(true)}
                  className="hidden md:flex items-center gap-2 p-2 rounded-2xl hover:bg-slate-100 transition text-left group border border-transparent hover:border-slate-200"
                >
                  <div className="w-7 h-7 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div className="max-w-[180px]">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <span>Deliver to</span>
                      <ChevronDown className="w-3 h-3" />
                    </div>
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {selectedAddress.area}, {selectedAddress.city}
                    </div>
                  </div>
                </button>
              )}
            </div>

            {/* Navigation */}
            {isAdmin ? (
              // ADMIN NAVIGATION
              <nav className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                <Link
                  href="/admin"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/admin'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Orders
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  <Package className="w-3.5 h-3.5" />
                  Products
                </Link>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  Users
                </Link>
              </nav>
            ) : (
              // CUSTOMER NAVIGATION
              <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
                <Link
                  href="/restaurants"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    pathname.startsWith('/restaurant') && !pathname.includes('dashboard')
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5 text-orange-500" />
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
                  Grocery
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
                  Offers
                </Link>
                <Link
                  href="/my-orders"
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    pathname === '/my-orders' || pathname === '/orders'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  My Orders
                </Link>
              </nav>
            )}

            {/* Search Bar (Customer only) */}
            {!isAdmin && (
              <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs relative hidden sm:block">
                <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search dishes, restaurants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/80 focus:border-orange-400 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/10 transition"
                />
              </form>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Cart (Customer only) */}
              {!isAdmin && (
                <button
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-orange-50 hover:bg-orange-100/80 text-orange-700 border border-orange-200 transition active:scale-95 group"
                >
                  <div className="relative">
                    <ShoppingBag className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
                    {totalCartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                        {totalCartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold hidden sm:inline">
                    {totalCartCount > 0 ? formatCurrency(pricing.total) : 'Cart'}
                  </span>
                </button>
              )}

              {/* User Menu */}
              <div className="relative">
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                    >
                      {currentUser.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-8 h-8 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-orange-600" />
                        </div>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 mr-1" />
                    </button>

                    {isUserMenuOpen && (
                      <div
                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        {/* User info header */}
                        <div className="px-4 py-2.5 border-b border-slate-100">
                          <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                          <div className="text-[11px] text-slate-400">{currentUser.email}</div>
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isAdmin
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {currentUser.role}
                          </span>
                        </div>

                        {isAdmin ? (
                          // ADMIN menu items
                          <>
                            <Link
                              href="/admin"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <LayoutDashboard className="w-4 h-4 text-slate-400" />
                              Admin Dashboard
                            </Link>
                            <Link
                              href="/profile"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <UserIcon className="w-4 h-4 text-slate-400" />
                              Profile Settings
                            </Link>
                          </>
                        ) : (
                          // CUSTOMER menu items (NO admin links)
                          <>
                            <Link
                              href="/profile"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <UserIcon className="w-4 h-4 text-slate-400" />
                              Profile & Settings
                            </Link>
                            <Link
                              href="/my-orders"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <Clock className="w-4 h-4 text-slate-400" />
                              My Orders
                            </Link>
                            <Link
                              href="/favorites"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <Heart className="w-4 h-4 text-slate-400" />
                              Favorites
                            </Link>
                            <Link
                              href="/support"
                              className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-orange-600 transition font-medium"
                            >
                              <HelpCircle className="w-4 h-4 text-slate-400" />
                              Customer Support
                            </Link>
                          </>
                        )}

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition font-semibold text-left"
                          >
                            <LogOut className="w-4 h-4" />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  // Not authenticated — show login button
                  <Link
                    href="/login"
                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition active:scale-95"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Sign In
                  </Link>
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
