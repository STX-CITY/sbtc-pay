import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, merchants } from '@/lib/db';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

// Random headers to avoid rate limiting
function getRandomHeader() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  ];
  
  return {
    'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  };
}

// Check transaction status from Hiro API
async function checkTransactionStatus(txId: string): Promise<'pending' | 'succeeded' | 'failed' | null> {
  try {
    const isMainnet = process.env.NODE_ENV === 'production';
    const apiUrl = isMainnet 
      ? `https://api.mainnet.hiro.so/extended/v1/tx/${txId}`
      : `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

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

    // Join with merchants to get the recipient address
    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantStacksAddress: merchants.stacksAddress,
        merchantRecipientAddress: merchants.recipientAddress
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

    const { paymentIntent, merchantStacksAddress, merchantRecipientAddress } = result[0];
    
    // If payment has a tx_id and status is pending, re-check with Hiro API
    // This is a fallback in case chainhook has an error
    let effectiveStatus = paymentIntent.status;
    if (paymentIntent.txId && (paymentIntent.status === 'pending' || paymentIntent.status === 'created')) {
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