import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents } from '@/lib/db';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';
import { getRandomHeader } from '@/lib/utils/headers';

export const revalidate = 0;


// Extract sBTC amount from transaction events
function extractSBTCAmountFromTx(txData: any): number | null {
  try {
    if (txData.events) {
      for (const event of txData.events) {
        if (event.event_type === 'ft_transfer_event' && 
            event.asset_identifier?.includes('sbtc')) {
          return parseInt(event.amount);
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error extracting sBTC amount:', error);
    return null;
  }
}

// Verify payment amount matches with tolerance
function verifyPaymentAmount(paymentIntent: any, txAmount: number): boolean {
  const tolerance = Math.max(paymentIntent.amount * 0.01, 100); // 1% or 100 microsBTC minimum
  const amountDifference = Math.abs(txAmount - paymentIntent.amount);
  return amountDifference <= tolerance;
}

// Update payment intent status
async function updatePaymentIntentStatus(paymentIntent: any, txId: string, txData: any, chainhookUuid: string) {
  // Update payment intent to succeeded
  const [updatedPaymentIntent] = await db.update(paymentIntents)
    .set({
      status: 'succeeded',
      txId: txId,
      updatedAt: new Date(),
      metadata: {
        ...paymentIntent.metadata,
        processed_at: new Date().toISOString(),
        block_height: txData.block_height,
        block_hash: txData.block_hash,
        transaction_fee: txData.fee_rate,
        chainhook_uuid: chainhookUuid
      }
    })
    .where(eq(paymentIntents.id, paymentIntent.id))
    .returning();

  console.log(`Updated payment intent ${paymentIntent.id} to succeeded for transaction ${txId}`);

  // Send webhook notification to merchant
  try {
    const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
    await createWebhookEvent(paymentIntent.merchantId, 'payment_intent.succeeded', webhookData);
    console.log(`Sent webhook event for payment intent ${paymentIntent.id}`);
  } catch (webhookError) {
    console.error('Error sending webhook:', webhookError);
  }

  // Delete chainhook after successful processing
  await deleteChainbook(chainhookUuid);
}

// Delete chainhook after processing
async function deleteChainbook(chainhookUuid: string) {
  try {
    const CHAINHOOK_API = process.env.CHAINHOOK_API_KEY || 'your-chainhook-api-key';
    const deleteResponse = await fetch(`https://api.platform.hiro.so/v1/ext/${CHAINHOOK_API}/chainhooks/${chainhookUuid}`, {
      method: "DELETE",
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!deleteResponse.ok) {
      console.error(`Failed to delete chainhook: ${deleteResponse.statusText}`);
    } else {
      console.log(`Chainhook deleted successfully: ${chainhookUuid}`);
    }
  } catch (error) {
    console.error('Error deleting chainhook:', error);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization with CHAINHOOK_BEARER token
    const authorization = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CHAINHOOK_BEARER || 'your-bearer-token'}`;
    
    if (authorization !== expectedAuth) {
      console.error('Unauthorized chainhook request, expected:', expectedAuth.substring(0, 20) + '...', 'got:', authorization?.substring(0, 20) + '...');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reading JSON body from the request
    let body;
    try {
        body = await request.json();
    } catch (error) {
        return new NextResponse('Invalid JSON', { status: 400 });
    }

    const txId = body.chainhook?.predicate?.equals;
    const chainhookUuid = body.chainhook?.uuid;

    console.log('Received sBTC payment chainhook event:', JSON.stringify(body, null, 2));

    if (txId) {
      // Determine network based on environment or chainhook data
      const isMainnet = process.env.NODE_ENV === 'production';
      const apiUrl = isMainnet 
        ? `https://api.testnet.hiro.so/extended/v1/tx/${txId}`
        : `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

      // Fetch transaction details
      const txResponse = await fetch(apiUrl, { headers: getRandomHeader() });
      if (!txResponse.ok) {
          console.error(`Failed to fetch transaction details: ${txResponse.statusText}`);
          return new NextResponse('Failed to fetch transaction', { status: 400 });
      }
      const txData = await txResponse.json();

      // Check if transaction was successful
      if (txData.tx_status === "success") {
          console.log(`sBTC payment transaction successful: ${txId}`);
          
          try {
              // Find payment intent by transaction ID first
              const [paymentIntent] = await db
                  .select()
                  .from(paymentIntents)
                  .where(eq(paymentIntents.txId, txId))
                  .limit(1);

              if (!paymentIntent) {
                  // Try to find by pending status and amount matching
                  const sbtcAmount = extractSBTCAmountFromTx(txData);
                  if (sbtcAmount) {
                      const matchingPaymentIntents = await db
                          .select()
                          .from(paymentIntents)
                          .where(eq(paymentIntents.status, 'pending'));

                      // Find payment intent with matching amount (allow 1% tolerance)
                      for (const intent of matchingPaymentIntents) {
                          if (verifyPaymentAmount(intent, sbtcAmount)) {
                              await updatePaymentIntentStatus(intent, txId, txData, chainhookUuid);
                              console.log(`Matched pending payment intent ${intent.id} with transaction ${txId}`);
                              break;
                          }
                      }
                  }
                  
                  console.log(`No matching payment intent found for transaction ${txId}`);
                  return new NextResponse(JSON.stringify({ success: true, txId, message: 'No matching payment intent' }), {
                      status: 200,
                      headers: { 'Content-Type': 'application/json' }
                  });
              } else {
                  // Verify the sBTC amount matches the payment intent
                  const sbtcAmount = extractSBTCAmountFromTx(txData);
                  if (sbtcAmount && verifyPaymentAmount(paymentIntent, sbtcAmount)) {
                      await updatePaymentIntentStatus(paymentIntent, txId, txData, chainhookUuid);
                  } else {
                      console.error(`Amount mismatch for payment intent ${paymentIntent.id}: expected ${paymentIntent.amount}, got ${sbtcAmount}`);
                      return new NextResponse(JSON.stringify({ error: 'Amount mismatch' }), {
                          status: 400,
                          headers: { 'Content-Type': 'application/json' }
                      });
                  }
              }
              
              console.log(`Successfully processed sBTC payment for tx_id: ${txId}`);
          } catch (error) {
              console.error(`Error updating payment intent:`, error);
              return new NextResponse(JSON.stringify({ error: 'Database update failed' }), {
                  status: 500,
                  headers: { 'Content-Type': 'application/json' }
              });
          }
      } else {
          // Transaction failed
          console.log(`sBTC payment transaction failed: ${txId}`);
          
          try {
              const [paymentIntent] = await db
                  .select()
                  .from(paymentIntents)
                  .where(eq(paymentIntents.txId, txId))
                  .limit(1);

              if (paymentIntent) {
                  await db.update(paymentIntents)
                      .set({ 
                          status: 'failed',
                          updatedAt: new Date(),
                          metadata: {
                              ...(paymentIntent.metadata || {}),
                              failure_reason: txData.tx_result?.repr || 'Transaction failed',
                              processed_at: new Date().toISOString()
                          }
                      })
                      .where(eq(paymentIntents.id, paymentIntent.id));

                  // Send webhook notification
                  const webhookData = formatPaymentIntentResponse(paymentIntent);
                  await createWebhookEvent(paymentIntent.merchantId, 'payment_intent.failed', webhookData);
              }

              // Delete chainhook after processing
              await deleteChainbook(chainhookUuid);
              
          } catch (error) {
              console.error(`Error processing failed transaction:`, error);
          }
      }

      // Returning a success response
      return new NextResponse(JSON.stringify({ success: true, txId }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
      });
    }

    return NextResponse.json({ message: 'sBTC payment chainhook processed' });
  } catch (error) {
    console.error('Error processing chainhook event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'sBTC Payment Chainhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}