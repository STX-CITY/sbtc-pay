import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/lib/auth/middleware';

const updatePaymentLinkSchema = z.object({
  is_active: z.boolean().optional(),
  expires_at: z.string().optional()
});

// PATCH /api/v1/payment-links/[id] - Update payment link
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updatePaymentLinkSchema.parse(body);

    // In production, you would update the payment_links table:
    // const [updatedLink] = await db
    //   .update(paymentLinks)
    //   .set({
    //     isActive: validatedData.is_active,
    //     expiresAt: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined,
    //     updatedAt: new Date()
    //   })
    //   .where(and(
    //     eq(paymentLinks.id, params.id),
    //     eq(paymentLinks.merchantId, auth.merchantId)
    //   ))
    //   .returning();

    // For now, return a mock response
    const updatedLink = {
      id: params.id,
      is_active: validatedData.is_active ?? true,
      updated_at: new Date().toISOString()
    };

    return NextResponse.json(updatedLink);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Invalid request data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Error updating payment link:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to update payment link' } },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/payment-links/[id] - Delete payment link
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid API key' } },
        { status: 401 }
      );
    }

    // In production, you would delete from the payment_links table:
    // await db
    //   .delete(paymentLinks)
    //   .where(and(
    //     eq(paymentLinks.id, params.id),
    //     eq(paymentLinks.merchantId, auth.merchantId)
    //   ));

    console.log('Payment link deleted:', params.id);

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to delete payment link' } },
      { status: 500 }
    );
  }
}