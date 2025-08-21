import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';

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

    // Get the current payment intent
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

    // Check if payment intent can be updated
    if (!['pending', 'created'].includes(paymentIntent.status)) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: `Payment intent cannot be updated in status: ${paymentIntent.status}` } },
        { status: 400 }
      );
    }

    // Generate a mock transaction ID
    const mockTxId = `0x${randomBytes(32).toString('hex')}`;

    // Update payment intent to succeeded status
    const [updatedPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        status: 'succeeded',
        txId: mockTxId,
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.id, (await params).id))
      .returning();

    // Create webhook event
    const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
    await createWebhookEvent(auth.merchantId, 'payment_intent.succeeded', webhookData);

    return NextResponse.json({
      ...webhookData,
      simulated: true,
      message: 'Payment intent marked as succeeded (simulated)'
    });
  } catch (error) {
    console.error('Error simulating payment success:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}