import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const restaurant = zestoraStore.getRestaurantById(params.id);
    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: 'Restaurant not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: restaurant });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch restaurant' },
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
    if (typeof body.isOpen === 'boolean') {
      const updated = zestoraStore.updateRestaurantStatus(params.id, body.isOpen);
      if (!updated) {
        return NextResponse.json(
          { success: false, message: 'Restaurant not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Restaurant status updated to ${body.isOpen ? 'OPEN' : 'CLOSED'}`,
      });
    }
    return NextResponse.json(
      { success: false, message: 'Invalid payload' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}
