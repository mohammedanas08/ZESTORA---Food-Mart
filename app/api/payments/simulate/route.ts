import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser, canViewOrder, unauthorized, forbidden } from '@/server/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'orderId is required' },
        { status: 400 }
      );
    }

    const order = zestoraStore.getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const authUser = getAuthenticatedUser(request);
    if (!authUser) return unauthorized();
    if (!canViewOrder(authUser, order)) return forbidden('You do not have access to this order.');
    // Demo-only endpoint: marks an order as paid WITHOUT a real payment. Disabled in production.
    if (process.env.NODE_ENV === 'production' || process.env.ALLOW_PAYMENT_SIMULATION === 'false') {
      return forbidden('Payment simulation is disabled.');
    }
    if (order.customerId !== authUser.id) return forbidden('Only the order owner can simulate payment.');

    const testPaymentId = `pay_test_${Date.now().toString(36)}_${Math.floor(1000 + Math.random() * 9000)}`;

    const result = zestoraStore.updatePaymentStatus(orderId, 'PAID', {
      razorpayPaymentId: testPaymentId,
      razorpayOrderId: order.razorpayOrderId,
      razorpaySignature: 'sim_sig_valid',
    });

    return NextResponse.json({
      success: true,
      message: 'Simulated UPI payment verified successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        paymentId: testPaymentId,
        amount: order.totalAmount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Payment simulation failed' },
      { status: 500 }
    );
  }
}
