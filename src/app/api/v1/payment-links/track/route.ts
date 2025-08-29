import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, paymentLinks } from '@/lib/db';
import { eq, and, sql } from 'drizzle-orm';

const trackPaymentLinkSchema = z.object({
  link_code: z.string(),
  product_id: z.string()
});

// POST /api/v1/payment-links/track - Track payment link usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = trackPaymentLinkSchema.parse(body);

    // Find the payment link by link_code and product_id
    const [paymentLink] = await db
      .select()
      .from(paymentLinks)
      .where(
        and(
          eq(paymentLinks.linkCode, validatedData.link_code),
          eq(paymentLinks.productId, validatedData.product_id)
        )
      )
      .limit(1);

    if (!paymentLink) {
      // Link code not found - it's a direct checkout, not a tracked payment link
      return NextResponse.json({ tracked: false });
    }

    // Check if link is active
    if (!paymentLink.isActive) {
      return NextResponse.json(
        { error: { type: 'invalid_link', message: 'This payment link is no longer active' } },
        { status: 400 }
      );
    }

    // Check if link has expired
    if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: { type: 'expired_link', message: 'This payment link has expired' } },
        { status: 400 }
      );
    }

    // Update the payment link tracking
    await db
      .update(paymentLinks)
      .set({
        usedCount: sql`${paymentLinks.usedCount} + 1`,
        lastUsedAt: new Date()
      })
      .where(eq(paymentLinks.id, paymentLink.id));

    return NextResponse.json({ 
      tracked: true,
      link_id: paymentLink.id,
      email: paymentLink.email,
      metadata: paymentLink.metadata
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Invalid request data', details: error.issues } },
        { status: 400 }
      );
    }

    console.error('Error tracking payment link:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to track payment link' } },
      { status: 500 }
    );
  }
}