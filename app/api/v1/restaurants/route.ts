import { NextResponse } from 'next/server';
import { zestoraStore } from '@/server/dataStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase();
    const cuisine = searchParams.get('cuisine')?.toLowerCase();
    const minRating = parseFloat(searchParams.get('rating') || '0');
    const vegOnly = searchParams.get('veg') === 'true';

    let restaurants = zestoraStore.getRestaurants();

    if (query) {
      restaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.cuisine.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          r.menuCategories?.some((cat) =>
            cat.items.some((item) => item.name.toLowerCase().includes(query))
          )
      );
    }

    if (cuisine) {
      restaurants = restaurants.filter((r) => r.cuisine.toLowerCase().includes(cuisine));
    }

    if (minRating > 0) {
      restaurants = restaurants.filter((r) => r.rating >= minRating);
    }

    if (vegOnly) {
      restaurants = restaurants.filter((r) =>
        r.menuCategories?.some((cat) => cat.items.some((item) => item.isVeg))
      );
    }

    return NextResponse.json({
      success: true,
      data: restaurants,
      total: restaurants.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch restaurants' },
      { status: 500 }
    );
  }
}
