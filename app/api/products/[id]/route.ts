import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const product = zestoraStore.getProductById(params.id);
  if (!product) {
    return NextResponse.json(
      { success: false, message: 'Product not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    data: product,
  });
}
