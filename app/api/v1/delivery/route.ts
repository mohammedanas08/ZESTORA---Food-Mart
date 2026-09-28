import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET() {
  try {
    const partners = zestoraStore.getDeliveryPartners();
    return NextResponse.json({ success: true, data: partners });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch delivery partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { partnerId } = await request.json();
    if (!partnerId) {
      return NextResponse.json(
        { success: false, message: 'Partner ID is required' },
        { status: 400 }
      );
    }
    const updated = zestoraStore.togglePartnerOnline(partnerId);
    return NextResponse.json({ success: updated, message: 'Partner online status updated' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update partner' },
      { status: 500 }
    );
  }
}
