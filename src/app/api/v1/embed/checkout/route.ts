import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('product_id');
    const apiKey = searchParams.get('api_key');

    if (!productId || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Create a mock request with the API key in the authorization header
    const mockHeaders = new Headers();
    mockHeaders.set('authorization', `Bearer ${apiKey}`);
    const mockRequest = new NextRequest(req.url, { headers: mockHeaders });
    
    // Authenticate the API key
    const auth = await authenticateRequest(mockRequest);
    if (!auth) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Fetch product details
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product || product.merchantId !== auth.merchantId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Return product data for embedded checkout
    return NextResponse.json({
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      price_usd: product.priceUsd,
      images: product.images,
      active: product.active,
      merchant_id: product.merchantId
    });

  } catch (error) {
    console.error('Error in embedded checkout API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const apiKey = searchParams.get('api_key');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Create a mock request with the API key in the authorization header
    const mockHeaders = new Headers();
    mockHeaders.set('authorization', `Bearer ${apiKey}`);
    const mockRequest = new NextRequest(req.url, { headers: mockHeaders });
    
    // Authenticate the API key
    const auth = await authenticateRequest(mockRequest);
    if (!auth) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { product_id, customer_email, metadata } = body;

    if (!product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Verify product belongs to the authenticated merchant
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, product_id))
      .limit(1);

    if (!product || product.merchantId !== auth.merchantId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Create payment intent (this would be expanded with actual payment logic)
    const paymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      product_id: product_id,
      customer_email: customer_email,
      amount: product.price,
      currency: 'sbtc',
      status: 'requires_payment',
      metadata: metadata || {},
      created: new Date().toISOString()
    };

    return NextResponse.json(paymentIntent);

  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}