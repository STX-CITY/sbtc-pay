import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, merchants } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const configureWebhookSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  events: z.array(z.enum([
    'payment_intent.created',
    'payment_intent.succeeded', 
    'payment_intent.failed',
    'payment_intent.canceled'
  ])).optional().default(['payment_intent.succeeded', 'payment_intent.failed']),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, events } = configureWebhookSchema.parse(body);

    // Generate a webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Update merchant with webhook configuration
    const [updatedMerchant] = await db
      .update(merchants)
      .set({
        webhookUrl: url,
        webhookSecret: webhookSecret
      })
      .where(eq(merchants.id, auth.merchantId))
      .returning();

    return NextResponse.json({
      webhook_url: url,
      events,
      secret: webhookSecret,
      created: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error configuring webhook:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const merchant = await db.query.merchants.findFirst({
      where: eq(merchants.id, auth.merchantId)
    });

    if (!merchant) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Merchant not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      webhook_url: merchant.webhookUrl,
      has_secret: !!merchant.webhookSecret,
      configured: !!merchant.webhookUrl
    });
  } catch (error) {
    console.error('Error fetching webhook config:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    // Remove webhook configuration
    await db
      .update(merchants)
      .set({
        webhookUrl: null,
        webhookSecret: null
      })
      .where(eq(merchants.id, auth.merchantId));

    return NextResponse.json({
      message: 'Webhook configuration removed'
    });
  } catch (error) {
    console.error('Error removing webhook config:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}