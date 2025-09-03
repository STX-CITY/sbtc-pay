import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { authenticateRequest } from '@/lib/auth/middleware';

const webhookNotifySchema = z.object({
  tx_id: z.string(),
  customer_address: z.string().optional()
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
    const { tx_id, customer_address } = webhookNotifySchema.parse(body);

    // Get the payment intent
    const [paymentIntent] = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.id, id))
      .limit(1);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    // Verify the payment intent belongs to the authenticated merchant
    if (paymentIntent.merchantId !== auth.merchantId) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    // Update payment intent status to succeeded and add transaction details
    const [updatedPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        status: 'succeeded',
        txId: tx_id,
        customerAddress: customer_address || paymentIntent.customerAddress,
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, id))
      .returning();

    // Send webhook notification to merchant
    try {
      const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
      await createWebhookEvent(paymentIntent.merchantId, 'payment_intent.succeeded', webhookData);
      console.log(`Sent webhook event for payment intent ${updatedPaymentIntent.id}`);
    } catch (webhookError) {
      console.error('Error sending webhook:', webhookError);
    }

    return NextResponse.json({
      id: updatedPaymentIntent.id,
      status: 'succeeded',
      tx_id: tx_id,
      webhook_sent: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error sending webhook notification:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}