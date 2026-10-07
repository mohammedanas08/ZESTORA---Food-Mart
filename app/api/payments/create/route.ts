import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser, canViewOrder, unauthorized, forbidden } from '@/server/auth';
import { razorpayService } from '@/server/services/razorpayService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Order ID is required' },
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

    // Authoritative calculation from server-side order totalAmount
    // Never trust frontend-supplied amounts!
    const result = await razorpayService.createOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountInRupees: order.totalAmount,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
    });

    // Attach Razorpay references to order in store
    order.razorpayOrderId = result.razorpayOrderId;
    order.razorpayQrString = result.qrString;

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        razorpayOrderId: result.razorpayOrderId,
        amountInPaise: result.amountInPaise,
        amountInRupees: result.amountInRupees,
        currency: result.currency,
        qrString: result.qrString,
        keyId: result.keyId,
        paymentStatus: order.paymentStatus,
        isTestMode: result.isTestMode,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create payment order' },
      { status: 500 }
    );
  }
}
