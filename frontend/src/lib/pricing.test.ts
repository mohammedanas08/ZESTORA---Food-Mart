import { describe, expect, it } from 'vitest';
import { estimateBill } from './pricing';
import { money } from './format';

// The expected numbers are the same ones asserted in backend PricingEngineTest, so UI and server stay in step.
describe('estimateBill', () => {
  it('free delivery from ₹499, GST on items + packaging', () => {
    const b = estimateBill(740, false, 20, 50);
    expect(b.deliveryFee).toBe(0);
    expect(b.tax).toBe(37.75);
    expect(b.total).toBe(767.75);
  });

  it('charges ₹40 delivery below the threshold', () => {
    const b = estimateBill(300, false, 0, 0);
    expect(b.deliveryFee).toBe(40);
    expect(b.total).toBe(375.75);
  });

  it('threshold boundary', () => {
    expect(estimateBill(499, false, 0, 0).deliveryFee).toBe(0);
    expect(estimateBill(498.99, false, 0, 0).deliveryFee).toBe(40);
  });

  it('grocery has no packaging fee', () => {
    const b = estimateBill(200, true, 0, 0);
    expect(b.packagingFee).toBe(0);
    expect(b.total).toBe(255);
  });

  it('never goes below zero', () => {
    expect(estimateBill(100, false, 0, 10000).total).toBe(0);
  });
});

describe('money', () => {
  it('formats rupees without trailing zeros for whole numbers', () => {
    expect(money(40)).toBe('₹40');
    expect(money(37.75)).toBe('₹37.75');
    expect(money(undefined)).toBe('₹0');
  });
});
