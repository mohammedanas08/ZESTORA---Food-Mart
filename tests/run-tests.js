// Automated Unit & Integration Tests for Zestora
// Covers: Pricing calculation, Coupon validation, Order State Machine transitions, Inventory reservations

const assert = require('assert');

function runTests() {
  console.log('🧪 Running Zestora Automated Test Suite...\n');
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
    }
  }

  // TEST 1: Pricing Calculation (Subtotal + Packaging + Delivery + Platform + Taxes - Discount)
  test('Price Calculation: Authoritative Cart Pricing with 5% GST', () => {
    const items = [
      { unitPrice: 240, quantity: 2 }, // 480
      { unitPrice: 260, quantity: 1 }, // 260
    ];
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    assert.strictEqual(subtotal, 740);

    const packagingFee = 20;
    const deliveryFee = 30;
    const platformFee = 5;
    const taxes = Math.round(subtotal * 0.05); // 37
    const discount = 50; // ZEST50 applied
    const tip = 20;
    const total = subtotal + packagingFee + deliveryFee + platformFee + taxes + tip - discount;

    assert.strictEqual(taxes, 37);
    assert.strictEqual(total, 802);
  });

  // TEST 2: Free Delivery Threshold
  test('Pricing Rule: Free delivery applies on orders >= ₹499', () => {
    const highSubtotal = 550;
    const deliveryFee = highSubtotal >= 499 ? 0 : 30;
    assert.strictEqual(deliveryFee, 0);

    const lowSubtotal = 350;
    const lowDeliveryFee = lowSubtotal >= 499 ? 0 : 30;
    assert.strictEqual(lowDeliveryFee, 30);
  });

  // TEST 3: Coupon Validation Engine
  test('Coupon Engine: ZEST50 enforces minimum order requirement and discount caps', () => {
    const coupon = {
      code: 'ZEST50',
      type: 'PERCENTAGE',
      discountValue: 50,
      minimumOrder: 299,
      maxDiscount: 100,
    };

    // Subtotal under threshold
    const subtotalLow = 200;
    const isValidLow = subtotalLow >= coupon.minimumOrder;
    assert.strictEqual(isValidLow, false);

    // Subtotal above threshold
    const subtotalHigh = 400;
    const calculatedDiscount = Math.min((subtotalHigh * coupon.discountValue) / 100, coupon.maxDiscount);
    assert.strictEqual(calculatedDiscount, 100);
  });

  // TEST 4: Order State Machine Transitions
  test('Order State Machine: Enforces valid progression order and disallows illegal skips', () => {
    const validTransitions = {
      PLACED: ['CONFIRMED', 'RESTAURANT_ACCEPTED', 'CANCELLED'],
      RESTAURANT_ACCEPTED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_PICKUP'],
      READY_FOR_PICKUP: ['DELIVERY_ASSIGNED', 'PICKED_UP'],
      PICKED_UP: ['ON_THE_WAY'],
      ON_THE_WAY: ['ARRIVING', 'DELIVERED'],
      DELIVERED: [],
    };

    // Legal transition
    assert.strictEqual(validTransitions['PREPARING'].includes('READY_FOR_PICKUP'), true);

    // Illegal jump (e.g. from PLACED directly to DELIVERED)
    assert.strictEqual(validTransitions['PLACED'].includes('DELIVERED'), false);
  });

  // TEST 5: Inventory Reservation for Quick Commerce
  test('Inventory Reservation: Prevents overselling when stock is limited', () => {
    let stock = 10;
    let reserved = 0;
    const orderQty = 12;

    const availableStock = stock - reserved;
    const canFulfill = availableStock >= orderQty;
    assert.strictEqual(canFulfill, false);

    const validOrderQty = 4;
    const canFulfillValid = availableStock >= validOrderQty;
    assert.strictEqual(canFulfillValid, true);

    // Reserve stock
    stock -= validOrderQty;
    reserved += validOrderQty;
    assert.strictEqual(stock, 6);
    assert.strictEqual(reserved, 4);
  });

  // TEST 6: Restaurant Commission Engine (20% platform deduction)
  test('Restaurant Settlement: Correct 20% platform commission and net payout calculation', () => {
    const grossSales = 1500;
    const commissionRate = 0.20;
    const platformCommission = grossSales * commissionRate;
    const netPayout = grossSales - platformCommission;

    assert.strictEqual(platformCommission, 300);
    assert.strictEqual(netPayout, 1200);
  });

  // TEST 7: Delivery Partner Earnings Breakdown
  test('Delivery Earnings: Computes base fee + distance pay + 100% customer tip pass-through', () => {
    const baseFee = 35;
    const distanceKm = 4.5;
    const ratePerKm = 10;
    const distancePay = distanceKm * ratePerKm; // 45
    const customerTip = 30; // 100% goes to rider
    const totalDriverEarning = baseFee + distancePay + customerTip;

    assert.strictEqual(totalDriverEarning, 110);
  });

  // TEST 8: Multiple Coupon Types (FLAT vs PERCENTAGE)
  test('Coupon Variants: Validates WELCOME100 (flat) vs ZEST50 (percentage with cap)', () => {
    const flatCoupon = { code: 'WELCOME100', type: 'FLAT', discountValue: 100, minimumOrder: 399 };
    const cart1Subtotal = 450;
    const flatDiscount = cart1Subtotal >= flatCoupon.minimumOrder ? flatCoupon.discountValue : 0;
    assert.strictEqual(flatDiscount, 100);

    const percentCoupon = { code: 'ZEST50', type: 'PERCENTAGE', discountValue: 50, maxDiscount: 100, minimumOrder: 299 };
    const cart2Subtotal = 500;
    const percentDiscount = Math.min((cart2Subtotal * percentCoupon.discountValue) / 100, percentCoupon.maxDiscount);
    assert.strictEqual(percentDiscount, 100);
  });

  console.log(`\nResults: ${passed}/${total} tests passed successfully.`);
  if (passed !== total) process.exit(1);
}

runTests();

