import { NextRequest, NextResponse } from 'next/server';
import { db, products, merchants } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await db
      .select({
        product: products,
        merchantName: merchants.name
      })
      .from(products)
      .leftJoin(merchants, eq(products.merchantId, merchants.id))
      .where(
        and(
          eq(products.id, id),
          eq(products.active, true) // Only show active products publicly
        )
      )
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Product not found' } },
        { status: 404 }
      );
    }

    const { product, merchantName } = result[0];

    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      price_usd: product.priceUsd ? parseFloat(product.priceUsd) : undefined,
      currency: product.currency,
      images: product.images,
      merchantId: product.merchantId, // Include merchantId for payment intent creation
      merchant_name: merchantName,
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