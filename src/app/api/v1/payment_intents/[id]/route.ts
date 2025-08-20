import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const paymentIntent = await db
      .select()
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.id, id),
          eq(paymentIntents.merchantId, auth.merchantId)
        )
      )
      .limit(1);

    if (paymentIntent.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json(formatPaymentIntentResponse(paymentIntent[0]));
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

    return NextResponse.json(formatPaymentIntentResponse(updatedPaymentIntent));
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