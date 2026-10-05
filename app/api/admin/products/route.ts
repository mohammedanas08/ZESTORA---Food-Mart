import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';
import { requireAdmin } from '@/server/auth';

export async function GET(request: Request) {
  // Strict backend role authorization
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const products = zestoraStore.getProducts();
  return NextResponse.json({
    success: true,
    data: products,
    total: products.length,
  });
}

export async function POST(request: Request) {
  const auth = requireAdmin(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  try {
    const body = await request.json();
    const product = zestoraStore.addProduct(body);
    return NextResponse.json(
      {
        success: true,
        data: product,
        message: 'Product added successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to add product' },
      { status: 500 }
    );
  }
}
