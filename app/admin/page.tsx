'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  DollarSign,
  ShoppingBag,
  Store,
  Bike,
  Users,
  Percent,
  MapPin,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Order, Restaurant, AuditLog, ServiceArea } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SEED_RESTAURANTS, SEED_SERVICE_AREAS, SEED_COUPONS } from '@/server/seedData';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'restaurants' | 'coupons' | 'zones' | 'audit'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(SEED_RESTAURANTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAdminData = async () => {
    try {
      const [metricsRes, ordersRes] = await Promise.all([
        fetch('/api/v1/admin/metrics'),
        fetch('/api/v1/orders'),
      ]);
      const metricsData = await metricsRes.json();
      const ordersData = await ordersRes.json();

      if (metricsData.success) {
        setMetrics(metricsData.data.metrics);
        setAuditLogs(metricsData.data.auditLogs);
      }
      if (ordersData.success) {
        setOrders(ordersData.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    const interval = setInterval(fetchAdminData, 4000);
    return () => clearInterval(interval);
  }, []);

  const totalGMV = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCommission = Math.round(totalGMV * 0.20);
  const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Admin Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-500 to-amber-400 text-white flex items-center justify-center font-black shadow-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-white">Zestora Admin Operations</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">
                  Command Center
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Multi-category platform governance, B2B settlements & compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Network</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI OVERVIEW CARDS (Section 29) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Gross Merchandise Value (GMV)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {formatCurrency(totalGMV)}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              +14.8% vs last week
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Platform Commission (20%)</span>
              <TrendingUp className="w-4 h-4 text-brand-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-brand-400 mt-2">
              {formatCurrency(totalCommission)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">B2B Net Revenue</div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Total Platform Orders</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {orders.length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-1">
              {completedOrders} completed • 0 cancellations
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>Active Partners</span>
              <Store className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-2">
              {restaurants.length} Kitchens
            </div>
            <div className="text-[11px] text-slate-400 mt-1">1 Delivery Partner Online</div>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'overview' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Monitor
          </button>
          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'restaurants' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Restaurants ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'coupons' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Coupons Engine
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'zones' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivery Zones & Surge
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'audit' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Log Ledger
          </button>
        </div>

        {/* TAB 1: LIVE ORDERS MONITOR */}
        {activeTab === 'overview' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-white">Live Platform Orders Feed</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/60 text-slate-400 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Order Number</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Restaurant / Store</th>
                    <th className="p-3">Area</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{o.orderNumber}</td>
                      <td className="p-3 font-medium">{o.customerName}</td>
                      <td className="p-3">{o.restaurantName || o.groceryStoreName || 'QuickMart'}</td>
                      <td className="p-3">{o.address.area}</td>
                      <td className="p-3 font-black text-white">{formatCurrency(o.totalAmount)}</td>
                      <td className="p-3 font-semibold text-emerald-400">{o.paymentMethod}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-400">
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: RESTAURANTS */}
        {activeTab === 'restaurants' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-white">Partner Restaurants Directory</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurants.map((r) => (
                <div
                  key={r.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img src={r.logo} alt={r.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div>
                      <h4 className="font-black text-white text-sm">{r.name}</h4>
                      <div className="text-xs text-slate-400">{r.cuisine}</div>
                      <div className="text-[11px] text-amber-400 mt-0.5">
                        Commission: {r.commissionRate * 100}% • {r.area}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                    Active & Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COUPONS ENGINE (Section 30) */}
        {activeTab === 'coupons' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-white">Active Promotional Coupons</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SEED_COUPONS.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-sm text-amber-400">{c.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                      Active
                    </span>
                  </div>
                  <div className="text-xs text-white font-medium">{c.description}</div>
                  <div className="text-[11px] text-slate-400">
                    Min Order: ₹{c.minimumOrder} • Type: {c.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DELIVERY ZONES (Section 22) */}
        {activeTab === 'zones' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-white">
              Bhatkal Geofenced Delivery Zones & Tariffs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SEED_SERVICE_AREAS.map((z) => (
                <div
                  key={z.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2"
                >
                  <div className="font-black text-white text-sm">{z.zoneName}</div>
                  <div className="text-xs text-slate-400">
                    PIN {z.postalCode} • Radius: {z.radiusKm} km
                  </div>
                  <div className="text-xs text-emerald-400 font-bold pt-2 border-t border-slate-700">
                    Base Delivery: ₹{z.baseDelivery} • Surge: ₹{z.surgeFee}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN AUDIT LOG (Section 77) */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-black text-white">Immutable Platform Audit Ledger</h3>
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{log.action}</span>
                    <span className="text-slate-400 mx-2">on {log.entity}</span>
                    <span className="font-mono text-amber-400">{log.entityId}</span>
                  </div>
                  <div className="text-slate-400">{formatDateTime(log.timestamp)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
