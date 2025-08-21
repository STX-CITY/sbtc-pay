import { NextRequest, NextResponse } from 'next/server';
import { db, webhookEvents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';
import { deliverWebhook } from '@/lib/webhooks/sender';

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

    // Verify the webhook event belongs to this merchant
    const event = await db.query.webhookEvents.findFirst({
      where: and(
        eq(webhookEvents.id, id),
        eq(webhookEvents.merchantId, auth.merchantId)
      )
    });

    if (!event) {
      return NextResponse.json(
        { error: { type: 'resource_not_found', message: 'Webhook event not found' } },
        { status: 404 }
      );
    }

    if (event.delivered) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Webhook event already delivered successfully' } },
        { status: 400 }
      );
    }

    if (event.attempts >= 5) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Maximum retry attempts reached' } },
        { status: 400 }
      );
    }

    // Reset next retry time to allow immediate retry
    await db.update(webhookEvents)
      .set({
        nextRetryAt: null
      })
      .where(eq(webhookEvents.id, id));

    // Trigger webhook delivery
    const success = await deliverWebhook(id);

    return NextResponse.json({
      message: success ? 'Webhook retry successful' : 'Webhook retry failed',
      delivered: success,
      event_id: id
    });
  } catch (error) {
    console.error('Error retrying webhook:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}