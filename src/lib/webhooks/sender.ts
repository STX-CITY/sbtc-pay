import crypto from 'crypto';
import { db, webhookEvents, webhookEndpoints, merchants } from '@/lib/db';
import { eq, and } from 'drizzle-orm';

export type WebhookEventType = 
  | 'payment_intent.created' 
  | 'payment_intent.succeeded' 
  | 'payment_intent.failed' 
  | 'payment_intent.canceled'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'merchant.updated';

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  data: {
    object: any;
  };
  created: number;
}

export async function createWebhookEvent(
  merchantId: string,
  eventType: WebhookEventType,
  eventData: any,
  specificEndpointId?: string
): Promise<string[]> {
  // Get webhook endpoints that are subscribed to this event
  let targetEndpoints;
  
  if (specificEndpointId) {
    // Send to specific endpoint (for testing)
    targetEndpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(and(
        eq(webhookEndpoints.id, specificEndpointId),
        eq(webhookEndpoints.merchantId, merchantId),
        eq(webhookEndpoints.active, true)
      ));
  } else {
    // Send to all active endpoints subscribed to this event
    targetEndpoints = await db
      .select()
      .from(webhookEndpoints)
      .where(and(
        eq(webhookEndpoints.merchantId, merchantId),
        eq(webhookEndpoints.active, true)
      ));
  }

  if (targetEndpoints.length === 0) {
    // Silently return empty array when no webhook endpoints are configured
    // This is a normal case when merchants haven't set up webhooks
    return [];
  }

  const eventIds: string[] = [];

  // Create webhook events for each subscribed endpoint
  for (const endpoint of targetEndpoints) {
    const subscribedEvents = JSON.parse(endpoint.events);
    
    // Skip if this endpoint is not subscribed to this event type
    if (!subscribedEvents.includes(eventType)) {
      continue;
    }

    const webhookPayload: WebhookPayload = {
      id: `evt_${crypto.randomBytes(12).toString('base64url')}`,
      type: eventType,
      data: {
        object: eventData
      },
      created: Math.floor(Date.now() / 1000)
    };

    const [event] = await db.insert(webhookEvents).values({
      merchantId,
      webhookEndpointId: endpoint.id,
      eventType,
      paymentIntentId: eventData.id || null,
      data: webhookPayload,
      delivered: false,
      attempts: 0
    }).returning();

    eventIds.push(event.id);

    // Trigger async webhook delivery
    deliverWebhook(event.id).catch(console.error);
  }

  return eventIds;
}

export async function deliverWebhook(eventId: string): Promise<boolean> {
  try {
    // Get the webhook event using explicit select
    const eventQuery = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    if (eventQuery.length === 0) {
      console.log('Webhook event not found:', eventId);
      return false;
    }

    const event = eventQuery[0];

    if (!event.webhookEndpointId) {
      // Fallback to legacy single webhook URL for backward compatibility
      return deliverLegacyWebhook(eventId);
    }

    // Get the webhook endpoint using explicit select
    const endpointQuery = await db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, event.webhookEndpointId))
      .limit(1);

    if (endpointQuery.length === 0) {
      console.log('Webhook endpoint not found for event:', eventId);
      return false;
    }

    const endpoint = endpointQuery[0];

    if (!endpoint.active) {
      console.log('Webhook endpoint is disabled for event:', eventId);
      return false;
    }

    const signature = generateWebhookSignature(
      JSON.stringify(event.data),
      endpoint.secret
    );

    const now = new Date();
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SBTC-Signature': signature,
        'X-SBTC-Event-Id': event.id,
        'X-SBTC-Event-Type': event.eventType,
        'User-Agent': 'SBTC-Webhooks/1.0'
      },
      body: JSON.stringify(event.data),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const success = response.ok;
    const responseBody = await response.text().catch(() => '');

    // Calculate next retry time
    const nextRetryAt = success ? null : new Date(now.getTime() + Math.pow(2, event.attempts) * 1000);

    // Update delivery status
    await db.update(webhookEvents)
      .set({
        delivered: success,
        attempts: event.attempts + 1,
        lastAttemptedAt: now,
        nextRetryAt,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000) // Limit response body size
      })
      .where(eq(webhookEvents.id, eventId));

    if (!success) {
      console.error(`Webhook delivery failed for event ${eventId}: ${response.status} ${response.statusText}`);
      
      // Schedule retry if attempts < 5
      if (event.attempts < 4) {
        setTimeout(() => deliverWebhook(eventId), Math.pow(2, event.attempts) * 1000);
      }
    }

    return success;
  } catch (error) {
    console.error('Error delivering webhook:', error);
    
    try {
      // Get current attempts count and increment
      const currentEvent = await db
        .select({ attempts: webhookEvents.attempts })
        .from(webhookEvents)
        .where(eq(webhookEvents.id, eventId))
        .limit(1);
      
      if (currentEvent.length > 0) {
        const now = new Date();
        const nextRetryAt = new Date(now.getTime() + Math.pow(2, currentEvent[0].attempts) * 1000);
        
        await db.update(webhookEvents)
          .set({
            attempts: currentEvent[0].attempts + 1,
            lastAttemptedAt: now,
            nextRetryAt,
            responseBody: error instanceof Error ? error.message : 'Unknown error'
          })
          .where(eq(webhookEvents.id, eventId));
      }
    } catch (updateError) {
      console.error('Error updating webhook attempts:', updateError);
    }

    return false;
  }
}

// Legacy function for backward compatibility with old webhook events
async function deliverLegacyWebhook(eventId: string): Promise<boolean> {
  try {
    const eventQuery = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.id, eventId))
      .limit(1);

    const event = eventQuery[0];
    
    const merchantQuery = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, event.merchantId))
      .limit(1);

    if (merchantQuery.length === 0) {
      console.log('Merchant not found for event:', eventId);
      return false;
    }

    const merchant = merchantQuery[0];

    if (!merchant?.webhookUrl) {
      // Silently skip when no webhook URL is configured
      // Mark as delivered since there's nowhere to send it
      await db.update(webhookEvents)
        .set({
          delivered: true,
          attempts: 1,
          lastAttemptedAt: new Date(),
          responseBody: 'No webhook URL configured'
        })
        .where(eq(webhookEvents.id, eventId));
      return true;
    }

    const signature = generateWebhookSignature(
      JSON.stringify(event.data),
      merchant.webhookSecret || ''
    );

    const response = await fetch(merchant.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SBTC-Signature': signature,
        'X-SBTC-Event-Id': event.id,
        'X-SBTC-Event-Type': event.eventType,
        'User-Agent': 'SBTC-Webhooks/1.0'
      },
      body: JSON.stringify(event.data),
      signal: AbortSignal.timeout(30000)
    });

    const success = response.ok;

    await db.update(webhookEvents)
      .set({
        delivered: success,
        attempts: event.attempts + 1,
        lastAttemptedAt: new Date(),
        responseStatus: response.status
      })
      .where(eq(webhookEvents.id, eventId));

    return success;
  } catch (error) {
    console.error('Error delivering legacy webhook:', error);
    return false;
  }
}

export function generateWebhookSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): boolean {
  try {
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1) {
      return false;
    }

    const timestampNum = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance
    if (Math.abs(now - timestampNum) > tolerance) {
      return false;
    }

    // Verify signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}