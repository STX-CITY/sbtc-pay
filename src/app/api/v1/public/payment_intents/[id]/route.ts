import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, merchants } from '@/lib/db';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { createWebhookEvent } from '@/lib/webhooks/sender';
import { eq } from 'drizzle-orm';
import { getRandomHeader } from '@/lib/utils/headers';


// Check transaction status from Hiro API
async function checkTransactionStatus(txId: string): Promise<'pending' | 'succeeded' | 'failed' | null> {
  try {
    const apiUrl = `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

    const response = await fetch(apiUrl, { headers: getRandomHeader() });
    if (!response.ok) {
      console.error(`Failed to fetch transaction ${txId} from Hiro API`);
      return null;
    }

    const txData = await response.json();
    
    if (txData.tx_status === 'success') {
      return 'succeeded';
    } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
      return 'failed';
    } else {
      return 'pending';
    }
  } catch (error) {
    console.error('Error checking transaction status:', error);
    return null;
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paymentIntentId } = await params;

    console.log('inside the /api/v1/public/payment_intents/')

    // Join with merchants to get the recipient address and redirect info
    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantStacksAddress: merchants.stacksAddress,
        merchantRecipientAddress: merchants.recipientAddress,
        merchantRedirectUrl: merchants.checkoutRedirectUrl,
        merchantName: merchants.name
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .where(eq(paymentIntents.id, paymentIntentId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const { paymentIntent, merchantStacksAddress, merchantRecipientAddress, merchantRedirectUrl, merchantName } = result[0];
    
    // If payment has a tx_id and status is pending, re-check with Hiro API
    // This is a fallback in case chainhook has an error
    let effectiveStatus = paymentIntent.status;
    if (paymentIntent.txId && (paymentIntent.status === 'pending' || paymentIntent.status === 'created')) {
      console.log(`checking transaction ${paymentIntent.txId}`)
      const hiroStatus = await checkTransactionStatus(paymentIntent.txId);
      
      // If Hiro API returns a confirmed status (succeeded or failed), update the database
      if (hiroStatus && hiroStatus !== 'pending') {
        try {
          const [updatedPaymentIntent] = await db
            .update(paymentIntents)
            .set({
              status: hiroStatus,
              updatedAt: new Date(),
              metadata: {
                ...(paymentIntent.metadata as Record<string, any> || {}),
                hiro_api_check: new Date().toISOString(),
                status_updated_from: 'hiro_api_fallback'
              }
            })
            .where(eq(paymentIntents.id, paymentIntentId))
            .returning();
          
          if (updatedPaymentIntent) {
            effectiveStatus = hiroStatus;
            console.log(`Updated payment intent ${paymentIntentId} status from ${paymentIntent.status} to ${hiroStatus} via Hiro API`);
            
            // Send webhook event for status change
            try {
              const webhookData = formatPaymentIntentResponse(updatedPaymentIntent);
              const eventType = hiroStatus === 'succeeded' 
                ? 'payment_intent.succeeded' 
                : 'payment_intent.failed';
              await createWebhookEvent(paymentIntent.merchantId, eventType, webhookData);
              console.log(`Sent ${eventType} webhook event for payment intent ${paymentIntentId}`);
            } catch (webhookError) {
              console.error('Error sending webhook:', webhookError);
            }
          }
        } catch (updateError) {
          console.error('Error updating payment intent status:', updateError);
          // Still use the Hiro status for response even if DB update fails
          effectiveStatus = hiroStatus;
        }
      } else if (hiroStatus) {
        effectiveStatus = hiroStatus;
      }
    }

    // Parse metadata to get product data if available
    const metadata = (paymentIntent.metadata as Record<string, any>) || {};
    const productData = metadata.product;

    // Return public payment intent data (no sensitive merchant info)
    const publicPaymentIntent = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      amount_usd: paymentIntent.amountUsd ? parseFloat(paymentIntent.amountUsd) : undefined,
      currency: paymentIntent.currency,
      status: effectiveStatus, // Use the effective status (may be updated from Hiro API)
      description: paymentIntent.description,
      customer_address: paymentIntent.customerAddress,
      recipient_address: merchantRecipientAddress || merchantStacksAddress, // Where customer should send payment
      tx_id: paymentIntent.txId, // Include tx_id if available
      merchant_redirect_url: merchantRedirectUrl, // Include merchant redirect URL
      merchant_name: merchantName, // Include merchant name
      created: Math.floor(paymentIntent.createdAt.getTime() / 1000),
      
      // Include product data from metadata if available
      product: productData ? {
        id: productData.id,
        name: productData.name,
        description: productData.description,
        type: productData.type,
        price: productData.price,
        price_usd: productData.priceUsd,
        currency: productData.currency,
        images: productData.images,
        active: productData.active,
        created_at: productData.createdAt,
        updated_at: productData.updatedAt
      } : undefined
    };

    return NextResponse.json(publicPaymentIntent);

  } catch (error) {
    console.error('Error fetching public payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}