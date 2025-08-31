import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents } from '@/lib/db';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';
import { getRandomHeader } from '@/lib/utils/headers';

export const revalidate = 0;


// Extract sBTC transfer details from chainhook body
interface SBTCTransferDetails {
  amount: number;
  sender: string;
  recipient: string;
  txId: string;
  blockHeight: number;
  blockHash: string;
  success: boolean;
}

function extractSBTCTransferFromBody(body: any): SBTCTransferDetails | null {
  try {
    // Check if there are apply blocks with transactions
    if (!body.apply || body.apply.length === 0) {
      return null;
    }

    const block = body.apply[0];
    if (!block.transactions || block.transactions.length === 0) {
      return null;
    }

    // Process each transaction in the block
    for (const tx of block.transactions) {
      // Check if it's an sBTC transfer
      if (tx.metadata?.kind?.type === 'ContractCall' && 
          tx.metadata.kind.data?.contract_identifier?.includes('sbtc-token') &&
          tx.metadata.kind.data?.method === 'transfer') {
        
        // Extract transfer details from operations
        const operations = tx.operations || [];
        let sender = '';
        let recipient = '';
        let amount = 0;

        for (const op of operations) {
          if (op.type === 'DEBIT' && op.amount?.currency?.metadata?.asset_class_identifier?.includes('sbtc')) {
            sender = op.account?.address || '';
            amount = op.amount?.value || 0;
          } else if (op.type === 'CREDIT' && op.amount?.currency?.metadata?.asset_class_identifier?.includes('sbtc')) {
            recipient = op.account?.address || '';
          }
        }

        // Alternative: Extract from FTTransferEvent if operations are not available
        if ((!sender || !recipient) && tx.metadata?.receipt?.events) {
          for (const event of tx.metadata.receipt.events) {
            if (event.type === 'FTTransferEvent' && 
                event.data?.asset_identifier?.includes('sbtc')) {
              sender = event.data.sender || sender;
              recipient = event.data.recipient || recipient;
              amount = parseInt(event.data.amount) || amount;
            }
          }
        }

        if (sender && recipient && amount > 0) {
          return {
            amount,
            sender,
            recipient,
            txId: tx.transaction_identifier?.hash || '',
            blockHeight: block.block_identifier?.index || 0,
            blockHash: block.block_identifier?.hash || '',
            success: tx.metadata?.success === true
          };
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error extracting sBTC transfer from body:', error);
    return null;
  }
}

// Extract sBTC amount from transaction events (fallback for Hiro API)
function extractSBTCAmountFromTx(txData: any): number | null {
  try {
    if (txData.events) {
      for (const event of txData.events) {
        if (event.event_type === 'fungible_token_asset' &&
          event.asset_identifier?.includes('sbtc')) {
          console.log(event.amount)
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
async function updatePaymentIntentStatus(
  paymentIntent: any, 
  txId: string, 
  blockHeight?: number, 
  blockHash?: string, 
  chainhookUuid?: string
) {
  // Update payment intent to succeeded
  const [updatedPaymentIntent] = await db.update(paymentIntents)
    .set({
      status: 'succeeded',
      txId: txId,
      updatedAt: new Date(),
      metadata: {
        ...paymentIntent.metadata,
        processed_at: new Date().toISOString(),
        block_height: blockHeight,
        block_hash: blockHash,
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
  if (chainhookUuid) {
    await deleteChainbook(chainhookUuid);
  }
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

    // First try to extract transfer details from the webhook body
    const transferDetails = extractSBTCTransferFromBody(body);
    
    if (transferDetails && transferDetails.success) {
      // Use transfer details from webhook body directly
      const { txId: transferTxId, amount: sbtcAmount, recipient, sender, blockHeight, blockHash } = transferDetails;
      console.log(`Extracted sBTC transfer from webhook: ${transferTxId}, amount: ${sbtcAmount}, from: ${sender}, to: ${recipient}`);
      
      // Process successful transaction
      if (true) { // Always true since we check transferDetails.success above
        console.log(`sBTC payment transaction successful: ${transferTxId || txId}`);

        try {
          // Find payment intent by transaction ID first
          const [paymentIntent] = await db
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.txId, transferTxId || txId))
            .limit(1);

          if (!paymentIntent) {
            // Try to find by pending status and amount matching
            if (sbtcAmount) {
              const matchingPaymentIntents = await db
                .select()
                .from(paymentIntents)
                .where(eq(paymentIntents.status, 'pending'));

              // Find payment intent with matching amount (allow 1% tolerance) and recipient address
              for (const intent of matchingPaymentIntents) {
                // Also verify recipient address if available
                const metadata = intent.metadata as Record<string, any> || {};
                const intentRecipient = metadata.recipient_address || metadata.merchant_address;
                const recipientMatches = !intentRecipient || !recipient || 
                  intentRecipient.toLowerCase() === recipient.toLowerCase();
                
                if (verifyPaymentAmount(intent, sbtcAmount) && recipientMatches) {
                  await updatePaymentIntentStatus(intent, transferTxId || txId, blockHeight, blockHash, chainhookUuid);
                  console.log(`Matched pending payment intent ${intent.id} with transaction ${transferTxId || txId}`);
                  break;
                }
              }
            }

            console.log(`No matching payment intent found for transaction ${transferTxId || txId}`);
            return new NextResponse(JSON.stringify({ success: true, txId: transferTxId || txId, message: 'No matching payment intent' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          } else {
            // Verify the sBTC amount matches the payment intent
            if (sbtcAmount && verifyPaymentAmount(paymentIntent, sbtcAmount)) {
              await updatePaymentIntentStatus(paymentIntent, transferTxId || txId, blockHeight, blockHash, chainhookUuid);
            } else {
              console.error(`Amount mismatch for payment intent ${paymentIntent.id}: expected ${paymentIntent.amount}, got ${sbtcAmount}`);
              return new NextResponse(JSON.stringify({ error: 'Amount mismatch' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              });
            }
          }

          console.log(`Successfully processed sBTC payment for tx_id: ${transferTxId || txId}`);
        } catch (error) {
          console.error(`Error updating payment intent:`, error);
          return new NextResponse(JSON.stringify({ error: 'Database update failed' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    } else if (txId && !transferDetails) {
      // Fallback to Hiro API if we couldn't extract details from webhook body
      console.log('Falling back to Hiro API for transaction details');
      
      const isMainnet = process.env.NODE_ENV === 'production';
      const apiUrl = isMainnet
        ? `https://api.testnet.hiro.so/extended/v1/tx/${txId}`
        : `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

      const txResponse = await fetch(apiUrl, { headers: getRandomHeader() });
      if (!txResponse.ok) {
        console.error(`Failed to fetch transaction details: ${txResponse.statusText}`);
        return new NextResponse('Failed to fetch transaction', { status: 400 });
      }
      const txData = await txResponse.json();

      if (txData.tx_status === "success") {
        console.log(`sBTC payment transaction successful: ${txId}`);
        
        try {
          const [paymentIntent] = await db
            .select()
            .from(paymentIntents)
            .where(eq(paymentIntents.txId, txId))
            .limit(1);

          if (paymentIntent) {
            const sbtcAmount = extractSBTCAmountFromTx(txData);
            if (sbtcAmount && verifyPaymentAmount(paymentIntent, sbtcAmount)) {
              await updatePaymentIntentStatus(paymentIntent, txId, txData.block_height, txData.block_hash, chainhookUuid);
            }
          }
        } catch (error) {
          console.error(`Error updating payment intent:`, error);
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
            try {
              const webhookData = formatPaymentIntentResponse(paymentIntent);
              await createWebhookEvent(paymentIntent.merchantId, 'payment_intent.failed', webhookData);
            } catch (webhookError) {
              console.error('Failed to send payment_intent.failed webhook:', webhookError);
              // Continue without failing the request
            }
          }

          // Delete chainhook after processing
          await deleteChainbook(chainhookUuid);

        } catch (error) {
          console.error(`Error processing failed transaction:`, error);
        }
      }

      // Returning a success response
      return new NextResponse(JSON.stringify({ success: true, txId: txId || '' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (transferDetails && !transferDetails.success) {
      // Handle failed transaction from webhook body
      console.log(`sBTC payment transaction failed: ${transferDetails.txId}`);
      
      try {
        const [paymentIntent] = await db
          .select()
          .from(paymentIntents)
          .where(eq(paymentIntents.txId, transferDetails.txId))
          .limit(1);

        if (paymentIntent) {
          await db.update(paymentIntents)
            .set({
              status: 'failed',
              updatedAt: new Date(),
              metadata: {
                ...(paymentIntent.metadata || {}),
                failure_reason: 'Transaction failed',
                processed_at: new Date().toISOString(),
                block_height: transferDetails.blockHeight,
                block_hash: transferDetails.blockHash
              }
            })
            .where(eq(paymentIntents.id, paymentIntent.id));

          // Send webhook notification
          try {
            const webhookData = formatPaymentIntentResponse(paymentIntent);
            await createWebhookEvent(paymentIntent.merchantId, 'payment_intent.failed', webhookData);
          } catch (webhookError) {
            console.error('Failed to send payment_intent.failed webhook:', webhookError);
          }
        }

        // Delete chainhook after processing
        if (chainhookUuid) {
          await deleteChainbook(chainhookUuid);
        }
      } catch (error) {
        console.error(`Error processing failed transaction:`, error);
      }
      
      return new NextResponse(JSON.stringify({ success: true, txId: transferDetails.txId }), {
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