import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET() {
  try {
    const tickets = zestoraStore.getSupportTickets();
    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.category || !body.subject || !body.message) {
      return NextResponse.json(
        { success: false, message: 'Category, subject, and message are required' },
        { status: 400 }
      );
    }
    const ticket = zestoraStore.createSupportTicket(body);
    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Support ticket registered successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create ticket' },
      { status: 500 }
    );
  }
}
