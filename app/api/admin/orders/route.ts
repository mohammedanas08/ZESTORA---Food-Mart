import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { requireAdmin } from '@/server/auth';

export async function GET(request: Request) {
  // Strict backend authorization: must be ADMIN
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const orders = zestoraStore.getOrders();
  return NextResponse.json({
    success: true,
    data: orders,
    total: orders.length,
  });
}
