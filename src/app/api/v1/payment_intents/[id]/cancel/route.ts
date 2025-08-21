import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { formatPaymentIntentResponse } from '@/lib/payments/utils';
import { eq, and } from 'drizzle-orm';

export async function POST(
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

    // First, get the current payment intent
    const currentPaymentIntent = await db
      .select()
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.id, id),
          eq(paymentIntents.merchantId, auth.merchantId)
        )
      )
      .limit(1);

    if (currentPaymentIntent.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const paymentIntent = currentPaymentIntent[0];

    // Check if payment intent can be canceled
    if (!['created', 'pending'].includes(paymentIntent.status)) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: `Payment intent cannot be canceled in status: ${paymentIntent.status}` } },
        { status: 400 }
      );
    }

    // Update payment intent to canceled status
    const [canceledPaymentIntent] = await db
      .update(paymentIntents)
      .set({
        status: 'canceled',
        updatedAt: new Date(),
      })
      .where(eq(paymentIntents.id, (await params).id))
      .returning();

    return NextResponse.json(formatPaymentIntentResponse(canceledPaymentIntent));
  } catch (error) {
    console.error('Error canceling payment intent:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}