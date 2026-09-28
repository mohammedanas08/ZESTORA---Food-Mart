'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bike,
  DollarSign,
  MapPin,
  Clock,
  Phone,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { Order, DeliveryPartner } from '@/types';
import { formatCurrency } from '@/lib/utils';

export default function DeliveryDashboardPage() {
  const [partner, setPartner] = useState<DeliveryPartner>({
    id: 'partner-1',
    userId: 'user-delivery-1',
    name: 'Rahul Naik',
    phone: '+91 94488 55667',
    vehicleNumber: 'KA-47-E-8821',
    vehicleType: 'Honda Activa 6G',
    onlineStatus: 'ONLINE',
    rating: 4.85,
    totalTrips: 342,
    todayTrips: 6,
    todayEarnings: 420,
    walletBalance: 1250,
    currentLat: 13.9872,
    currentLng: 74.5612,
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDeliveryData = async () => {
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
    fetchDeliveryData();
    const interval = setInterval(fetchDeliveryData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateDeliveryStep = async (orderId: string, nextStatus: any, note: string) => {
    try {
      const res = await fetch(`/api/v1/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, note }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDeliveryData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (e) {
      alert('Error updating delivery flow');
    }
  };

  // Orders available for pickup or active with this rider
  const pendingRequests = orders.filter((o) =>
    ['READY_FOR_PICKUP', 'DELIVERY_ASSIGNED'].includes(o.status)
  );
  const activeDeliveries = orders.filter((o) =>
    ['PICKED_UP', 'ON_THE_WAY', 'ARRIVING'].includes(o.status)
  );
  const completedToday = orders.filter((o) => o.status === 'DELIVERED');

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">
      {/* Mobile-Friendly Rider Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>{partner.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {partner.vehicleNumber}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">{partner.vehicleType} • 4.85 ★</div>
            </div>
          </div>

          <button
            onClick={() =>
              setPartner({
                ...partner,
                onlineStatus: partner.onlineStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE',
              })
            }
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              partner.onlineStatus === 'ONLINE'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                partner.onlineStatus === 'ONLINE' ? 'bg-slate-950 animate-pulse' : 'bg-slate-500'
              }`}
            />
            <span>{partner.onlineStatus === 'ONLINE' ? 'ONLINE (Ready)' : 'OFFLINE'}</span>
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* EARNINGS SUMMARY CARDS (Section 20 & 84) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Today's Pay</div>
            <div className="text-xl font-black text-emerald-400 mt-1">
              ₹{partner.todayEarnings + completedToday.length * 50}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Includes Tips</div>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Trips Done</div>
            <div className="text-xl font-black text-white mt-1">
              {partner.todayTrips + completedToday.length}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Bhatkal Cluster</div>
          </div>

          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Wallet Balance</div>
            <div className="text-xl font-black text-amber-400 mt-1">
              ₹{partner.walletBalance}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Instant Payout</div>
          </div>
        </div>

        {/* ACTIVE ON-THE-WAY DELIVERIES (Step-by-Step navigation) */}
        {activeDeliveries.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 animate-spin" />
              <span>Active In-Transit Trip</span>
            </div>

            {activeDeliveries.map((order) => {
              const isPickedUp = order.status === 'PICKED_UP';
              const isOnWay = ['ON_THE_WAY', 'ARRIVING'].includes(order.status);

              return (
                <div
                  key={order.id}
                  className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl p-5 shadow-2xl space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-black text-white">
                        Delivery for {order.customerName}
                      </div>
                      <div className="text-xs text-slate-300 mt-0.5">
                        Order #{order.orderNumber}
                      </div>
                    </div>
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="p-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  </div>

                  {/* Locations */}
                  <div className="bg-slate-900/80 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-800">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        •
                      </div>
                      <div>
                        <div className="font-bold text-slate-300">
                          Pickup: {order.restaurantName || 'Zestora Store'}
                        </div>
                        <div className="text-[11px] text-slate-400">Package picked up ✓</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-2 border-t border-slate-800">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3" />
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          Customer Drop: {order.address.fullName}
                        </div>
                        <div className="text-xs text-slate-300">
                          {order.address.addressLine1}, {order.address.area}
                        </div>
                        {order.address.deliveryInstructions && (
                          <div className="text-[11px] text-amber-300 italic mt-1">
                            Note: "{order.address.deliveryInstructions}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action transitions */}
                  {isPickedUp && (
                    <button
                      onClick={() =>
                        handleUpdateDeliveryStep(
                          order.id,
                          'ON_THE_WAY',
                          'Rider started GPS navigation to customer'
                        )
                      }
                      className="w-full py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-md transition"
                    >
                      Start GPS Navigation &rarr; "On The Way"
                    </button>
                  )}

                  {isOnWay && (
                    <button
                      onClick={() =>
                        handleUpdateDeliveryStep(
                          order.id,
                          'DELIVERED',
                          'Order safely delivered to customer by rider'
                        )
                      }
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-md transition"
                    >
                      ✓ Confirm Handover & Mark Delivered (+₹{Math.round(order.deliveryFee + order.tip)})
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* INCOMING DISPATCH / READY FOR PICKUP QUEUE */}
        <div className="space-y-3">
          <div className="text-xs font-black uppercase tracking-wider text-slate-400">
            Available Pickup Requests ({pendingRequests.length})
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-sm font-bold text-slate-300">No pending pickups right now</div>
              <p className="text-xs text-slate-500 mt-1">
                You will be alerted as soon as kitchen marks dishes ready!
              </p>
            </div>
          ) : (
            pendingRequests.map((order) => {
              const estimatedEarnings = Math.round(order.deliveryFee + order.tip);

              return (
                <div
                  key={order.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 mb-1">
                        Order #{order.orderNumber}
                      </div>
                      <h4 className="font-black text-base text-white">
                        Pickup from {order.restaurantName || 'Kitchen Hub'}
                      </h4>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-emerald-400">
                        {formatCurrency(estimatedEarnings)}
                      </div>
                      <div className="text-[10px] text-slate-400">Estimated Pay</div>
                    </div>
                  </div>

                  {/* Route overview */}
                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>Drop to: {order.address.area} (approx. 3.5 km)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>{order.items.length} items packed and ready on counter</span>
                    </div>
                  </div>

                  {/* Accept / Decline actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() =>
                        handleUpdateDeliveryStep(
                          order.id,
                          'PICKED_UP',
                          'Delivery partner accepted and picked up parcel'
                        )
                      }
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition"
                    >
                      Accept & Confirm Pickup &rarr;
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
