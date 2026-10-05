import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { getAuthenticatedUser } from '@/server/auth';

export async function GET(request: Request) {
  try {
    const authUser = getAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get('restaurantId');
    const status = searchParams.get('status');

    let orders = zestoraStore.getOrders();

    // CUSTOMER DATA ISOLATION:
    // If the authenticated user is a CUSTOMER, strictly return only their own orders!
    if (authUser && authUser.role === 'CUSTOMER') {
      orders = orders.filter((o) => o.customerId === authUser.id);
    } else {
      const customerId = searchParams.get('customerId');
      if (customerId) {
        orders = orders.filter((o) => o.customerId === customerId);
      }
    }

    if (restaurantId) {
      orders = orders.filter((o) => o.restaurantId === restaurantId);
    }
    if (status) {
      orders = orders.filter((o) => o.status === status);
    }

    return NextResponse.json({
      success: true,
      data: orders,
      total: orders.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authUser = getAuthenticatedUser(request);
    const payload = await request.json();

    if (!payload.items || payload.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Cart items cannot be empty' },
        { status: 400 }
      );
    }

    if (!payload.address) {
      return NextResponse.json(
        { success: false, message: 'Delivery address is required' },
        { status: 400 }
      );
    }

    // Attach authenticated user information
    if (authUser) {
      payload.customerId = authUser.id;
      payload.customerName = authUser.name;
      payload.customerPhone = authUser.phone;
    }

    const result = zestoraStore.createOrder(payload);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.order,
      message: 'Order created, awaiting payment verification',
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
