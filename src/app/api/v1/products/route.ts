import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, products } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { generateProductId, getExchangeRate, convertUsdToSbtc } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['one_time', 'subscription']).default('one_time'),
  price: z.number().positive().optional(), // Price in sBTC
  price_usd: z.number().positive().optional(), // Price in USD
  currency: z.literal('sbtc').default('sbtc'),
  images: z.array(z.string().url()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  active: z.boolean().default(true),
}).refine(data => data.price || data.price_usd, {
  message: "Either 'price' or 'price_usd' must be provided"
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createProductSchema.parse(body);

    let price: number;
    let priceUsd: number | undefined;

    if (validatedData.price_usd) {
      const exchangeRate = await getExchangeRate();
      price = convertUsdToSbtc(validatedData.price_usd, exchangeRate);
      priceUsd = validatedData.price_usd;
    } else {
      price = validatedData.price! * 100_000_000; // Convert sBTC to microsBTC
      // Optionally calculate USD equivalent
    }

    const productId = generateProductId();

    const newProduct = {
      id: productId,
      merchantId: auth.merchantId,
      name: validatedData.name,
      description: validatedData.description,
      type: validatedData.type,
      price,
      priceUsd: priceUsd?.toString(),
      currency: validatedData.currency,
      images: validatedData.images || [],
      metadata: validatedData.metadata,
      active: validatedData.active,
    };

    const [createdProduct] = await db
      .insert(products)
      .values(newProduct)
      .returning();

    return NextResponse.json({
      id: createdProduct.id,
      name: createdProduct.name,
      description: createdProduct.description,
      type: createdProduct.type,
      price: createdProduct.price,
      price_usd: createdProduct.priceUsd ? parseFloat(createdProduct.priceUsd) : undefined,
      currency: createdProduct.currency,
      images: createdProduct.images,
      metadata: createdProduct.metadata,
      active: createdProduct.active,
      created: Math.floor(createdProduct.createdAt.getTime() / 1000),
      updated: Math.floor(createdProduct.updatedAt.getTime() / 1000)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const active = url.searchParams.get('active');

    let query = db
      .select()
      .from(products)
      .where(eq(products.merchantId, auth.merchantId));

    // Filter by active status if specified
    if (active !== null) {
      query = query.where(eq(products.active, active === 'true'));
    }

    const merchantProducts = await query
      .limit(limit)
      .offset(offset)
      .orderBy(products.createdAt);

    const data = merchantProducts.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      type: product.type,
      price: product.price,
      price_usd: product.priceUsd ? parseFloat(product.priceUsd) : undefined,
      currency: product.currency,
      images: product.images,
      metadata: product.metadata,
      active: product.active,
      created: Math.floor(product.createdAt.getTime() / 1000),
      updated: Math.floor(product.updatedAt.getTime() / 1000)
    }));

    return NextResponse.json({
      object: 'list',
      data,
      has_more: data.length === limit,
      url: '/v1/products'
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}