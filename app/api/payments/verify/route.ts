import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { razorpayService } from '@/server/services/razorpayService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayPaymentId) {
      return NextResponse.json(
        { success: false, message: 'orderId and razorpayPaymentId are required' },
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

    // Verify HMAC signature server-side
    const isValid = razorpayService.verifyPaymentSignature({
      razorpayOrderId: razorpayOrderId || order.razorpayOrderId || '',
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      zestoraStore.updatePaymentStatus(orderId, 'FAILED', {
        razorpayPaymentId,
        razorpayOrderId,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'InvalidSignature',
          message: 'Payment verification failed: Signature mismatch. Please retry.',
        },
        { status: 400 }
      );
    }

    // Mark order as PAID and transition to CONFIRMED
    const updateResult = zestoraStore.updatePaymentStatus(orderId, 'PAID', {
      razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || order.razorpayOrderId,
      razorpaySignature,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: 'PAID',
        orderStatus: 'CONFIRMED',
        amount: order.totalAmount,
        paymentId: razorpayPaymentId,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
