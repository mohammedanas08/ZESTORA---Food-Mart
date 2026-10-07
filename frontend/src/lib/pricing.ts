/**
 * Client-side ESTIMATE of the bill, shown before the order is placed.
 * It mirrors backend PricingEngine (defaults: delivery ₹40, free from ₹499, platform ₹5, packaging ₹15 for food, GST 5%).
 * The server recomputes everything from database prices; the order screen always shows the server's numbers.
 */
export interface Estimate {
  subtotal: number;
  packagingFee: number;
  deliveryFee: number;
  platformFee: number;
  tax: number;
  discount: number;
  tip: number;
  total: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function estimateBill(subtotal: number, grocery: boolean, tip: number, discount: number): Estimate {
  const packagingFee = grocery ? 0 : 15;
  const deliveryFee = subtotal >= 499 ? 0 : 40;
  const platformFee = 5;
  const tax = round2((subtotal + packagingFee) * 0.05);
  const total = Math.max(0, round2(subtotal + packagingFee + deliveryFee + platformFee + tax + tip - discount));
  return { subtotal: round2(subtotal), packagingFee, deliveryFee, platformFee, tax, discount: round2(discount), tip, total };
}
