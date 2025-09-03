import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, products, merchants } from '@/lib/db';
import { generatePaymentIntentId, formatPaymentIntentResponse, getExchangeRate, convertUsdToSbtc } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, desc, sql } from 'drizzle-orm';

const createPaymentIntentSchema = z.object({
  amount: z.number().positive().optional(),
  amount_usd: z.number().positive().optional(),
  currency: z.literal('sbtc').default('sbtc'),
  description: z.string().optional(),
  customer_address: z.string().optional(),
  customer_email: z.union([
    z.string().email(),
    z.literal(""),
    z.null(),
    z.undefined()
  ]).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  return_url: z.string().url().optional(),
  product_id: z.string().optional(), // Optional product ID to get merchant from
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    price: z.number(),
    price_usd: z.number().optional(),
    images: z.array(z.string()).optional(),
    merchantId: z.string()
  }).optional()
}).refine(data => data.product_id || data.product || data.amount || data.amount_usd, {
  message: "Either 'product_id', 'product', or amount fields must be provided"
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPaymentIntentSchema.parse(body);

    let merchantId: string;
  let productId: string | undefined;
    let amount: number;
    let amountUsd: number | undefined;
    let description: string | undefined;
    let currency: string = 'sbtc';
    let productData: any = null;

    // If product data is provided directly, use it
    if (validatedData.product) {
      productData = validatedData.product;
      merchantId = validatedData.product.merchantId;
      
      if (!merchantId) {
        return NextResponse.json(
          { error: { type: 'invalid_request_error', message: 'merchantId is required in product data' } },
          { status: 400 }
        );
      }
      
      productId = validatedData.product.id;
      amount = validatedData.product.price;
      amountUsd = validatedData.product.price_usd;
      description = validatedData.product.description || validatedData.product.name;
      currency = 'sbtc';
    } else if (validatedData.product_id) {
      // Fallback: If product_id is provided, use product data from DB
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, validatedData.product_id))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: { type: 'resource_missing', message: 'Product not found' } },
          { status: 404 }
        );
      }

      // Store product data for metadata
      productData = product;

      // Use product data directly
      merchantId = product.merchantId;
      productId = product.id;
      amount = product.price; // Product price is already in sBTC microunits
      amountUsd = product.priceUsd ? parseFloat(product.priceUsd) : undefined;
      description = product.description || product.name;
      currency = product.currency;
    } else {
      // For backward compatibility, use validated input data
      if (!validatedData.metadata?.merchantId) {
        return NextResponse.json(
          { error: { type: 'invalid_request_error', message: 'Either product_id or merchantId in metadata is required' } },
          { status: 400 }
        );
      }

      merchantId = validatedData.metadata.merchantId;
      
      if (validatedData.amount_usd) {
        const exchangeRate = await getExchangeRate();
        amount = convertUsdToSbtc(validatedData.amount_usd, exchangeRate);
        amountUsd = validatedData.amount_usd;
      } else {
        amount = validatedData.amount!;
      }
      
      description = validatedData.description;
      currency = validatedData.currency;
    }

    // Enhanced metadata with merchantId and product data (if applicable)
    const enhancedMetadata = {
      ...validatedData.metadata,
      merchantId: merchantId
    };

    // Add all product fields to metadata for reuse in public endpoint
    if (productData) {
      (enhancedMetadata as any).product = {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        price: productData.price,
        price_usd: productData.price_usd || productData.priceUsd,
        images: productData.images,
        ...(productData.type && { type: productData.type }),
        ...(productData.currency && { currency: productData.currency }),
        ...(productData.active !== undefined && { active: productData.active }),
        ...(productData.createdAt && { createdAt: productData.createdAt.getTime?.() || productData.createdAt }),
        ...(productData.updatedAt && { updatedAt: productData.updatedAt.getTime?.() || productData.updatedAt })
      };
    }

    const paymentIntentId = generatePaymentIntentId();

    const newPaymentIntent = {
      id: paymentIntentId,
      merchantId: merchantId,
      productId: productId,
      amount,
      amountUsd: amountUsd?.toString(),
      currency: currency,
      status: 'created' as const,
      customerAddress: validatedData.customer_address,
      customerEmail: validatedData.customer_email || null,
      description: description,
      metadata: enhancedMetadata,
    };

    const [createdPaymentIntent] = await db
      .insert(paymentIntents)
      .values(newPaymentIntent)
      .returning();

    // Get merchant's recipient address
    const [merchant] = await db
      .select({
        recipientAddress: merchants.recipientAddress,
        stacksAddress: merchants.stacksAddress
      })
      .from(merchants)
      .where(eq(merchants.id, merchantId))
      .limit(1);

    // Send webhook event for payment_intent.created
    const webhookData = formatPaymentIntentResponse(createdPaymentIntent);
    try {
      await createWebhookEvent(merchantId, 'payment_intent.created', webhookData);
    } catch (webhookError) {
      console.error('Failed to send payment_intent.created webhook:', webhookError);
      // Continue without failing the request
    }

    // Add recipient address to response
    const responseData = {
      ...webhookData,
      recipient_address: merchant?.recipientAddress || merchant?.stacksAddress
    };

    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
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
    const status = url.searchParams.get('status');

    // Build where conditions to filter by merchant
    const conditions = [eq(paymentIntents.merchantId, auth.merchantId)];
    
    // Filter by status if specified
    if (status) {
      conditions.push(eq(paymentIntents.status, status as any));
    }

    // Get total count for pagination
    const [{ count: totalCount }] = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(paymentIntents)
      .where(and(...conditions));

    // Get status counts for the merchant (without status filter)
    const baseConditions = [eq(paymentIntents.merchantId, auth.merchantId)];
    const statusCounts = await db
      .select({ 
        status: paymentIntents.status,
        count: sql<number>`cast(count(*) as integer)` 
      })
      .from(paymentIntents)
      .where(and(...baseConditions))
      .groupBy(paymentIntents.status);

    const merchantPaymentIntents = await db
      .select({
        paymentIntent: paymentIntents,
        merchantRecipientAddress: merchants.recipientAddress,
        merchantStacksAddress: merchants.stacksAddress
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .where(and(...conditions))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(paymentIntents.createdAt));

    const data = merchantPaymentIntents.map(({ paymentIntent, merchantRecipientAddress, merchantStacksAddress }) => {
      const formattedPaymentIntent = formatPaymentIntentResponse(paymentIntent);
      return {
        ...formattedPaymentIntent,
        recipient_address: merchantRecipientAddress || merchantStacksAddress
      };
    });

    // Calculate total count for all statuses
    const allCount = statusCounts.reduce((sum, item) => sum + item.count, 0);
    
    // Build status counts object
    const stats = {
      all: allCount,
      succeeded: statusCounts.find(item => item.status === 'succeeded')?.count || 0,
      pending: statusCounts.find(item => item.status === 'pending')?.count || 0,
      failed: statusCounts.find(item => item.status === 'failed')?.count || 0,
      created: statusCounts.find(item => item.status === 'created')?.count || 0,
      canceled: statusCounts.find(item => item.status === 'canceled')?.count || 0,
    };

    return NextResponse.json({
      object: 'list',
      data,
      has_more: offset + data.length < totalCount,
      total: totalCount,
      stats,
      url: '/v1/payment_intents'
    });
  } catch (error) {
    console.error('Error fetching payment intents:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

