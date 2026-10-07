import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser, canViewOrder, checkOrderTransition, unauthorized, forbidden } from '@/server/auth';

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

    if (!authUser) return unauthorized();
    // IDOR protection: only people involved in the order (or admins) may view it.
    if (!canViewOrder(authUser, order)) return forbidden("You do not have permission to view this order.");

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
    const authUser = getAuthenticatedUser(request);
    if (!authUser) return unauthorized();

    const body = await request.json();
    const { status, note, rejectionReason } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    const existing = zestoraStore.getOrderById(params.id);
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }
    const denied = checkOrderTransition(authUser, existing, status);
    if (denied) return forbidden(denied);

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
