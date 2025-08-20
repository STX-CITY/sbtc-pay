import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { createWebhookEvent } from '@/lib/webhooks/sender';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    // Create a test webhook event
    const testPaymentIntent = {
      id: 'pi_test_webhook_123',
      amount: 100000, // 0.1 sBTC
      amount_usd: 9850,
      currency: 'sbtc',
      status: 'succeeded',
      description: 'Test webhook payment',
      created: Math.floor(Date.now() / 1000)
    };

    const eventId = await createWebhookEvent(
      auth.merchantId,
      'payment_intent.succeeded',
      testPaymentIntent
    );

    return NextResponse.json({
      message: 'Test webhook event created and delivery initiated',
      event_id: eventId,
      test_payment_intent: testPaymentIntent
    });
  } catch (error) {
    console.error('Error creating test webhook:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}