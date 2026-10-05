import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { requireAdmin } from '@/server/auth';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const updated = zestoraStore.updateProduct(params.id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, message: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Product updated successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update product' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const success = zestoraStore.deleteProduct(params.id);
  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Product not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    message: 'Product deleted successfully',
  });
}
