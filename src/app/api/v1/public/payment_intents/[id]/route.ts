import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, merchants } from '@/lib/db';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentIntentId = params.id;

    // Join with merchants to get the recipient address
    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantStacksAddress: merchants.stacksAddress
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

    const { paymentIntent, merchantStacksAddress } = result[0];

    // Parse metadata to get product data if available
    const metadata = paymentIntent.metadata || {};
    const productData = metadata.product;

    // Return public payment intent data (no sensitive merchant info)
    const publicPaymentIntent = {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      amount_usd: paymentIntent.amountUsd ? parseFloat(paymentIntent.amountUsd) : undefined,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      description: paymentIntent.description,
      customer_address: paymentIntent.customerAddress,
      recipient_address: merchantStacksAddress, // Where customer should send payment
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