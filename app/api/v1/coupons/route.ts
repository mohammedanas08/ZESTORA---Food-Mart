import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET() {
  try {
    const coupons = zestoraStore.getCoupons();
    return NextResponse.json({ success: true, data: coupons });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch coupons' },
      { status: 500 }
    );
  }
}
