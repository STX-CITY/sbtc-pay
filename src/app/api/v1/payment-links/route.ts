import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, products, paymentLinks } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const createPaymentLinkSchema = z.object({
  product_id: z.string(),
  product_name: z.string().optional(),
  email: z.string().email().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  generated_url: z.string(),
  expires_at: z.string().optional()
});

export const revalidate = 0;
// GET /api/v1/payment-links - Fetch payment links
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    // Fetch payment links from the database
    const dbPaymentLinks = await db
      .select({
        id: paymentLinks.id,
        product_id: paymentLinks.productId,
        product_name: products.name,
        link_code: paymentLinks.linkCode,
        email: paymentLinks.email,
        metadata: paymentLinks.metadata,
        created_at: paymentLinks.createdAt,
        used_count: paymentLinks.usedCount,
        last_used_at: paymentLinks.lastUsedAt,
        is_active: paymentLinks.isActive,
        expires_at: paymentLinks.expiresAt
      })
      .from(paymentLinks)
      .leftJoin(products, eq(paymentLinks.productId, products.id))
      .where(eq(paymentLinks.merchantId, auth.merchantId))
      .orderBy(desc(paymentLinks.createdAt))
      .limit(100);

    return NextResponse.json({ 
      data: dbPaymentLinks,
      has_more: dbPaymentLinks.length === 100 
    });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to fetch payment links' } },
      { status: 500 }
    );
  }
}

// POST /api/v1/payment-links - Create a new payment link
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createPaymentLinkSchema.parse(body);

    // Generate a unique link code
    const linkCode = 'link_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    // Insert payment link into database
    const [insertedPaymentLink] = await db
      .insert(paymentLinks)
      .values({
        merchantId: auth.merchantId,
        productId: validatedData.product_id,
        linkCode: linkCode,
        email: validatedData.email,
        metadata: validatedData.metadata,
        expiresAt: validatedData.expires_at ? new Date(validatedData.expires_at) : null,
        isActive: true,
        usedCount: 0
      })
      .returning();

    // Get product details for the response
    const [product] = await db
      .select({
        name: products.name
      })
      .from(products)
      .where(eq(products.id, validatedData.product_id))
      .limit(1);

    const paymentLink = {
      id: insertedPaymentLink.id,
      merchant_id: auth.merchantId,
      product_id: validatedData.product_id,
      product_name: product?.name || validatedData.product_name || 'Unknown Product',
      link_code: linkCode,
      email: validatedData.email,
      metadata: validatedData.metadata,
      generated_url: validatedData.generated_url,
      created_at: insertedPaymentLink.createdAt,
      used_count: 0,
      is_active: true,
      expires_at: insertedPaymentLink.expiresAt
    };

    return NextResponse.json(paymentLink, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Invalid request data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to create payment link' } },
      { status: 500 }
    );
  }
}