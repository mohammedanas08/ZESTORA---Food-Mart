import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/server/auth';

export async function GET(request: Request) {
  try {
    const user = getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        authenticated: false,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to check session' },
      { status: 500 }
    );
  }
}
