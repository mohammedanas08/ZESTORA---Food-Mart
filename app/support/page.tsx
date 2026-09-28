'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  ArrowLeft,
  LifeBuoy,
} from 'lucide-react';
import { SupportTicket } from '@/types';
import { formatDateTime } from '@/lib/utils';

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [category, setCategory] = useState<string>('ORDER_ISSUE');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/v1/support');
      const data = await res.json();
      if (data.success && data.data) {
        setTickets(data.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/v1/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });
      const data = await res.json();
      if (data.success) {
        setSubject('');
        setMessage('');
        setSuccessMsg(`Ticket ${data.data.ticketId} logged successfully! Our team is on it.`);
        fetchTickets();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (e) {
      alert('Failed to register support ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-brand-600 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
        <span>/</span>
        <span className="text-slate-900 font-semibold">24x7 Customer Support</span>
      </div>

      <div className="space-y-2 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>Priority Care Desk</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          How can we help you today?
        </h1>
        <p className="text-xs text-slate-500">
          Have questions about your delivery, order quality, or refund? We resolve 95% of issues in under 10 minutes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Create Ticket Form */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-card space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-500" />
            <span>Open a Support Ticket</span>
          </h2>

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreateTicket} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Issue Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
              >
                <option value="ORDER_ISSUE">Order Issue / Delayed Delivery</option>
                <option value="PAYMENT_ISSUE">Payment / UPI Deduction Issue</option>
                <option value="MISSING_ITEM">Missing Item from Bag</option>
                <option value="WRONG_ITEM">Wrong Item Delivered</option>
                <option value="REFUND_ISSUE">Refund & Cancellation Request</option>
                <option value="RESTAURANT_ISSUE">Food Quality / Packaging Feedback</option>
                <option value="OTHER">General Inquiry</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Order arrived cold / missing raita"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Detailed Message</label>
              <textarea
                placeholder="Explain the issue so our operations desk can assist immediately..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                rows={4}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-sm transition active:scale-98 disabled:opacity-50"
            >
              {isSubmitting ? 'Logging Ticket...' : 'Submit Support Request &rarr;'}
            </button>
          </form>
        </div>

        {/* Existing Tickets */}
        <div className="md:col-span-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900">Your Recent Tickets</h2>

          {tickets.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-card">
              <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">No active tickets</div>
              <p className="text-[11px] text-slate-400 mt-0.5">All your orders are in good standing!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-brand-600">{t.ticketId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="font-bold text-xs text-slate-900">{t.subject}</div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {t.messages.map((m, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl text-[11px] ${
                          m.sender.includes('Support')
                            ? 'bg-brand-50 text-brand-900'
                            : 'bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="font-bold text-[10px] text-slate-500 mb-0.5">{m.sender}:</div>
                        <div>{m.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
