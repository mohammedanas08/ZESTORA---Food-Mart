'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tag, Percent, CheckCircle2, ArrowLeft, Sparkles, Copy } from 'lucide-react';
import { SEED_COUPONS } from '@/server/seedData';
import { useCart } from '@/lib/cartContext';

export default function OffersPage() {
  const { applyCoupon } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleApply = (code: string) => {
    applyCoupon(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">Active Deals & Coupons</span>
      </div>

      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Save big on your next meal</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Deals & Promotional Codes
        </h1>
        <p className="text-xs text-slate-500">
          Apply these verified discount vouchers directly at checkout
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SEED_COUPONS.map((coupon) => (
          <div
            key={coupon.id}
            className="bg-white rounded-3xl p-6 border-2 border-dashed border-amber-300 shadow-card hover:shadow-lg transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black shadow-md">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <div className="font-mono font-black text-lg text-slate-900 tracking-wider">
                    {coupon.code}
                  </div>
                  <div className="text-xs text-brand-600 font-bold">
                    {coupon.type === 'FREE_DELIVERY' ? 'Zero Delivery Fee' : `${coupon.discountValue}% DISCOUNT`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApply(coupon.code)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  copiedCode === coupon.code
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {copiedCode === coupon.code ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Applied to Cart
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Apply Code
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{coupon.description}</p>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Min Order: ₹{coupon.minimumOrder}</span>
              {coupon.maxDiscount && <span>Max Discount: ₹{coupon.maxDiscount}</span>}
              <span className="text-emerald-600 font-semibold">Active in Bhatkal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
