import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [product] = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.id, id),
          eq(products.active, true) // Only show active products publicly
        )
      )
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      price_usd: product.priceUsd ? parseFloat(product.priceUsd) : undefined,
      currency: product.currency,
      images: product.images,
      // Don't expose metadata publicly
      created: Math.floor(product.createdAt.getTime() / 1000)
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}