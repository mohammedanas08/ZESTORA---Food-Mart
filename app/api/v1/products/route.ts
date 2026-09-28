import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category')?.toLowerCase();
    const query = searchParams.get('q')?.toLowerCase();

    let products = zestoraStore.getProducts();

    if (category && category !== 'all') {
      products = products.filter((p) => p.categoryName.toLowerCase().includes(category));
    }

    if (query) {
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.categoryName.toLowerCase().includes(query) ||
          p.brand?.toLowerCase().includes(query)
      );
    }

    return NextResponse.json({
      success: true,
      store: zestoraStore.getGroceryStore(),
      data: products,
      total: products.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
