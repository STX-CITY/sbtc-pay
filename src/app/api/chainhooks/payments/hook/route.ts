import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

const chainhookEventSchema = z.object({
  apply: z.array(z.object({
    block_identifier: z.object({
      index: z.number(),
      hash: z.string()
    }),
    transactions: z.array(z.object({
      transaction_identifier: z.object({
        hash: z.string()
      }),
      metadata: z.object({
        success: z.boolean(),
        result: z.string().optional(),
        raw_result: z.string().optional()
      }),
      operations: z.array(z.object({
        type: z.string(),
        account: z.object({
          address: z.string()
        }),
        metadata: z.record(z.string(), z.any()).optional()
      }))
    }))
  })),
  rollback: z.array(z.any()).optional()
});

export async function POST(request: NextRequest) {
  try {
    // Verify authorization
    const authorization = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CHAINHOOK_SECRET || 'default-secret'}`;
    
    if (authorization !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const chainhookEvent = chainhookEventSchema.parse(body);

    console.log('Received chainhook event:', JSON.stringify(chainhookEvent, null, 2));

    // Process apply events (new transactions)
    for (const applyEvent of chainhookEvent.apply) {
      for (const transaction of applyEvent.transactions) {
        await processTransaction(transaction, applyEvent.block_identifier);
      }
    }

    return NextResponse.json({ message: 'Chainhook event processed successfully' });
  } catch (error) {
    console.error('Error processing chainhook event:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid chainhook event format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processTransaction(transaction: any, blockIdentifier: any) {
  try {
    const txId = transaction.transaction_identifier.hash;
    const success = transaction.metadata.success;

    console.log(`Processing transaction ${txId}, success: ${success}`);

    // Look for payment intents that might be associated with this transaction
    // This is a simplified approach - in production, you'd want to track
    // expected transactions more precisely
    const relevantPaymentIntents = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.status, 'pending'));

    for (const paymentIntent of relevantPaymentIntents) {
      // Check if this transaction could be for this payment intent
      // In a real implementation, you'd match by recipient address, amount, etc.
      const shouldUpdate = await shouldUpdatePaymentIntent(paymentIntent, transaction);
      
      if (shouldUpdate) {
        const newStatus = success ? 'succeeded' : 'failed';
        
        // Update payment intent status
        const [updatedPaymentIntent] = await db
          .update(paymentIntents)
          .set({
            status: newStatus,
            txId: txId,
            updatedAt: new Date()
          })
          .where(eq(paymentIntents.id, paymentIntent.id))
          .returning();

        // Create webhook event
        const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
        await createWebhookEvent(
          paymentIntent.merchantId,
          success ? 'payment_intent.succeeded' : 'payment_intent.failed',
          webhookData
        );

        console.log(`Updated payment intent ${paymentIntent.id} to status ${newStatus}`);
        break; // Only update one payment intent per transaction
      }
    }
  } catch (error) {
    console.error('Error processing individual transaction:', error);
  }
}

async function shouldUpdatePaymentIntent(paymentIntent: any, transaction: any): Promise<boolean> {
  // This is a simplified matching logic
  // In production, you'd want to match by:
  // - Recipient address (merchant's address)
  // - Transaction amount
  // - Transaction memo/metadata
  // - Time window
  
  // For demo purposes, we'll just match the first pending payment intent
  // within a reasonable time window (10 minutes)
  const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
  const paymentCreatedAt = new Date(paymentIntent.createdAt).getTime();
  
  return paymentCreatedAt > tenMinutesAgo;
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Chainhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}