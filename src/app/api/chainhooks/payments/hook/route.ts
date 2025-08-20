import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq, or } from 'drizzle-orm';

export const revalidate = 0;

// Enhanced schema based on Hiro chainhook format
const chainhookEventSchema = z.object({
  chainhook: z.object({
    uuid: z.string(),
    predicate: z.object({
      scope: z.string()
    })
  }),
  apply: z.array(z.object({
    block_identifier: z.object({
      index: z.number(),
      hash: z.string()
    }),
    parent_block_identifier: z.object({
      index: z.number(),
      hash: z.string()
    }),
    timestamp: z.number(),
    transactions: z.array(z.object({
      transaction_identifier: z.object({
        hash: z.string()
      }),
      operations: z.array(z.any()),
      metadata: z.object({
        success: z.boolean(),
        result: z.string().optional(),
        description: z.string().optional(),
        sponsor: z.object({
          address: z.string()
        }).optional(),
        sender: z.string(),
        fee: z.string(),
        kind: z.object({
          type: z.string(),
          data: z.object({
            signer: z.string(),
            sponsor: z.string().optional()
          }).optional()
        }),
        receipt: z.object({
          mutated_contracts_radius: z.array(z.string()),
          mutated_assets_radius: z.array(z.string()),
          contract_calls_stack: z.array(z.any()),
          events: z.array(z.object({
            position: z.object({
              index: z.number()
            }),
            type: z.string(),
            data: z.any()
          }))
        })
      })
    }))
  })),
  rollback: z.array(z.any()).optional()
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization with CHAINHOOK_BEARER token
    const authorization = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CHAINHOOK_BEARER || 'your-bearer-token'}`;
    
    if (authorization !== expectedAuth) {
      console.error('Unauthorized chainhook request, expected:', expectedAuth.substring(0, 20) + '...', 'got:', authorization?.substring(0, 20) + '...');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const chainhookEvent = chainhookEventSchema.parse(body);

    console.log('Received chainhook event:', JSON.stringify(chainhookEvent, null, 2));

    // Process apply events (new transactions)
    for (const applyEvent of chainhookEvent.apply) {
      for (const transaction of applyEvent.transactions) {
        await processTransaction(transaction, applyEvent.block_identifier, applyEvent.timestamp);
      }
    }

    return NextResponse.json({ message: 'sBTC payment chainhook event processed successfully' });
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

async function processTransaction(transaction: any, blockIdentifier: any, timestamp: number) {
  try {
    const txId = transaction.transaction_identifier.hash;
    const success = transaction.metadata.success;
    const blockHeight = blockIdentifier.index;
    const blockHash = blockIdentifier.hash;

    console.log(`Processing sBTC payment transaction ${txId}, success: ${success}, block: ${blockHeight}`);

    // First, try to find payment intent by exact transaction ID match
    let paymentIntent = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.txId, txId))
      .limit(1);

    // If no exact match, look for pending payment intents that might match this transaction
    if (paymentIntent.length === 0) {
      const relevantPaymentIntents = await db
        .select()
        .from(paymentIntents)
        .where(or(
          eq(paymentIntents.status, 'pending'),
          eq(paymentIntents.status, 'created')
        ));

      // Try to match payment intent based on transaction details
      for (const intent of relevantPaymentIntents) {
        const shouldUpdate = await shouldUpdatePaymentIntent(intent, transaction);
        if (shouldUpdate) {
          paymentIntent = [intent];
          break;
        }
      }
    }

    if (paymentIntent.length === 0) {
      console.log(`No matching payment intent found for transaction ${txId}`);
      return;
    }

    const intent = paymentIntent[0];
    const newStatus = success ? 'succeeded' : 'failed';
    
    // Enhanced metadata with blockchain details
    const updatedMetadata = {
      ...intent.metadata,
      chainhook_processed_at: new Date().toISOString(),
      block_height: blockHeight,
      block_hash: blockHash,
      block_timestamp: timestamp,
      transaction_fee: transaction.metadata.fee,
      transaction_result: transaction.metadata.result,
      transaction_description: transaction.metadata.description,
      transaction_sender: transaction.metadata.sender,
      transaction_kind: transaction.metadata.kind.type,
      receipt_events: transaction.metadata.receipt.events.length,
      mutated_contracts: transaction.metadata.receipt.mutated_contracts_radius,
      mutated_assets: transaction.metadata.receipt.mutated_assets_radius
    };
    
    // Update payment intent status
    const [updatedPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        status: newStatus,
        txId: txId,
        metadata: updatedMetadata,
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, intent.id))
      .returning();

    console.log(`Updated payment intent ${intent.id} to status ${newStatus} for transaction ${txId}`);

    // Create webhook event for merchant
    try {
      const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
      await createWebhookEvent(
        intent.merchantId,
        success ? 'payment_intent.succeeded' : 'payment_intent.failed',
        webhookData
      );
      console.log(`Sent webhook event for payment intent ${intent.id}`);
    } catch (webhookError) {
      console.error('Error sending webhook:', webhookError);
    }

    // TODO: Send email notification to customer if email provided
    // TODO: Trigger additional payment success/failure actions
    
  } catch (error) {
    console.error('Error processing individual transaction:', error);
  }
}

async function shouldUpdatePaymentIntent(paymentIntent: any, transaction: any): Promise<boolean> {
  try {
    // Enhanced matching logic for sBTC payments
    const txId = transaction.transaction_identifier.hash;
    const sender = transaction.metadata.sender;
    const events = transaction.metadata.receipt.events;
    
    console.log(`Evaluating payment intent ${paymentIntent.id} for transaction ${txId}`);
    
    // 1. Check time window (within 30 minutes of payment intent creation)
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    const paymentCreatedAt = new Date(paymentIntent.createdAt).getTime();
    
    if (paymentCreatedAt < thirtyMinutesAgo) {
      console.log(`Payment intent ${paymentIntent.id} too old for matching`);
      return false;
    }
    
    // 2. Check if this is an sBTC transaction by looking at events
    const hasSbtcTransfer = events.some((event: any) => {
      try {
        // Look for fungible token transfer events that involve sBTC
        return event.type === 'ft_transfer_event' && 
               event.data?.asset_identifier?.includes('sbtc');
      } catch (e) {
        return false;
      }
    });
    
    if (!hasSbtcTransfer) {
      console.log(`Transaction ${txId} does not appear to be an sBTC transfer`);
      return false;
    }
    
    // 3. Check amount matching (if we can extract it from events)
    try {
      const transferEvent = events.find((event: any) => 
        event.type === 'ft_transfer_event' && 
        event.data?.asset_identifier?.includes('sbtc')
      );
      
      if (transferEvent && transferEvent.data?.amount) {
        const txAmount = parseInt(transferEvent.data.amount);
        const expectedAmount = paymentIntent.amount;
        
        // Allow for small differences due to fees (within 1%)
        const tolerance = Math.max(expectedAmount * 0.01, 100); // 1% or 100 microsBTC minimum
        const amountDifference = Math.abs(txAmount - expectedAmount);
        
        if (amountDifference > tolerance) {
          console.log(`Amount mismatch: expected ${expectedAmount}, got ${txAmount}, difference ${amountDifference}`);
          return false;
        }
        
        console.log(`Amount match: expected ${expectedAmount}, got ${txAmount}`);
      }
    } catch (amountError) {
      console.log('Could not verify amount from transaction events, proceeding with other checks');
    }
    
    // 4. Check recipient address (if available in metadata)
    try {
      const recipientAddress = paymentIntent.metadata?.recipient_address;
      if (recipientAddress) {
        const transferEvent = events.find((event: any) => 
          event.type === 'ft_transfer_event' && 
          event.data?.asset_identifier?.includes('sbtc')
        );
        
        if (transferEvent && transferEvent.data?.recipient) {
          if (transferEvent.data.recipient !== recipientAddress) {
            console.log(`Recipient mismatch: expected ${recipientAddress}, got ${transferEvent.data.recipient}`);
            return false;
          }
          console.log(`Recipient match: ${recipientAddress}`);
        }
      }
    } catch (recipientError) {
      console.log('Could not verify recipient from transaction events');
    }
    
    console.log(`Payment intent ${paymentIntent.id} matches transaction ${txId}`);
    return true;
    
  } catch (error) {
    console.error('Error in shouldUpdatePaymentIntent:', error);
    // If we can't determine, fall back to simple time-based matching
    const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
    const paymentCreatedAt = new Date(paymentIntent.createdAt).getTime();
    return paymentCreatedAt > tenMinutesAgo;
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Chainhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}