import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { SEED_SERVICE_AREAS } from '@/server/seedData';
import { requireAdmin } from '@/server/auth';

export async function GET(request: Request) {
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const metrics = zestoraStore.getAdminMetrics();
    const auditLogs = zestoraStore.getAuditLogs();
    return NextResponse.json({
      success: true,
      data: {
        metrics,
        auditLogs,
        serviceAreas: SEED_SERVICE_AREAS,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch admin metrics' },
      { status: 500 }
    );
  }
}
