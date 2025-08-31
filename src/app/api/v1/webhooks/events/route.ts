import { NextRequest, NextResponse } from 'next/server';
import { db, webhookEvents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, desc } from 'drizzle-orm';

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

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const events = await db
      .select({
        id: webhookEvents.id,
        event_type: webhookEvents.eventType,
        payment_intent_id: webhookEvents.paymentIntentId,
        delivered: webhookEvents.delivered,
        attempts: webhookEvents.attempts,
        created_at: webhookEvents.createdAt,
        data: webhookEvents.data
      })
      .from(webhookEvents)
      .where(eq(webhookEvents.merchantId, auth.merchantId))
      .orderBy(desc(webhookEvents.createdAt))
      .limit(limit)
      .offset(offset);

    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.event_type,
      payment_intent_id: event.payment_intent_id,
      delivered: event.delivered,
      attempts: event.attempts,
      created: Math.floor(event.created_at.getTime() / 1000),
      data: event.data
    }));

    return NextResponse.json({
      object: 'list',
      data: formattedEvents,
      has_more: formattedEvents.length === limit,
      url: '/v1/webhooks/events'
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}