import { NextRequest, NextResponse } from 'next/server';
import { db, webhookEvents, webhookEndpoints } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';

export async function GET(
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

    // Get webhook event with endpoint information
    const event = await db
      .select({
        id: webhookEvents.id,
        eventType: webhookEvents.eventType,
        paymentIntentId: webhookEvents.paymentIntentId,
        data: webhookEvents.data,
        delivered: webhookEvents.delivered,
        attempts: webhookEvents.attempts,
        lastAttemptedAt: webhookEvents.lastAttemptedAt,
        nextRetryAt: webhookEvents.nextRetryAt,
        responseStatus: webhookEvents.responseStatus,
        responseBody: webhookEvents.responseBody,
        createdAt: webhookEvents.createdAt,
        webhookEndpointId: webhookEvents.webhookEndpointId,
        endpointUrl: webhookEndpoints.url,
        endpointActive: webhookEndpoints.active,
        endpointDescription: webhookEndpoints.description
      })
      .from(webhookEvents)
      .leftJoin(webhookEndpoints, eq(webhookEvents.webhookEndpointId, webhookEndpoints.id))
      .where(and(
        eq(webhookEvents.id, id),
        eq(webhookEvents.merchantId, auth.merchantId)
      ))
      .limit(1);

    if (event.length === 0) {
      return NextResponse.json(
        { error: { type: 'resource_not_found', message: 'Webhook event not found' } },
        { status: 404 }
      );
    }

    const webhookEvent = event[0];

    return NextResponse.json({
      id: webhookEvent.id,
      type: webhookEvent.eventType,
      payment_intent_id: webhookEvent.paymentIntentId,
      data: webhookEvent.data,
      delivered: webhookEvent.delivered,
      attempts: webhookEvent.attempts,
      last_attempted: webhookEvent.lastAttemptedAt ? Math.floor(webhookEvent.lastAttemptedAt.getTime() / 1000) : null,
      next_retry: webhookEvent.nextRetryAt ? Math.floor(webhookEvent.nextRetryAt.getTime() / 1000) : null,
      response_status: webhookEvent.responseStatus,
      response_body: webhookEvent.responseBody,
      created: Math.floor(webhookEvent.createdAt.getTime() / 1000),
      endpoint: webhookEvent.webhookEndpointId ? {
        id: webhookEvent.webhookEndpointId,
        url: webhookEvent.endpointUrl,
        active: webhookEvent.endpointActive,
        description: webhookEvent.endpointDescription
      } : null
    });
  } catch (error) {
    console.error('Error fetching webhook event:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}