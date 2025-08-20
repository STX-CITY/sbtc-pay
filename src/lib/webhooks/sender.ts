import crypto from 'crypto';
import { db, webhookEvents, merchants } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface WebhookPayload {
  id: string;
  type: 'payment_intent.created' | 'payment_intent.succeeded' | 'payment_intent.failed' | 'payment_intent.canceled';
  data: {
    object: any; // PaymentIntent object
  };
  created: number;
}

export async function createWebhookEvent(
  merchantId: string,
  eventType: WebhookPayload['type'],
  paymentIntentData: any
): Promise<string> {
  const webhookPayload: WebhookPayload = {
    id: `evt_${crypto.randomBytes(12).toString('base64url')}`,
    type: eventType,
    data: {
      object: paymentIntentData
    },
    created: Math.floor(Date.now() / 1000)
  };

  const [event] = await db.insert(webhookEvents).values({
    merchantId,
    eventType,
    paymentIntentId: paymentIntentData.id,
    data: webhookPayload,
    delivered: false,
    attempts: 0
  }).returning();

  // Trigger async webhook delivery
  deliverWebhook(event.id).catch(console.error);

  return event.id;
}

export async function deliverWebhook(eventId: string): Promise<boolean> {
  try {
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

    if (!merchant.webhookUrl) {
      console.log('No webhook URL configured for event:', eventId);
      return false;
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
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    const success = response.ok;

    // Update delivery status
    await db.update(webhookEvents)
      .set({
        delivered: success,
        attempts: event.attempts + 1
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
        await db.update(webhookEvents)
          .set({
            attempts: currentEvent[0].attempts + 1
          })
          .where(eq(webhookEvents.id, eventId));
      }
    } catch (updateError) {
      console.error('Error updating webhook attempts:', updateError);
    }

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