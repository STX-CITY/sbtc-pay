import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, webhookEndpoints, webhookEvents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';

const updateWebhookEndpointSchema = z.object({
  url: z.string().url('Must be a valid URL').optional(),
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
  ])).min(1, 'At least one event must be selected').optional(),
  active: z.boolean().optional()
});

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

    return NextResponse.json({
      id: endpoint.id,
      url: endpoint.url,
      description: endpoint.description,
      events: JSON.parse(endpoint.events),
      active: endpoint.active,
      created: Math.floor(endpoint.createdAt.getTime() / 1000),
      updated: Math.floor(endpoint.updatedAt.getTime() / 1000)
    });
  } catch (error) {
    console.error('Error fetching webhook endpoint:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    const updates = updateWebhookEndpointSchema.parse(body);

    // Verify the endpoint belongs to this merchant
    const existing = await db.query.webhookEndpoints.findFirst({
      where: and(
        eq(webhookEndpoints.id, id),
        eq(webhookEndpoints.merchantId, auth.merchantId)
      )
    });

    if (!existing) {
      return NextResponse.json(
        { error: { type: 'resource_not_found', message: 'Webhook endpoint not found' } },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (updates.url !== undefined) updateData.url = updates.url;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.events !== undefined) updateData.events = JSON.stringify(updates.events);
    if (updates.active !== undefined) updateData.active = updates.active;

    const [updatedEndpoint] = await db
      .update(webhookEndpoints)
      .set(updateData)
      .where(eq(webhookEndpoints.id, id))
      .returning();

    return NextResponse.json({
      id: updatedEndpoint.id,
      url: updatedEndpoint.url,
      description: updatedEndpoint.description,
      events: JSON.parse(updatedEndpoint.events),
      active: updatedEndpoint.active,
      created: Math.floor(updatedEndpoint.createdAt.getTime() / 1000),
      updated: Math.floor(updatedEndpoint.updatedAt.getTime() / 1000)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error updating webhook endpoint:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    const existing = await db.query.webhookEndpoints.findFirst({
      where: and(
        eq(webhookEndpoints.id, id),
        eq(webhookEndpoints.merchantId, auth.merchantId)
      )
    });

    if (!existing) {
      return NextResponse.json(
        { error: { type: 'resource_not_found', message: 'Webhook endpoint not found' } },
        { status: 404 }
      );
    }

    // First delete related webhook events
    await db
      .delete(webhookEvents)
      .where(eq(webhookEvents.webhookEndpointId, id));
    
    // Then delete the webhook endpoint
    await db
      .delete(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id));

    return NextResponse.json({
      message: 'Webhook endpoint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting webhook endpoint:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}