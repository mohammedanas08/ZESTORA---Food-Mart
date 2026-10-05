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
  CreditCard,
  QrCode,
  MapPin,
  Calendar,
  AlertCircle,
  Truck,
} from 'lucide-react';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useCart } from '@/lib/cartContext';

export default function MyOrdersPage() {
  const router = useRouter();
  const { currentUser, addItem, setIsCartDrawerOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      // Backend automatically isolates customer orders by authenticated user cookie/session!
      const res = await fetch('/api/v1/orders');
      const data = await res.json();
      if (data.success && data.data) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error('Error fetching customer orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [currentUser]);

  const handleReorder = (order: Order) => {
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

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'PAID') return o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS';
    if (activeFilter === 'PENDING') return o.paymentStatus === 'PENDING' || o.status === 'PAYMENT_PENDING';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
            Customer Account
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-1">My Orders</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track live deliveries, manage payment status, and review tax invoices for {currentUser.name}.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveFilter('PAID')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'PAID'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Paid ({orders.filter((o) => o.paymentStatus === 'PAID' || o.paymentStatus === 'SUCCESS').length})
          </button>
          <button
            onClick={() => setActiveFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeFilter === 'PENDING'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pending ({orders.filter((o) => o.paymentStatus === 'PENDING').length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="max-w-4xl mx-auto py-24 px-4 text-center">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading your orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-card max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">No Orders Found</h2>
          <p className="text-xs text-slate-500 mt-2">
            You haven't placed any orders matching this filter yet.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block px-6 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition"
          >
            Start Ordering
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isPaid = order.paymentStatus === 'PAID' || order.paymentStatus === 'SUCCESS';
            const isPendingPayment = order.paymentStatus === 'PENDING' || order.status === 'PAYMENT_PENDING';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden transition hover:border-slate-200"
              >
                {/* Order Top Bar */}
                <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      #{order.orderNumber}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDateTime(order.createdAt)}
                    </span>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    {/* Payment Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          PAID
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          PENDING PAYMENT
                        </>
                      )}
                    </span>

                    {/* Order Fulfillment Status */}
                    <span className="px-2.5 py-1 rounded-full bg-slate-200/70 text-slate-800 text-[11px] font-bold">
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Order Items & Breakdown */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    {/* Items List */}
                    <div className="md:col-span-7 space-y-3">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                        {order.restaurantName || order.groceryStoreName || 'Zestora Partner'}
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-800">
                                {item.quantity} × {item.name}
                              </span>
                              {item.variantName && (
                                <span className="block text-[11px] text-slate-500">
                                  Variant: {item.variantName}
                                </span>
                              )}
                              {item.addons && item.addons.length > 0 && (
                                <span className="block text-[11px] text-slate-400">
                                  Add-ons: {item.addons.join(', ')}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-slate-900">
                              {formatCurrency(item.totalPrice)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Delivery Address */}
                      <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-500">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-slate-700">Delivery Address: </span>
                          <span>
                            {order.address.addressLine1}, {order.address.area}, {order.address.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bill Summary & Actions */}
                    <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Item Subtotal</span>
                        <span>{formatCurrency(order.subtotal)}</span>
                      </div>
                      {order.packagingFee > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Packaging</span>
                          <span>{formatCurrency(order.packagingFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>Delivery Fee</span>
                        <span>{order.deliveryFee === 0 ? 'FREE' : formatCurrency(order.deliveryFee)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxes & GST (5%)</span>
                        <span>{formatCurrency(order.taxes)}</span>
                      </div>
                      {order.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-semibold">
                          <span>Coupon Discount</span>
                          <span>-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-slate-900 text-sm pt-2 border-t border-slate-200">
                        <span>Total Amount</span>
                        <span className="text-brand-600">{formatCurrency(order.totalAmount)}</span>
                      </div>

                      {order.razorpayPaymentId && (
                        <div className="text-[10px] text-slate-400 font-mono pt-1">
                          Payment ID: {order.razorpayPaymentId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {isPendingPayment ? (
                        <Link
                          href={`/checkout/payment/${order.id}`}
                          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Complete Payment (Scan QR)
                        </Link>
                      ) : (
                        <Link
                          href={`/orders/${order.id}`}
                          className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track Order Live
                        </Link>
                      )}

                      <button
                        onClick={() => handleReorder(order)}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                        Reorder
                      </button>
                    </div>

                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      View Invoice & Full Details &rarr;
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
