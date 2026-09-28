'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  RotateCcw,
  ArrowRight,
  Printer,
  HelpCircle,
  Star,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useCart } from '@/lib/cartContext';

export default function OrdersHistoryPage() {
  const router = useRouter();
  const { addItem, setIsCartDrawerOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
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
    fetchOrders();
  }, []);

  const handleReorder = (order: Order) => {
    // Add all order items back to cart
    for (const item of order.items) {
      addItem({
        id: item.id,
        type: 'FOOD',
        name: item.name,
        restaurantId: order.restaurantId,
        restaurantName: order.restaurantName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      });
    }
    setIsCartDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Loading your past orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your order history, track active deliveries, or reorder favorites
          </p>
        </div>
        <Link
          href="/restaurants"
          className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-4 py-2 rounded-xl transition"
        >
          Explore New Dishes &rarr;
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 shadow-card space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hungry? Order signature biryani, coastal fish curry, or stone-baked pizza now!
          </p>
          <Link
            href="/restaurants"
            className="inline-block px-5 py-2.5 rounded-2xl bg-brand-500 text-white font-bold text-xs shadow-elevated"
          >
            Start Your First Order
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isDelivered = order.status === 'DELIVERED';
            const isCancelled = order.status === 'CANCELLED';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-md transition space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900">
                        {order.restaurantName || order.groceryStoreName || 'Zestora Kitchen'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isDelivered
                            ? 'bg-emerald-100 text-emerald-800'
                            : isCancelled
                            ? 'bg-red-100 text-red-800'
                            : 'bg-brand-100 text-brand-800 animate-pulse'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Order #{order.orderNumber} • Placed {formatDateTime(order.createdAt)}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-slate-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400">{order.paymentMethod}</div>
                  </div>
                </div>

                {/* Items summary */}
                <div className="text-xs text-slate-600 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.name}
                        {item.variantName && ` (${item.variantName})`}
                      </span>
                      <span className="text-slate-900 font-semibold">
                        {formatCurrency(item.totalPrice)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>

                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                    >
                      <span>Track / Receipt</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/support"
                      className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Help / Support</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
