import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET() {
  try {
    const reviews = zestoraStore.getReviews();
    return NextResponse.json({ success: true, data: reviews });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.orderId || !body.restaurantId || !body.foodRating) {
      return NextResponse.json(
        { success: false, message: 'Missing required review fields' },
        { status: 400 }
      );
    }
    const review = zestoraStore.addReview(body);
    return NextResponse.json({ success: true, data: review, message: 'Review submitted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}
