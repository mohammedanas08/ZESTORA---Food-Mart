'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  Bike,
  Store,
  MapPin,
  Phone,
  Printer,
  Star,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useCart } from '@/lib/cartContext';

export default function OrderTrackingPage({
  params,
}: {
  params: { id: string };
}) {
  const { switchRole } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reviewOpen, setReviewOpen] = useState<boolean>(false);
  const [foodRating, setFoodRating] = useState<number>(5);
  const [deliveryRating, setDeliveryRating] = useState<number>(5);
  const [packagingRating, setPackagingRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/v1/orders/${params.id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // Poll every 3 seconds for simulated live partner progression
    const interval = setInterval(fetchOrder, 3000);
    return () => clearInterval(interval);
  }, [params.id]);

  const handleCancelOrder = async () => {
    if (!order) return;
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      const res = await fetch(`/api/v1/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'CANCELLED',
          note: 'Cancelled by customer prior to preparation',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      }
    } catch (e) {
      alert('Error cancelling order');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      await fetch('/api/v1/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          restaurantId: order.restaurantId || 'store-1',
          restaurantName: order.restaurantName || order.groceryStoreName || 'Zestora Partner',
          foodRating,
          packagingRating,
          deliveryRating,
          comment: reviewComment,
        }),
      });
      setReviewSubmitted(true);
      setTimeout(() => setReviewOpen(false), 2000);
    } catch (e) {
      alert('Error saving review');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-4 text-center">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-bold text-slate-500">Connecting to live dispatch network...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Order not found</h2>
        <Link href="/orders" className="text-xs text-brand-600 font-bold mt-2 inline-block">
          View all your orders &rarr;
        </Link>
      </div>
    );
  }

  // Stepper logic
  const steps: { key: OrderStatus; label: string; desc: string }[] = [
    { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Received & verified by server' },
    { key: 'RESTAURANT_ACCEPTED', label: 'Kitchen Accepted', desc: 'Kitchen sent ticket to chef' },
    { key: 'PREPARING', label: 'Cooking & Packing', desc: 'Chef preparing fresh portions' },
    { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Sealed in tamper-evident bag' },
    { key: 'PICKED_UP', label: 'Rider Picked Up', desc: 'Handed to verified delivery partner' },
    { key: 'ON_THE_WAY', label: 'On The Way', desc: 'Navigating to your delivery address' },
    { key: 'DELIVERED', label: 'Delivered', desc: 'Handed over safely with smile' },
  ];

  const statusOrder: OrderStatus[] = [
    'PLACED',
    'CONFIRMED',
    'RESTAURANT_ACCEPTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'DELIVERY_ASSIGNED',
    'PICKED_UP',
    'ON_THE_WAY',
    'ARRIVING',
    'DELIVERED',
  ];

  const currentIndex = statusOrder.indexOf(order.status);
  const isDelivered = order.status === 'DELIVERED';
  const isCancelled = order.status === 'CANCELLED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/orders"
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
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
            <p className="text-xs text-slate-400 mt-0.5">
              Placed on {formatDateTime(order.createdAt)} • {order.deliveryType} Delivery
            </p>
          </div>
        </div>

        {/* Action Buttons: Invoice & Role Quick test */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Download Invoice</span>
          </button>

          {!isDelivered && !isCancelled && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  switchRole('RESTAURANT_OWNER');
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs"
                title="Switch to Restaurant view to accept/prepare this order"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Simulate Kitchen</span>
              </button>

              <button
                onClick={() => {
                  switchRole('DELIVERY_PARTNER');
                }}
                className="hidden sm:inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
                title="Switch to Driver view to pick up/deliver this order"
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Simulate Driver</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MAIN TRACKING GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Stepper + Interactive Simulated Map */}
        <div className="lg:col-span-8 space-y-6">
          {/* Estimated ETA Banner */}
          <div className="bg-gradient-to-r from-brand-600 to-amber-500 rounded-3xl p-6 text-white shadow-elevated relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Estimated Arrival Time</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black mt-1">
                  {isDelivered ? 'Delivered Successfully' : isCancelled ? 'Order Cancelled' : '20–30 Minutes'}
                </div>
                <p className="text-xs text-white/80 mt-1">
                  {isDelivered
                    ? 'Delivered to your doorstep. Hope you enjoyed the meal!'
                    : `Delivering to ${order.address.fullName}, ${order.address.area}`}
                </p>
              </div>

              {isDelivered && !reviewSubmitted && (
                <button
                  onClick={() => setReviewOpen(true)}
                  className="px-5 py-2.5 rounded-2xl bg-white text-brand-600 font-extrabold text-xs shadow-md hover:bg-amber-50 transition"
                >
                  Rate & Review Order ★
                </button>
              )}
            </div>
          </div>

          {/* SIMULATED LIVE GPS MAP */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <MapPin className="w-4 h-4 text-brand-500" />
                <span>Live Route Simulation (Bhatkal Dispatch)</span>
              </div>
              <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Live GPS Active
              </span>
            </div>

            {/* Visual Route Canvas Representation */}
            <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
              {/* Map grid background */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage:
                    'radial-gradient(circle at 2px 2px, #38BDF8 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              />

              {/* Road illustration line */}
              <div className="absolute top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-amber-500 via-brand-500 to-emerald-500 rounded-full" />

              {/* Waypoint 1: Restaurant */}
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-900 font-bold flex items-center justify-center shadow-lg">
                  <Store className="w-5 h-5" />
                </div>
                <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white">
                  <div className="text-xs font-bold">{order.restaurantName || 'Kitchen Hub'}</div>
                  <div className="text-[10px] text-slate-400">Preparation Center</div>
                </div>
              </div>

              {/* Waypoint 2: Moving Rider */}
              <div className="relative z-10 flex justify-center items-center">
                <div className="flex items-center gap-2 bg-brand-500 text-white px-3 py-1.5 rounded-2xl shadow-xl animate-bounce">
                  <Bike className="w-4 h-4" />
                  <span className="text-xs font-bold">
                    {order.deliveryPartnerName || 'Rider Assigned'}
                  </span>
                </div>
              </div>

              {/* Waypoint 3: Customer destination */}
              <div className="relative z-10 flex items-center justify-end gap-3">
                <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white text-right">
                  <div className="text-xs font-bold">{order.address.area}</div>
                  <div className="text-[10px] text-slate-400">{order.address.addressLine1}</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white font-bold flex items-center justify-center shadow-lg">
                  <MapPin className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Rider Information card */}
            {order.deliveryPartnerName && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">
                      {order.deliveryPartnerName}
                    </div>
                    <div className="text-xs text-slate-500">
                      Vehicle: KA-47-E-8821 • 4.8 ★ Hero Partner
                    </div>
                  </div>
                </div>

                <a
                  href={`tel:${order.deliveryPartnerPhone || '+919448855667'}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Rider</span>
                </a>
              </div>
            )}
          </div>

          {/* REAL-TIME PROGRESSION STEPPER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-base font-bold text-slate-900 mb-6">Order Status Timeline</h3>

            <div className="space-y-6 relative pl-6 border-l-2 border-slate-200">
              {steps.map((step) => {
                const stepIdx = statusOrder.indexOf(step.key);
                const isPastOrCurrent = currentIndex >= stepIdx && !isCancelled;
                const isCurrent = order.status === step.key;

                return (
                  <div key={step.key} className="relative">
                    {/* Stepper bullet */}
                    <div
                      className={`absolute -left-[31px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs transition-all ${
                        isPastOrCurrent
                          ? 'bg-brand-500 text-white ring-4 ring-brand-100'
                          : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {isPastOrCurrent ? <CheckCircle2 className="w-3.5 h-3.5" /> : '•'}
                    </div>

                    <div>
                      <div
                        className={`text-sm font-bold flex items-center gap-2 ${
                          isPastOrCurrent ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        <span>{step.label}</span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 uppercase">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                );
              })}

              {/* Cancellation policy handling */}
              {!isDelivered && !isCancelled && currentIndex <= 2 && (
                <div className="pt-4 mt-6 border-t border-slate-100">
                  <button
                    onClick={handleCancelOrder}
                    className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition"
                  >
                    Cancel Order
                  </button>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Free cancellation is allowed before preparation begins.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Printable Receipt / Bill Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4 print:shadow-none print:border-none">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="font-black text-lg text-slate-900">Zestora Receipt</div>
                <div className="text-[11px] text-slate-400">GST Invoice & Order Summary</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800">{order.orderNumber}</div>
                <div className="text-[10px] text-slate-400">Payment: {order.paymentMethod}</div>
              </div>
            </div>

            {/* Items list */}
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start text-xs">
                  <div>
                    <div className="font-bold text-slate-800">
                      {item.quantity}x {item.name}
                    </div>
                    {item.variantName && (
                      <div className="text-[10px] text-slate-500">{item.variantName}</div>
                    )}
                    {item.addons && (
                      <div className="text-[10px] text-slate-400">{item.addons.join(', ')}</div>
                    )}
                  </div>
                  <div className="font-bold text-slate-900">
                    {formatCurrency(item.totalPrice)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Ledger */}
            <div className="pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Packaging Fee</span>
                <span>{formatCurrency(order.packagingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Convenience</span>
                <span>{formatCurrency(order.platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes (GST 5%)</span>
                <span>{formatCurrency(order.taxes)}</span>
              </div>
              {order.tip > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Rider Tip</span>
                  <span>+{formatCurrency(order.tip)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total Paid</span>
                <span className="text-brand-600">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-100">
              FSSAI Lic No: 11223998877665 • Bhatkal Food Delivery Cluster
            </div>
          </div>
        </div>
      </div>

      {/* POST DELIVERY REVIEW MODAL */}
      {reviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Rate Your Feast Experience</h3>
            <p className="text-xs text-slate-500">
              How was your order from {order.restaurantName || 'Zestora'}?
            </p>

            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Food Quality (Taste & Portion)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFoodRating(s)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        foodRating >= s ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Packaging & Spill-Proof Seal
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPackagingRating(s)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        packagingRating >= s ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Delivery Hero Speed & Politeness
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDeliveryRating(s)}
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        deliveryRating >= s ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Comments (Optional)
                </label>
                <textarea
                  placeholder="Tell others what you loved about this order..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 text-xs border rounded-xl"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-sm hover:bg-brand-600"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
