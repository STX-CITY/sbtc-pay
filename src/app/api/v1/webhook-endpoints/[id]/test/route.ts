import { NextRequest, NextResponse } from 'next/server';
import { db, webhookEndpoints } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { createWebhookEvent } from '@/lib/webhooks/sender';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify the endpoint belongs to this merchant
    const endpoint = await db.query.webhookEndpoints.findFirst({
      where: and(
        eq(webhookEndpoints.id, id),
        eq(webhookEndpoints.merchantId, auth.merchantId)
      )
    });

    if (!endpoint) {
      return NextResponse.json(
        { error: { type: 'resource_not_found', message: 'Webhook endpoint not found' } },
        { status: 404 }
      );
    }

    if (!endpoint.active) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Webhook endpoint is disabled' } },
        { status: 400 }
      );
    }

    // Create a test payment intent object
    const testPaymentIntent = {
      id: `pi_test_${Date.now()}`,
      amount: 100000, // 0.001 sBTC
      currency: 'sbtc',
      status: 'succeeded',
      description: 'Test webhook payment',
      metadata: { test: true },
      created: Math.floor(Date.now() / 1000)
    };

    // Send a test webhook event
    const eventId = await createWebhookEvent(
      auth.merchantId,
      'payment_intent.succeeded',
      testPaymentIntent,
      id // Pass the specific endpoint ID
    );

    return NextResponse.json({
      message: 'Test webhook sent successfully',
      event_id: eventId,
      endpoint_url: endpoint.url
    });
  } catch (error) {
    console.error('Error sending test webhook:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}