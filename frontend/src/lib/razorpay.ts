interface RazorpayOptions {
  key: string;
  order_id: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color: string };
  handler: (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => { open(): void; on(ev: string, cb: (r: unknown) => void): void };
  }
}

let loading: Promise<void> | null = null;

/** Loads Razorpay's checkout.js once, only when a real payment is about to start. */
export function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => {
        loading = null;
        reject(new Error('Could not load the payment window. Check your connection.'));
      };
      document.body.appendChild(s);
    });
  }
  return loading;
}

export async function openRazorpay(opts: Omit<RazorpayOptions, 'handler' | 'modal'>): Promise<RazorpayResult> {
  await loadRazorpay();
  return new Promise((resolve, reject) => {
    const rz = new window.Razorpay!({
      ...opts,
      handler: (res) => resolve(res),
      modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
    });
    rz.open();
  });
}

export type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
