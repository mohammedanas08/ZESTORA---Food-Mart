import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { requireAdmin } from '@/server/auth';

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const users = zestoraStore.getUsers();
  return NextResponse.json({
    success: true,
    data: users,
    total: users.length,
  });
}
