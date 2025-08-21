import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents, merchants } from '@/lib/db';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantRecipientAddress: merchants.recipientAddress,
        merchantStacksAddress: merchants.stacksAddress
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .where(eq(paymentIntents.id, id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const { paymentIntent, merchantRecipientAddress, merchantStacksAddress } = result[0];
    const formattedPaymentIntent = formatPaymentIntentResponse(paymentIntent);
    
    return NextResponse.json({
      ...formattedPaymentIntent,
      recipient_address: merchantRecipientAddress || merchantStacksAddress
    });
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

const updatePaymentIntentSchema = z.object({
  description: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_address: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  tx_id: z.string().optional()
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const validatedData = updatePaymentIntentSchema.parse(body);

    const [updatedPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        description: validatedData.description,
        customerEmail: validatedData.customer_email,
        customerAddress: validatedData.customer_address,
        metadata: validatedData.metadata,
        txId: validatedData.tx_id,
        updatedAt: new Date()
      })
      .where(eq(paymentIntents.id, id))
      .returning();

    if (!updatedPaymentIntent) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    // Get merchant data to include recipient address
    const merchantResult = await db
      .select({
        recipientAddress: merchants.recipientAddress,
        stacksAddress: merchants.stacksAddress
      })
      .from(merchants)
      .where(eq(merchants.id, updatedPaymentIntent.merchantId))
      .limit(1);

    const merchant = merchantResult[0];
    const formattedPaymentIntent = formatPaymentIntentResponse(updatedPaymentIntent);
    
    return NextResponse.json({
      ...formattedPaymentIntent,
      recipient_address: merchant?.recipientAddress || merchant?.stacksAddress
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error updating payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}