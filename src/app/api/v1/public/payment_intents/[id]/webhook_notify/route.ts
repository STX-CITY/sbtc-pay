import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, merchants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';

const publicWebhookNotifySchema = z.object({
  tx_id: z.string(),
  customer_address: z.string().optional(),
  public_api_key: z.string()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tx_id, customer_address, public_api_key } = publicWebhookNotifySchema.parse(body);

    // Get the payment intent with merchant info
    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantPublicKey: merchants.publicApiKeyTest,
        merchantId: merchants.id
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .where(eq(paymentIntents.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const { paymentIntent, merchantPublicKey, merchantId } = result[0];

    // Validate the public API key matches the merchant
    if (merchantPublicKey !== public_api_key) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid public API key' } },
        { status: 401 }
      );
    }

    // Only allow webhook triggering for payment intents that are in 'created' status
    if (paymentIntent.status !== 'created') {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent already processed' } },
        { status: 400 }
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

    console.error('Error sending public webhook notification:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}