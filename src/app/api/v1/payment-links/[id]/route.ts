import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentLinks } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and } from 'drizzle-orm';

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

    // Update the payment link in the database
    const [updatedLink] = await db
      .update(paymentLinks)
      .set({
        isActive: validatedData.is_active,
        expiresAt: validatedData.expires_at ? new Date(validatedData.expires_at) : undefined,
      })
      .where(and(
        eq(paymentLinks.id, params.id),
        eq(paymentLinks.merchantId, auth.merchantId)
      ))
      .returning();

    if (!updatedLink) {
      return NextResponse.json(
        { error: { type: 'not_found_error', message: 'Payment link not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: updatedLink.id,
      is_active: updatedLink.isActive,
      expires_at: updatedLink.expiresAt,
      updated_at: new Date().toISOString()
    });
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

    // Delete the payment link from the database
    const deletedRows = await db
      .delete(paymentLinks)
      .where(and(
        eq(paymentLinks.id, params.id),
        eq(paymentLinks.merchantId, auth.merchantId)
      ));

    return NextResponse.json({ success: true, id: params.id });
  } catch (error) {
    console.error('Error deleting payment link:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to delete payment link' } },
      { status: 500 }
    );
  }
}