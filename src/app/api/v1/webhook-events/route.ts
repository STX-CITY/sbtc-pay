import { NextRequest, NextResponse } from 'next/server';
import { db, webhookEvents, webhookEndpoints } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, desc, gte, lte, ilike } from 'drizzle-orm';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('event_type');
    const endpointId = searchParams.get('endpoint_id');
    const delivered = searchParams.get('delivered');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build query conditions
    const conditions = [eq(webhookEvents.merchantId, auth.merchantId)];

    if (eventType) {
      conditions.push(eq(webhookEvents.eventType, eventType));
    }

    if (endpointId) {
      conditions.push(eq(webhookEvents.webhookEndpointId, endpointId));
    }

    if (delivered !== null) {
      conditions.push(eq(webhookEvents.delivered, delivered === 'true'));
    }

    if (startDate) {
      conditions.push(gte(webhookEvents.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(webhookEvents.createdAt, new Date(endDate)));
    }

    // Get webhook events with endpoint information
    const events = await db
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
        endpointActive: webhookEndpoints.active
      })
      .from(webhookEvents)
      .leftJoin(webhookEndpoints, eq(webhookEvents.webhookEndpointId, webhookEndpoints.id))
      .where(and(...conditions))
      .orderBy(desc(webhookEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.eventType,
      payment_intent_id: event.paymentIntentId,
      data: event.data,
      delivered: event.delivered,
      attempts: event.attempts,
      last_attempted: event.lastAttemptedAt ? Math.floor(event.lastAttemptedAt.getTime() / 1000) : null,
      next_retry: event.nextRetryAt ? Math.floor(event.nextRetryAt.getTime() / 1000) : null,
      response_status: event.responseStatus,
      response_body: event.responseBody,
      created: Math.floor(event.createdAt.getTime() / 1000),
      endpoint: event.webhookEndpointId ? {
        id: event.webhookEndpointId,
        url: event.endpointUrl,
        active: event.endpointActive
      } : null
    }));

    // Get total count for pagination
    const totalCount = await db
      .select({ count: webhookEvents.id })
      .from(webhookEvents)
      .leftJoin(webhookEndpoints, eq(webhookEvents.webhookEndpointId, webhookEndpoints.id))
      .where(and(...conditions));

    return NextResponse.json({
      data: formattedEvents,
      has_more: offset + limit < totalCount.length,
      total_count: totalCount.length
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}