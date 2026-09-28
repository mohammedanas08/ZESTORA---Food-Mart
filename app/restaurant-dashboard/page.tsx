'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Percent,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Order, Restaurant, MenuItem, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { SEED_RESTAURANTS } from '@/server/seedData';

export default function RestaurantDashboardPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'settlements'>('orders');
  const [restaurant, setRestaurant] = useState<Restaurant>(SEED_RESTAURANTS[0]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [rejectModalOrder, setRejectModalOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Restaurant Busy');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/v1/orders');
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, note?: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, note }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      } else {
        alert(data.message || 'Status transition failed');
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  const handleRejectOrder = async () => {
    if (!rejectModalOrder) return;
    try {
      const res = await fetch(`/api/v1/orders/${rejectModalOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          rejectionReason: rejectReason,
          note: `Kitchen rejected: ${rejectReason}`,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRejectModalOrder(null);
        fetchDashboardData();
      }
    } catch (e) {
      alert('Error rejecting order');
    }
  };

  // KPIs
  const todayRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.subtotal, 0);
  const commission = Math.round(todayRevenue * restaurant.commissionRate);
  const netPayout = todayRevenue - commission;
  const pendingOrders = orders.filter((o) =>
    ['PLACED', 'CONFIRMED', 'RESTAURANT_ACCEPTED', 'PREPARING'].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Top Partner Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white">{restaurant.name}</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
                  Kitchen Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {restaurant.area}, Bhatkal • Commission rate: {restaurant.commissionRate * 100}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Open/Close switch */}
            <button
              onClick={() => setRestaurant({ ...restaurant, isOpen: !restaurant.isOpen })}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                restaurant.isOpen
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${restaurant.isOpen ? 'bg-emerald-400' : 'bg-red-400'}`}
              />
              <span>{restaurant.isOpen ? 'Accepting Orders' : 'Store Closed'}</span>
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh Orders"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* KPI CARDS (Section 26) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Today's Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {formatCurrency(todayRevenue)}
            </div>
            <div className="text-[11px] text-emerald-400 font-medium mt-1">
              Net Payout: {formatCurrency(netPayout)}
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Active Orders</span>
              <ShoppingBag className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-2">
              {pendingOrders.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Requires Kitchen Attention</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Completed Orders</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">
              {orders.filter((o) => o.status === 'DELIVERED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Total {orders.length} orders today</div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 shadow-lg">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Customer Rating</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div className="text-2xl font-black text-white mt-2">{restaurant.rating} ★</div>
            <div className="text-[11px] text-slate-400 mt-1">Based on {restaurant.ratingCount} reviews</div>
          </div>
        </div>

        {/* TAB BUTTONS */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Kitchen Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Menu & Availability
          </button>
          <button
            onClick={() => setActiveTab('settlements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'settlements'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            B2B Commission & Payouts
          </button>
        </div>

        {/* TAB 1: LIVE ORDERS QUEUE */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">Incoming & Active Orders</h2>
              <span className="text-xs text-slate-400">Live Auto-Sync Active (3s)</span>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center bg-slate-800/40 rounded-3xl border border-slate-800">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No active kitchen orders</h3>
                <p className="text-xs text-slate-500 mt-1">
                  When customers place orders in Bhatkal, they will appear here immediately.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => {
                  const isPendingAccept = ['PLACED', 'CONFIRMED'].includes(order.status);
                  const isAccepted = order.status === 'RESTAURANT_ACCEPTED';
                  const isPreparing = order.status === 'PREPARING';
                  const isReady = order.status === 'READY_FOR_PICKUP';
                  const isOut = ['PICKED_UP', 'ON_THE_WAY', 'ARRIVING'].includes(order.status);
                  const isDelivered = order.status === 'DELIVERED';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-white">
                                {order.orderNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDelivered
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isCancelled
                                    ? 'bg-red-500/20 text-red-400'
                                    : isPendingAccept
                                    ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                                    : 'bg-blue-500/20 text-blue-300'
                                }`}
                              >
                                {order.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              For: {order.customerName} ({order.address.area})
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-amber-400">
                              {formatCurrency(order.subtotal)}
                            </div>
                            <div className="text-[10px] text-slate-500">{order.items.length} items</div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="bg-slate-900/60 rounded-2xl p-3 space-y-1 text-xs border border-slate-800">
                          {order.items.map((i) => (
                            <div key={i.id} className="flex justify-between text-slate-300">
                              <span className="font-bold">
                                {i.quantity}x {i.name}
                                {i.variantName && ` (${i.variantName})`}
                              </span>
                              <span>{formatCurrency(i.totalPrice)}</span>
                            </div>
                          ))}
                          {order.address.deliveryInstructions && (
                            <div className="text-[10px] text-amber-300 italic pt-1 border-t border-slate-800">
                              Special Request: {order.address.deliveryInstructions}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* WORKFLOW ACTION BUTTONS (Section 27) */}
                      <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between gap-2">
                        {isPendingAccept && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  order.id,
                                  'RESTAURANT_ACCEPTED',
                                  'Accepted by kitchen'
                                )
                              }
                              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                            >
                              ✓ Accept Order
                            </button>
                            <button
                              onClick={() => setRejectModalOrder(order)}
                              className="px-4 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/40 text-red-400 font-bold text-xs transition"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                order.id,
                                'PREPARING',
                                'Chef started cooking food'
                              )
                            }
                            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition"
                          >
                            <ChefHat className="w-4 h-4" />
                            <span>Mark Food Preparing</span>
                          </button>
                        )}

                        {isPreparing && (
                          <button
                            onClick={() =>
                              handleUpdateStatus(
                                order.id,
                                'READY_FOR_PICKUP',
                                'Food packed and ready on counter'
                              )
                            }
                            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition"
                          >
                            <Bike className="w-4 h-4" />
                            <span>Mark Ready for Pickup (Dispatch Rider)</span>
                          </button>
                        )}

                        {isReady && (
                          <div className="text-xs text-amber-300 font-medium py-1">
                            Awaiting Rider Arrival & Pickup...
                          </div>
                        )}

                        {isOut && (
                          <div className="text-xs text-blue-300 font-medium py-1">
                            Rider {order.deliveryPartnerName || ''} on route to customer
                          </div>
                        )}

                        {isDelivered && (
                          <div className="text-xs text-emerald-400 font-medium py-1">
                            Order Completed & Settled
                          </div>
                        )}

                        {isCancelled && (
                          <div className="text-xs text-red-400 font-medium py-1">
                            Order Cancelled {order.rejectionReason && `(${order.rejectionReason})`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MENU & AVAILABILITY */}
        {activeTab === 'menu' && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">Menu Item Catalog & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {restaurant.menuCategories?.flatMap((cat) => cat.items).map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-800/90 border border-slate-700 rounded-3xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-2xl object-cover bg-slate-900"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <div className="text-xs text-amber-400 font-bold">₹{item.price}</div>
                      <div className="text-[11px] text-slate-400">Prep: {item.preparationTime} mins</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const updated = { ...item, isAvailable: !item.isAvailable };
                      alert(`${item.name} status updated to: ${updated.isAvailable ? 'In Stock' : 'Out of Stock'}`);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      item.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-red-500/20 text-red-400 border border-red-500/40'
                    }`}
                  >
                    {item.isAvailable ? 'In Stock' : 'Out of Stock'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: B2B COMMISSION & SETTLEMENT (Section 83) */}
        {activeTab === 'settlements' && (
          <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-6 space-y-6">
            <div>
              <h2 className="text-lg font-black text-white">Settlement & Commission Ledger</h2>
              <p className="text-xs text-slate-400">
                Transparent revenue calculation with 20% platform commission deduction
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Gross Restaurant Sales</div>
                <div className="text-2xl font-black text-white mt-1">{formatCurrency(todayRevenue)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Platform Commission (20%)</div>
                <div className="text-2xl font-black text-red-400 mt-1">- {formatCurrency(commission)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">Net Settled Payout</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{formatCurrency(netPayout)}</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-bold text-slate-200">Settlement Policy & Schedule</div>
              <p>
                Settlements are automatically processed every Tuesday directly to registered bank accounts via NEFT/IMPS.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* REJECT MODAL */}
      {rejectModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-black text-white">
              Decline Order #{rejectModalOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-400">
              Please choose a reason for rejection (required by platform standards):
            </p>

            <select
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
            >
              <option value="Restaurant Busy">Restaurant Busy</option>
              <option value="Item Unavailable">Item Unavailable</option>
              <option value="Closing Soon">Closing Soon</option>
              <option value="Technical Problem">Technical Problem</option>
              <option value="Other">Other</option>
            </select>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOrder(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectOrder}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
