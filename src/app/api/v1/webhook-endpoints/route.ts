import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, webhookEndpoints } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const createWebhookEndpointSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  events: z.array(z.enum([
    'payment_intent.created',
    'payment_intent.succeeded', 
    'payment_intent.failed',
    'payment_intent.canceled',
    'product.created',
    'product.updated',
    'product.deleted',
    'merchant.updated'
  ])).min(1, 'At least one event must be selected'),
  active: z.boolean().optional().default(true)
});
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

    const endpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.merchantId, auth.merchantId))
      .orderBy(webhookEndpoints.createdAt);

    const formattedEndpoints = endpoints.map(endpoint => ({
      id: endpoint.id,
      url: endpoint.url,
      description: endpoint.description,
      events: JSON.parse(endpoint.events),
      active: endpoint.active,
      secret: endpoint.secret,
      created: Math.floor(endpoint.createdAt.getTime() / 1000),
      updated: Math.floor(endpoint.updatedAt.getTime() / 1000)
    }));

    return NextResponse.json({
      data: formattedEndpoints,
      has_more: false,
      total_count: formattedEndpoints.length
    });
  } catch (error) {
    console.error('Error fetching webhook endpoints:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

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
    const { url, description, events, active } = createWebhookEndpointSchema.parse(body);

    // Generate a webhook secret for this endpoint
    const secret = crypto.randomBytes(32).toString('hex');

    const [newEndpoint] = await db
      .insert(webhookEndpoints)
      .values({
        merchantId: auth.merchantId,
        url,
        description: description || null,
        events: JSON.stringify(events),
        active,
        secret
      })
      .returning();

    return NextResponse.json({
      id: newEndpoint.id,
      url: newEndpoint.url,
      description: newEndpoint.description,
      events: JSON.parse(newEndpoint.events),
      active: newEndpoint.active,
      secret: newEndpoint.secret,
      created: Math.floor(newEndpoint.createdAt.getTime() / 1000)
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error creating webhook endpoint:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}