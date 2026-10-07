import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import type { Checkout, Order } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { money } from '../lib/format';
import { openRazorpay } from '../lib/razorpay';
import { ErrorBox } from './ui';

/** Shown on an unpaid order. Starts checkout on the server (amount comes from the stored order) and completes payment. */
export default function PaymentPanel({ order }: { order: Order }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [mockCheckout, setMockCheckout] = useState<Checkout | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: ['order', String(order.id)] });

  const pay = useMutation({
    mutationFn: async () => {
      const co = await api<Checkout>(`/payments/${order.id}/checkout`, { method: 'POST' });
      if (co.mock) {
        setMockCheckout(co);
        return;
      }
      const res = await openRazorpay({
        key: co.keyId,
        order_id: co.providerOrderId,
        amount: co.amountPaise,
        currency: co.currency,
        name: 'Zestora',
        description: `Order ${order.orderNumber}`,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#e8590c' },
      });
      await api(`/payments/${order.id}/verify`, {
        method: 'POST',
        body: { razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature },
      });
    },
    onSuccess: refresh,
  });

  const simulate = useMutation({
    mutationFn: () => api(`/payments/${order.id}/simulate`, { method: 'POST' }),
    onSuccess: () => {
      setMockCheckout(null);
      refresh();
    },
  });

  return (
    <div className="card border-brand bg-brand-light" aria-label="Payment">
      <p className="font-semibold">Complete your payment to confirm this order</p>
      <p className="mb-3 text-sm text-stone-600">Unpaid orders are cancelled automatically after 30 minutes.</p>
      {mockCheckout ? (
        <div className="space-y-2">
          <p className="rounded bg-amber-100 p-2 text-sm text-amber-900">
            Test mode: no payment keys are configured on the server, so no real payment window is available.
          </p>
          <button className="btn-primary" disabled={simulate.isPending} onClick={() => simulate.mutate()}>
            Simulate successful payment ({money(order.total)})
          </button>
        </div>
      ) : (
        <button className="btn-primary" disabled={pay.isPending} onClick={() => pay.mutate()}>
          {pay.isPending ? 'Starting…' : `Pay ${money(order.total)}`}
        </button>
      )}
      {pay.error ? <div className="mt-2"><ErrorBox error={pay.error} /></div> : null}
      {simulate.error ? <div className="mt-2"><ErrorBox error={simulate.error} /></div> : null}
    </div>
  );
}
