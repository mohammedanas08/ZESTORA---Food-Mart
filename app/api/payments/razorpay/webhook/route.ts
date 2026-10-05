import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { razorpayService } from '@/server/services/razorpayService';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // 1. Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const paymentId = paymentEntity?.id || payload.payment_id;
    const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id;
    const zestoraOrderId = paymentEntity?.notes?.zestoraOrderId || orderEntity?.notes?.zestoraOrderId;

    // 2. Guarantee Idempotency
    if (paymentId && razorpayService.isPaymentProcessed(paymentId)) {
      return NextResponse.json({
        success: true,
        message: 'Webhook event already processed (idempotent)',
      });
    }

    // 3. Process event
    if (event === 'payment.captured' || event === 'order.paid') {
      if (zestoraOrderId) {
        zestoraStore.updatePaymentStatus(zestoraOrderId, 'PAID', {
          razorpayPaymentId: paymentId,
          razorpayOrderId,
        });
      } else if (razorpayOrderId) {
        // Find order by razorpayOrderId
        const allOrders = zestoraStore.getOrders();
        const matched = allOrders.find((o) => o.razorpayOrderId === razorpayOrderId);
        if (matched) {
          zestoraStore.updatePaymentStatus(matched.id, 'PAID', {
            razorpayPaymentId: paymentId,
            razorpayOrderId,
          });
        }
      }

      if (paymentId) {
        razorpayService.markPaymentProcessed(paymentId);
      }
    } else if (event === 'payment.failed') {
      if (zestoraOrderId) {
        zestoraStore.updatePaymentStatus(zestoraOrderId, 'FAILED', {
          razorpayPaymentId: paymentId,
          razorpayOrderId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Webhook event ${event} handled successfully`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
