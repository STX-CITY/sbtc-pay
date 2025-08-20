import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { generatePaymentIntentId, formatPaymentIntentResponse, getExchangeRate, convertUsdToSbtc } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

const createPaymentIntentSchema = z.object({
  amount: z.number().positive().optional(),
  amount_usd: z.number().positive().optional(),
  currency: z.literal('sbtc').default('sbtc'),
  description: z.string().optional(),
  customer_address: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  return_url: z.string().url().optional(),
}).refine(data => data.amount || data.amount_usd, {
  message: "Either 'amount' or 'amount_usd' must be provided"
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
    const validatedData = createPaymentIntentSchema.parse(body);

    let amount: number;
    let amountUsd: number | undefined;

    if (validatedData.amount_usd) {
      const exchangeRate = await getExchangeRate();
      amount = convertUsdToSbtc(validatedData.amount_usd, exchangeRate);
      amountUsd = validatedData.amount_usd;
    } else {
      amount = validatedData.amount!;
      // Optionally calculate USD equivalent
    }

    const paymentIntentId = generatePaymentIntentId();

    const newPaymentIntent = {
      id: paymentIntentId,
      merchantId: auth.merchantId,
      amount,
      amountUsd: amountUsd?.toString(),
      currency: validatedData.currency,
      status: 'created' as const,
      customerAddress: validatedData.customer_address,
      description: validatedData.description,
      metadata: validatedData.metadata,
    };

    const [createdPaymentIntent] = await db
      .insert(paymentIntents)
      .values(newPaymentIntent)
      .returning();

    return NextResponse.json(formatPaymentIntentResponse(createdPaymentIntent));
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

    const merchantPaymentIntents = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, auth.merchantId))
      .limit(limit)
      .offset(offset)
      .orderBy(paymentIntents.createdAt);

    const data = merchantPaymentIntents.map(formatPaymentIntentResponse);

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