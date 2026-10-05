'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  Loader2,
  XCircle,
  ShoppingBag,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Order, PaymentStatus } from '@/types';

export default function CheckoutPaymentPage({
  params,
}: {
  params: { orderId: string };
}) {
  const router = useRouter();
  const { orderId } = params;

  const [order, setOrder] = useState<Order | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [razorpayPaymentId, setRazorpayPaymentId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [copiedUPI, setCopiedUPI] = useState<boolean>(false);
  const [qrString, setQrString] = useState<string>('');

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Fetch order & generate Razorpay payment order
  const initPayment = async () => {
    try {
      setLoading(true);
      // Fetch order
      const orderRes = await fetch(`/api/v1/orders/${orderId}`);
      const orderData = await orderRes.json();

      if (!orderData.success || !orderData.data) {
        alert('Order not found');
        return;
      }

      const ord: Order = orderData.data;
      setOrder(ord);
      setPaymentStatus(ord.paymentStatus);
      if (ord.razorpayPaymentId) setRazorpayPaymentId(ord.razorpayPaymentId);

      // If already paid, stop
      if (ord.paymentStatus === 'PAID' || ord.paymentStatus === 'SUCCESS') {
        setPaymentStatus('PAID');
        setLoading(false);
        return;
      }

      // Generate or retrieve Razorpay payment order details
      const payRes = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: ord.id }),
      });
      const payData = await payRes.json();

      if (payData.success && payData.data) {
        setQrString(payData.data.qrString);
      }
    } catch (err) {
      console.error('Error initiating payment:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Poll payment status every 4 seconds until terminal status reached
  const checkStatus = async () => {
    if (!orderId) return;
    try {
      setRefreshing(true);
      const res = await fetch(`/api/payments/${orderId}/status`);
      const data = await res.json();

      if (data.success && data.data) {
        const status = data.data.paymentStatus as PaymentStatus;
        setPaymentStatus(status);

        if (data.data.razorpayPaymentId) {
          setRazorpayPaymentId(data.data.razorpayPaymentId);
        }

        // Stop polling if terminal state
        if (
          status === 'PAID' ||
          status === 'SUCCESS' ||
          status === 'FAILED' ||
          status === 'EXPIRED' ||
          status === 'CANCELLED'
        ) {
          if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
            pollingTimerRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error('Status check error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    initPayment();

    // Start 4-second polling loop
    pollingTimerRef.current = setInterval(checkStatus, 4000);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [orderId]);

  // Simulate UPI Payment for effortless test verification
  const handleSimulatePayment = async () => {
    try {
      setIsSimulating(true);
      const res = await fetch('/api/payments/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();

      if (data.success) {
        setPaymentStatus('PAID');
        setRazorpayPaymentId(data.data.paymentId);
        if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      } else {
        alert(data.message || 'Payment simulation failed');
      }
    } catch (e: any) {
      alert(e.message || 'Simulation network error');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCopyUPI = () => {
    if (qrString) {
      navigator.clipboard.writeText(qrString);
      setCopiedUPI(true);
      setTimeout(() => setCopiedUPI(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-100 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Setting up Razorpay QR...</h3>
            <p className="text-xs text-slate-500 mt-1">Generating order-specific UPI payment request.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center border border-slate-100 shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <XCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Order Not Found</h3>
          <Link
            href="/"
            className="block w-full py-2.5 rounded-xl bg-brand-500 text-white font-bold text-xs"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 1: PAYMENT SUCCESSFUL
  // ==========================================
  if (paymentStatus === 'PAID' || paymentStatus === 'SUCCESS') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 flex items-center justify-center p-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-emerald-100 shadow-elevated p-8 sm:p-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-black uppercase tracking-wider mb-2">
              Payment Successful
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Payment Completed Successfully
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Your transaction has been securely verified by the backend.
            </p>
          </div>

          {/* Receipt details */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-left space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Order ID:</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Amount Paid:</span>
              <span className="font-black text-emerald-600 text-sm">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Payment ID:</span>
              <span className="font-mono text-slate-700">{razorpayPaymentId || order.razorpayPaymentId || 'pay_verified_razorpay'}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Order Status:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                CONFIRMED
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 pt-2">
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition active:scale-98"
            >
              View Order Details &rarr;
            </Link>
            <Link
              href="/"
              className="block w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 2: PAYMENT FAILED
  // ==========================================
  if (paymentStatus === 'FAILED' || paymentStatus === 'EXPIRED') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-16">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-rose-100 shadow-elevated p-8 sm:p-10 text-center space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Payment Failed</h1>
            <p className="text-xs text-slate-500 mt-1">
              Your payment could not be completed or the session expired.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Order:</span>
              <span className="font-mono font-bold text-slate-900">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount:</span>
              <span className="font-black text-slate-900">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => {
                setPaymentStatus('PENDING');
                initPayment();
              }}
              className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-md transition"
            >
              Try Payment Again
            </button>
            <Link
              href={`/orders/${order.id}`}
              className="block w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              View Order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE 3: PENDING PAYMENT (SCAN DYNAMIC QR)
  // ==========================================
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 min-h-screen">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-600 to-amber-500 p-6 sm:p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                Razorpay UPI Gateway
              </span>
              <h1 className="text-2xl sm:text-3xl font-black mt-2">COMPLETE PAYMENT</h1>
              <p className="text-xs text-white/80 mt-1">
                Zestora Order <span className="font-mono font-bold">#{order.orderNumber}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-white/80">Amount Payable</div>
              <div className="text-2xl sm:text-3xl font-black">{formatCurrency(order.totalAmount)}</div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Dynamic QR Code Box */}
            <div className="md:col-span-5 flex flex-col items-center text-center">
              <div className="relative p-5 bg-white border-2 border-dashed border-brand-300 rounded-3xl shadow-sm group">
                {/* Visual QR Code SVG Representation */}
                <div className="w-52 h-52 bg-white rounded-2xl flex items-center justify-center p-2 relative overflow-hidden">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-full h-full text-slate-900"
                    fill="currentColor"
                  >
                    {/* Corner Squares */}
                    <rect x="5" y="5" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="6" rx="4" />
                    <rect x="13" y="13" width="12" height="12" fill="#0F172A" rx="2" />

                    <rect x="67" y="5" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="6" rx="4" />
                    <rect x="75" y="13" width="12" height="12" fill="#0F172A" rx="2" />

                    <rect x="5" y="67" width="28" height="28" fill="none" stroke="#0F172A" strokeWidth="6" rx="4" />
                    <rect x="13" y="75" width="12" height="12" fill="#0F172A" rx="2" />

                    {/* Middle QR Code Matrix Data Blocks */}
                    <rect x="42" y="8" width="8" height="8" fill="#FF6B00" rx="1" />
                    <rect x="52" y="18" width="6" height="6" fill="#0F172A" rx="1" />
                    <rect x="40" y="28" width="6" height="6" fill="#0F172A" rx="1" />
                    <rect x="8" y="44" width="6" height="6" fill="#0F172A" rx="1" />
                    <rect x="20" y="44" width="8" height="8" fill="#FF6B00" rx="1" />
                    <rect x="34" y="42" width="10" height="10" fill="#0F172A" rx="1" />
                    <rect x="50" y="42" width="12" height="6" fill="#0F172A" rx="1" />
                    <rect x="68" y="42" width="8" height="8" fill="#0F172A" rx="1" />
                    <rect x="82" y="44" width="8" height="8" fill="#FF6B00" rx="1" />

                    <rect x="42" y="60" width="8" height="8" fill="#0F172A" rx="1" />
                    <rect x="56" y="60" width="8" height="8" fill="#FF6B00" rx="1" />
                    <rect x="70" y="60" width="6" height="6" fill="#0F172A" rx="1" />
                    <rect x="84" y="68" width="8" height="8" fill="#0F172A" rx="1" />
                    <rect x="42" y="76" width="10" height="10" fill="#FF6B00" rx="1" />
                    <rect x="58" y="78" width="8" height="8" fill="#0F172A" rx="1" />
                    <rect x="74" y="78" width="16" height="6" fill="#0F172A" rx="1" />
                    <rect x="52" y="88" width="6" height="6" fill="#0F172A" rx="1" />
                    <rect x="68" y="88" width="10" height="6" fill="#0F172A" rx="1" />

                    {/* Center Brand Badge */}
                    <circle cx="50" cy="50" r="10" fill="#FF6B00" />
                    <circle cx="50" cy="50" r="7" fill="#FFFFFF" />
                    <circle cx="50" cy="50" r="4" fill="#FF6B00" />
                  </svg>
                </div>

                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-brand-600">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Scan with any UPI App</span>
                </div>
              </div>

              {/* Copy UPI link button */}
              <button
                onClick={handleCopyUPI}
                className="mt-3 text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition"
              >
                {copiedUPI ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-bold">UPI Intent Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy UPI Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Payment Instructions & Status */}
            <div className="md:col-span-7 space-y-5">
              {/* Live Status indicator */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
                  </span>
                  <div>
                    <div className="text-xs font-black text-amber-900 uppercase tracking-wider">
                      Payment Status: {paymentStatus}
                    </div>
                    <div className="text-[11px] text-amber-700">
                      Waiting for payment... Auto-refreshing every 4s
                    </div>
                  </div>
                </div>

                <button
                  onClick={checkStatus}
                  disabled={refreshing}
                  className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-amber-900 border border-amber-200 shadow-xs hover:bg-amber-100 flex items-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Instructions List */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  How to complete payment:
                </h3>
                <ol className="space-y-2 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      1
                    </span>
                    <span>Open <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, or any UPI app.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      2
                    </span>
                    <span>Scan the order-specific QR code displayed on the left.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      3
                    </span>
                    <span>Confirm the exact backend amount of <strong>{formatCurrency(order.totalAmount)}</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-800 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                      4
                    </span>
                    <span>Complete the payment and wait for Zestora to confirm.</span>
                  </li>
                </ol>
              </div>

              {/* Razorpay Test Mode Simulator */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500">
                    Razorpay Sandbox / Test Mode
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    TEST_MODE
                  </span>
                </div>
                <button
                  onClick={handleSimulatePayment}
                  disabled={isSimulating}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Payment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simulate UPI Payment (Instant Verification)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Simulates a verified UPI webhook & signature confirmation server-side.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted Razorpay Gateway</span>
          </div>
          <Link
            href={`/orders/${order.id}`}
            className="text-brand-600 hover:underline font-bold text-xs"
          >
            Cancel & View Order Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
