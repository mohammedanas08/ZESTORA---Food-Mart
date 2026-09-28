import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) {
      return NextResponse.json(
        { success: false, message: 'Coupon code is required' },
        { status: 400 }
      );
    }
    const result = zestoraStore.validateCoupon(code, subtotal || 0);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Error validating coupon' },
      { status: 500 }
    );
  }
}
