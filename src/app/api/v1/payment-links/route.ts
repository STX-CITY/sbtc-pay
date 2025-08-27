import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, products } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const createPaymentLinkSchema = z.object({
  product_id: z.string(),
  product_name: z.string(),
  email: z.string().email().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  generated_url: z.string(),
  expires_at: z.string().optional()
});

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

    // Since payment_links table doesn't exist yet, let's derive payment links from existing payment intents
    // that have metadata indicating they were created from generated links
    const paymentLinksFromIntents = await db
      .select({
        id: paymentIntents.id,
        product_id: paymentIntents.productId,
        email: paymentIntents.customerEmail,
        metadata: paymentIntents.metadata,
        created_at: paymentIntents.createdAt,
        amount: paymentIntents.amount,
        amount_usd: paymentIntents.amountUsd,
        status: paymentIntents.status,
        product_name: products.name,
        product_price: products.price,
        product_price_usd: products.priceUsd
      })
      .from(paymentIntents)
      .leftJoin(products, eq(paymentIntents.productId, products.id))
      .where(
        eq(paymentIntents.merchantId, auth.merchantId)
      )
      .orderBy(desc(paymentIntents.createdAt))
      .limit(100);

    // Filter and transform payment intents that came from generated links
    const transformedLinks = paymentLinksFromIntents
      .filter((intent) => {
        // Only include payment intents that have the generated link marker or have email/custom metadata
        const metadata = intent.metadata as any;
        return (
          metadata?._generated_link || 
          intent.email || 
          (metadata && Object.keys(metadata).some(key => !key.startsWith('product_')))
        );
      })
      .map((intent) => {
        const metadata = intent.metadata as any;
        return {
          id: intent.id,
          product_id: intent.product_id,
          product_name: intent.product_name || 'Unknown Product',
          link_code: metadata?._link_code || `link_${intent.id.slice(-8)}`,
          email: intent.email,
          metadata: {
            ...metadata,
            // Remove internal tracking fields from display
            _generated_link: undefined,
            _link_code: undefined,
            _generated_at: undefined
          },
          created_at: metadata?._generated_at || intent.created_at,
          used_count: 1, // Since this is from a completed payment intent
          last_used_at: intent.created_at,
          is_active: true,
          amount: intent.amount,
          amount_usd: intent.amount_usd,
          status: intent.status
        };
      })
      // Remove duplicates by link_code (in case multiple payment intents used the same link)
      .reduce((unique, link) => {
        const existing = unique.find(l => l.link_code === link.link_code);
        if (existing) {
          existing.used_count += 1;
          if (new Date(link.last_used_at) > new Date(existing.last_used_at)) {
            existing.last_used_at = link.last_used_at;
          }
        } else {
          unique.push(link);
        }
        return unique;
      }, [] as any[]);

    return NextResponse.json({ 
      data: transformedLinks,
      has_more: paymentLinksFromIntents.length === 100 
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

    // Since we don't have a payment_links table yet, we'll store the link info in a simple way
    // and track it when payment intents are created from these links
    
    // For now, we'll create a record in memory/logs and return the link info
    // When the payment_links table is created, this should be replaced with proper DB insertion
    
    const paymentLink = {
      id: uuidv4(),
      merchant_id: auth.merchantId,
      product_id: validatedData.product_id,
      product_name: validatedData.product_name,
      link_code: linkCode,
      email: validatedData.email,
      metadata: {
        ...validatedData.metadata,
        // Mark this as a generated payment link
        _generated_link: true,
        _link_code: linkCode,
        _generated_at: new Date().toISOString()
      },
      generated_url: validatedData.generated_url,
      created_at: new Date().toISOString(),
      used_count: 0,
      is_active: true,
      expires_at: validatedData.expires_at
    };

    // Log the payment link creation (this would be database insertion in production)
    console.log('Payment link created:', {
      link_code: linkCode,
      product_id: validatedData.product_id,
      merchant_id: auth.merchantId,
      email: validatedData.email,
      metadata: paymentLink.metadata
    });

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