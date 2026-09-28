'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Tag,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  Truck,
  HeartHandshake,
  QrCode,
  DollarSign,
  Smartphone,
  Building,
} from 'lucide-react';
import { useCart } from '@/lib/cartContext';
import { formatCurrency } from '@/lib/utils';
import { SEED_SERVICE_AREAS } from '@/server/seedData';
import { Address, PaymentMethod } from '@/types';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    pricing,
    selectedAddress,
    setSelectedAddress,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    tip,
    setTip,
    clearCart,
  } = useCart();

  const [deliveryType, setDeliveryType] = useState<'STANDARD' | 'SCHEDULED'>('STANDARD');
  const [scheduledTime, setScheduledTime] = useState<string>('Tomorrow, 7:30 PM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [couponInput, setCouponInput] = useState<string>('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [customTipInput, setCustomTipInput] = useState<string>('');

  // Editable address form fields
  const [addressForm, setAddressForm] = useState<Address>(selectedAddress);

  // Check serviceability
  const isServiceable = SEED_SERVICE_AREAS.some(
    (a) => a.zoneName.toLowerCase() === selectedAddress.area.toLowerCase() ||
           selectedAddress.city.toLowerCase() === 'bhatkal'
  );

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setCouponSuccess(null);

    const res = await applyCoupon(couponInput);
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedAddress(addressForm);
    setIsEditingAddress(false);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!isServiceable) {
      alert('Selected location is not serviceable yet.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        items,
        address: selectedAddress,
        paymentMethod,
        couponCode: appliedCoupon?.code,
        tip,
        deliveryType,
        scheduledTime: deliveryType === 'SCHEDULED' ? scheduledTime : undefined,
        restaurantId: items[0]?.restaurantId,
        restaurantName: items[0]?.restaurantName,
        groceryStoreId: items[0]?.storeId,
        groceryStoreName: items[0]?.storeId ? 'Zestora QuickMart' : undefined,
      };

      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        clearCart();
        router.push(`/orders/${data.data.id}`);
      } else {
        alert(data.message || 'Failed to place order. Please review items.');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      alert(error.message || 'Network error placing order');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Your Basket is Empty</h2>
        <p className="text-xs text-slate-500 mt-2">
          Add fresh dishes or groceries before heading to checkout!
        </p>
        <Link
          href="/"
          className="mt-5 inline-block px-6 py-3 rounded-2xl bg-brand-500 text-white font-bold text-xs shadow-elevated"
        >
          Explore Zestora
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Dining
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Secure Checkout</span>
      </div>

      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">
        Review & Place Order
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Addresses, Delivery Options, Payments */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. DELIVERY ADDRESS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delivery Address</h3>
                  <p className="text-xs text-slate-500">Where should we deliver your order?</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAddressForm(selectedAddress);
                  setIsEditingAddress(!isEditingAddress);
                }}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1.5 rounded-xl transition"
              >
                {isEditingAddress ? 'Cancel' : 'Change / Edit'}
              </button>
            </div>

            {!isServiceable && (
              <div className="p-4 mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>Zestora is not available at this location yet. Please select a Bhatkal service zone.</span>
              </div>
            )}

            {isEditingAddress ? (
              <form onSubmit={handleSaveAddress} className="space-y-4 pt-2 border-t border-slate-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name</label>
                    <input
                      type="text"
                      value={addressForm.fullName}
                      onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                      className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone Number</label>
                    <input
                      type="text"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Flat / House / Building Details</label>
                  <input
                    type="text"
                    value={addressForm.addressLine1}
                    onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Area / Zone</label>
                    <select
                      value={addressForm.area}
                      onChange={(e) => setAddressForm({ ...addressForm, area: e.target.value })}
                      className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl bg-white"
                    >
                      {SEED_SERVICE_AREAS.map((a) => (
                        <option key={a.id} value={a.zoneName}>
                          {a.zoneName} ({a.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Postal Code</label>
                    <input
                      type="text"
                      value={addressForm.postalCode}
                      onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                      className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Delivery Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Call before arrival, leave with security"
                    value={addressForm.deliveryInstructions || ''}
                    onChange={(e) => setAddressForm({ ...addressForm, deliveryInstructions: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 text-xs border rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs shadow-sm hover:bg-brand-600 transition"
                >
                  Save Address & Update
                </button>
              </form>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">
                      {selectedAddress.fullName}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-100 text-brand-700 uppercase">
                      {selectedAddress.label}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    {selectedAddress.addressLine1}, {selectedAddress.area}, {selectedAddress.city} - {selectedAddress.postalCode}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Phone: {selectedAddress.phone}
                  </div>
                  {selectedAddress.deliveryInstructions && (
                    <div className="text-[11px] text-slate-400 italic mt-1.5">
                      Note: {selectedAddress.deliveryInstructions}
                    </div>
                  )}
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>

          {/* 2. DELIVERY OPTION (Standard vs Scheduled) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delivery Schedule</h3>
                <p className="text-xs text-slate-500">Select when you want to receive your feast</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                onClick={() => setDeliveryType('STANDARD')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  deliveryType === 'STANDARD'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">Standard Delivery</div>
                  <div className="text-xs text-slate-500 mt-0.5">Dispatched immediately (25–35 min)</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    deliveryType === 'STANDARD' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                  }`}
                >
                  {deliveryType === 'STANDARD' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </label>

              <label
                onClick={() => setDeliveryType('SCHEDULED')}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  deliveryType === 'SCHEDULED'
                    ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">Schedule For Later</div>
                  <div className="text-xs text-slate-500 mt-0.5">Pre-order for dinner or tomorrow</div>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    deliveryType === 'SCHEDULED' ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                  }`}
                >
                  {deliveryType === 'SCHEDULED' && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </label>
            </div>

            {deliveryType === 'SCHEDULED' && (
              <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in duration-150">
                <label className="text-xs font-bold text-slate-700">Select Preferred Delivery Slot:</label>
                <select
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 text-xs border rounded-xl bg-white"
                >
                  <option value="Today, 8:30 PM">Today, 8:30 PM (Dinner Rush)</option>
                  <option value="Today, 9:30 PM">Today, 9:30 PM (Late Dinner)</option>
                  <option value="Tomorrow, 1:00 PM">Tomorrow, 1:00 PM (Lunch)</option>
                  <option value="Tomorrow, 7:30 PM">Tomorrow, 7:30 PM (Dinner)</option>
                </select>
              </div>
            )}
          </div>

          {/* 3. TIP YOUR DELIVERY PARTNER */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Say Thanks with a Tip</h3>
                <p className="text-xs text-slate-500">100% of your tip goes directly to the delivery hero</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4">
              {[0, 10, 20, 30].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    setTip(amount);
                    setCustomTipInput('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    tip === amount && !customTipInput
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {amount === 0 ? 'No Tip' : `₹${amount}`}
                </button>
              ))}

              <div className="flex items-center gap-1">
                <input
                  type="number"
                  placeholder="Custom ₹"
                  value={customTipInput}
                  onChange={(e) => {
                    setCustomTipInput(e.target.value);
                    const val = parseInt(e.target.value) || 0;
                    setTip(Math.max(0, val));
                  }}
                  className="w-24 px-3 py-1.5 text-xs border rounded-xl bg-slate-50"
                />
              </div>
            </div>
          </div>

          {/* 4. PAYMENT METHOD */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Payment Option</h3>
                <p className="text-xs text-slate-500">Provider-independent mock & live payment engine</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  id: 'UPI' as PaymentMethod,
                  title: 'UPI (Instant & Zero Fee)',
                  desc: 'Google Pay, PhonePe, Paytm, BHIM QR',
                  icon: <QrCode className="w-5 h-5 text-emerald-600" />,
                },
                {
                  id: 'CARD' as PaymentMethod,
                  title: 'Credit / Debit Card',
                  desc: 'Visa, Mastercard, RuPay (Encrypted via Gateway)',
                  icon: <CreditCard className="w-5 h-5 text-blue-600" />,
                },
                {
                  id: 'NET_BANKING' as PaymentMethod,
                  title: 'Net Banking',
                  desc: 'HDFC, SBI, ICICI, Canara Bank',
                  icon: <Building className="w-5 h-5 text-purple-600" />,
                },
                {
                  id: 'CASH_ON_DELIVERY' as PaymentMethod,
                  title: 'Cash on Delivery (COD)',
                  desc: 'Pay cash or UPI upon handover',
                  icon: <DollarSign className="w-5 h-5 text-amber-600" />,
                },
              ].map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <label
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50/50 shadow-sm'
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                        {m.icon}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900">{m.title}</div>
                        <div className="text-[11px] text-slate-500">{m.desc}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Order summary, Coupon & Place Order */}
        <div className="lg:col-span-4 space-y-6">
          {/* Coupon applicator */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-500" />
              <span>Apply Coupons & Promo</span>
            </h3>

            {appliedCoupon ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>'{appliedCoupon.code}' Applied</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    You saved {formatCurrency(pricing.discount)}!
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-red-600 hover:text-red-800 font-bold px-2 py-1"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ZEST50 or FREEDEL"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2 text-xs uppercase font-bold border rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="text-[11px] text-red-600 font-medium">{couponError}</p>
                )}
                {couponSuccess && (
                  <p className="text-[11px] text-emerald-600 font-medium">{couponSuccess}</p>
                )}
              </form>
            )}
          </div>

          {/* Detailed Item & Fee Bill Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Bill Details
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal ({items.length})</span>
                <span className="font-bold text-slate-900">{formatCurrency(pricing.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Restaurant Packaging Fee</span>
                <span>{formatCurrency(pricing.packagingFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className={pricing.deliveryFee === 0 ? 'text-emerald-600 font-bold' : ''}>
                  {pricing.deliveryFee === 0 ? 'FREE' : formatCurrency(pricing.deliveryFee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Platform Convenience Fee</span>
                <span>{formatCurrency(pricing.platformFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST & Government Taxes (5%)</span>
                <span>{formatCurrency(pricing.taxes)}</span>
              </div>

              {tip > 0 && (
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Rider Tip</span>
                  <span>+{formatCurrency(tip)}</span>
                </div>
              )}

              {pricing.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>- {formatCurrency(pricing.discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-black text-slate-900">
                <span>Total Payable Amount</span>
                <span className="text-brand-600">{formatCurrency(pricing.total)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Authoritative Server-Validated Totals</span>
              </div>
              <p>Prices and inventory reserved automatically upon order confirmation.</p>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting || !isServiceable}
              className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-elevated flex items-center justify-between px-6 transition active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? 'Placing Order...' : 'Pay & Place Order'}</span>
              <span>{formatCurrency(pricing.total)} &rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
