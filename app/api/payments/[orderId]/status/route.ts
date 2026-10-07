import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser, canViewOrder, unauthorized, forbidden } from '@/server/auth';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = zestoraStore.getOrderById(params.orderId);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    const authUser = getAuthenticatedUser(request);
    if (!authUser) return unauthorized();
    if (!canViewOrder(authUser, order)) return forbidden('You do not have access to this order.');

    return NextResponse.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: order.paymentStatus,
        orderStatus: order.status,
        amount: order.totalAmount,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        qrString: order.razorpayQrString,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}
