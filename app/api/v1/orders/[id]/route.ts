import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser } from '@/server/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authUser = getAuthenticatedUser(request);
    const order = zestoraStore.getOrderById(params.id);
    if (!order) {
      return NextResponse.json(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // IDOR Protection: If requester is a customer, verify ownership
    if (authUser && authUser.role === 'CUSTOMER' && order.customerId !== authUser.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'HTTP 403 FORBIDDEN: You do not have permission to view another customer\'s order.',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status, note, rejectionReason } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    const result = zestoraStore.updateOrderStatus(params.id, status, note, rejectionReason);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.order,
      message: `Order transitioned to ${status}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update order' },
      { status: 500 }
    );
  }
}
