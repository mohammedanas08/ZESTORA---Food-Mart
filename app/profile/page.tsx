'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Bell,
  Shield,
  Moon,
  Sun,
  Check,
  ChevronRight,
  LogOut,
  Star,
  ShoppingBag,
  Clock,
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { SEED_USERS } from '@/server/seedData';
import { Role } from '@/types';

export default function ProfilePage() {
  const { currentUser, currentRole, switchRole } = useCart();

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promoDeals: true,
    deliveryAlerts: true,
    weeklyDigest: false,
  });

  const stats = [
    { label: 'Total Orders', value: '14', icon: ShoppingBag },
    { label: 'Avg Rating Given', value: '4.8', icon: Star },
    { label: 'Savings This Month', value: '₹320', icon: Check },
    { label: 'Avg Delivery Time', value: '28m', icon: Clock },
  ];

  const roles: { id: Role; label: string; desc: string; color: string }[] = [
    { id: 'CUSTOMER', label: '👤 Customer', desc: 'Order food & groceries', color: 'brand' },
    { id: 'RESTAURANT_OWNER', label: '🍳 Restaurant Partner', desc: 'Manage kitchen & orders', color: 'amber' },
    { id: 'DELIVERY_PARTNER', label: '🛵 Delivery Partner', desc: 'Accept & deliver orders', color: 'emerald' },
    { id: 'ADMIN', label: '⚡ Platform Admin', desc: 'Oversee platform operations', color: 'slate' },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Your Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Avatar & Basic Info */}
        <div className="md:col-span-4 space-y-5">
          {/* Profile card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card text-center space-y-4">
            <div className="relative inline-block">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-xl mx-auto"
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">{currentUser.name}</h2>
              <p className="text-xs text-brand-600 font-bold mt-0.5">
                {currentUser.role.replace(/_/g, ' ')}
              </p>
            </div>

            <div className="space-y-2 text-xs text-slate-600 text-left">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{currentUser.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Bhatkal, Karnataka</span>
              </div>
            </div>

            <Link
              href="/support"
              className="block w-full py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition text-center"
            >
              Contact Support
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-card">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">
              Your Activity
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="bg-slate-50 rounded-2xl p-3 text-center">
                  <s.icon className="w-4 h-4 text-brand-500 mx-auto mb-1" />
                  <div className="text-base font-black text-slate-900">{s.value}</div>
                  <div className="text-[10px] text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Settings & Role Switcher */}
        <div className="md:col-span-8 space-y-5">
          {/* Demo Role Switcher */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-1">Zestora Demo Role Switcher</h3>
            <p className="text-xs text-slate-500 mb-4">
              Instantly switch between portals to explore all platform capabilities
            </p>
            <div className="space-y-2">
              {roles.map((r) => {
                const isActive = currentRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition ${
                      isActive
                        ? 'border-brand-500 bg-brand-50/50 shadow-xs'
                        : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{r.label}</div>
                      <div className="text-[11px] text-slate-500">{r.desc}</div>
                    </div>
                    {isActive && (
                      <div className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-500" />
              Notification Preferences
            </h3>
            <div className="space-y-3">
              {Object.entries(notifications).map(([key, value]) => {
                const labels: Record<string, { title: string; desc: string }> = {
                  orderUpdates: { title: 'Order Status Updates', desc: 'Receive live order progress alerts' },
                  promoDeals: { title: 'Promo & Deals', desc: 'Get notified about coupon codes & flash deals' },
                  deliveryAlerts: { title: 'Delivery Alerts', desc: 'Rider movement, ETA and handover confirmations' },
                  weeklyDigest: { title: 'Weekly Digest', desc: 'Personalized weekly summary & top picks' },
                };
                const info = labels[key];

                return (
                  <div key={key} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{info.title}</div>
                      <div className="text-[11px] text-slate-400">{info.desc}</div>
                    </div>
                    <button
                      onClick={() =>
                        setNotifications((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
                      }
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        value ? 'bg-brand-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                          value ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-1">
            <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-500" />
              Account & Legal
            </h3>
            {[
              { label: 'Order History', href: '/orders' },
              { label: 'Saved Addresses', href: '/checkout' },
              { label: 'Saved Favorites', href: '/favorites' },
              { label: 'Customer Support', href: '/support' },
              { label: 'Privacy Policy', href: '#' },
              { label: 'Terms of Service', href: '#' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between py-2 px-2 rounded-xl hover:bg-slate-50 text-xs text-slate-700 font-medium transition"
              >
                <span>{item.label}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
