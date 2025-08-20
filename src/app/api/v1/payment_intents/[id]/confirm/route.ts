import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { eq, and } from 'drizzle-orm';

const confirmPaymentIntentSchema = z.object({
  payment_method: z.string().optional(),
  customer_address: z.string().optional(),
  return_url: z.string().url().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = confirmPaymentIntentSchema.parse(body);

    // First, get the current payment intent
    const currentPaymentIntent = await db
      .select()
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.id, id),
          eq(paymentIntents.merchantId, auth.merchantId)
        )
      )
      .limit(1);

    if (currentPaymentIntent.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const paymentIntent = currentPaymentIntent[0];

    // Check if payment intent can be confirmed
    if (paymentIntent.status !== 'created') {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: `Payment intent cannot be confirmed in status: ${paymentIntent.status}` } },
        { status: 400 }
      );
    }

    // Update payment intent to pending status
    const [updatedPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        status: 'pending',
        customerAddress: validatedData.customer_address || paymentIntent.customerAddress,
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.id, params.id))
      .returning();

    // Create webhook event for status change
    const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
    await createWebhookEvent(auth.merchantId, 'payment_intent.created', webhookData);

    // TODO: Here we would integrate with sBTC blockchain to initiate the transfer
    // For now, we'll just return the pending payment intent
    // In a real implementation, this would:
    // 1. Generate a payment address for the customer
    // 2. Set up blockchain monitoring
    // 3. Return payment instructions to the client

    return NextResponse.json(webhookData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error confirming payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}