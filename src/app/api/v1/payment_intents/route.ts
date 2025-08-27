import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, products, merchants } from '@/lib/db';
import { generatePaymentIntentId, formatPaymentIntentResponse, getExchangeRate, convertUsdToSbtc } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { eq } from 'drizzle-orm';

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
    await createWebhookEvent(merchantId, 'payment_intent.created', webhookData);

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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const allPaymentIntents = await db
      .select({
        paymentIntent: paymentIntents,
        merchantRecipientAddress: merchants.recipientAddress,
        merchantStacksAddress: merchants.stacksAddress
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .limit(limit)
      .offset(offset)
      .orderBy(paymentIntents.createdAt);

    const data = allPaymentIntents.map(({ paymentIntent, merchantRecipientAddress, merchantStacksAddress }) => {
      const formattedPaymentIntent = formatPaymentIntentResponse(paymentIntent);
      return {
        ...formattedPaymentIntent,
        recipient_address: merchantRecipientAddress || merchantStacksAddress
      };
    });

    return NextResponse.json({
      object: 'list',
      data,
      has_more: data.length === limit,
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

