import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, products } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, or, isNotNull } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { identifier: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const { identifier } = params;
    
    if (!identifier) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Customer identifier is required' } },
        { status: 400 }
      );
    }

    // Search by either customer address or email
    const customerPayments = await db
      .select({
        // Payment Intent data
        paymentIntentId: paymentIntents.id,
        amount: paymentIntents.amount,
        amountUsd: paymentIntents.amountUsd,
        currency: paymentIntents.currency,
        status: paymentIntents.status,
        customerAddress: paymentIntents.customerAddress,
        customerEmail: paymentIntents.customerEmail,
        description: paymentIntents.description,
        metadata: paymentIntents.metadata,
        txId: paymentIntents.txId,
        receiptUrl: paymentIntents.receiptUrl,
        createdAt: paymentIntents.createdAt,
        updatedAt: paymentIntents.updatedAt,
        // Product data
        productId: paymentIntents.productId,
        productName: products.name,
        productDescription: products.description,
        productType: products.type,
        productImages: products.images,
        productMetadata: products.metadata,
      })
      .from(paymentIntents)
      .leftJoin(products, eq(paymentIntents.productId, products.id))
      .where(
        and(
          eq(paymentIntents.merchantId, auth.merchantId),
          or(
            eq(paymentIntents.customerAddress, identifier),
            eq(paymentIntents.customerEmail, identifier)
          )
        )
      )
      .orderBy(paymentIntents.createdAt);

    if (customerPayments.length === 0) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Customer not found' } },
        { status: 404 }
      );
    }

    // Get customer info from first payment
    const customerInfo = {
      identifier: identifier,
      address: customerPayments[0].customerAddress,
      email: customerPayments[0].customerEmail,
    };

    // Calculate totals and stats
    const successfulPayments = customerPayments.filter(p => p.status === 'succeeded' && p.txId);
    const totalSpent = successfulPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const totalSpentUsd = successfulPayments.reduce((sum, payment) => {
      return sum + (payment.amountUsd ? parseFloat(payment.amountUsd) : 0);
    }, 0);

    // Group payments by status
    const paymentsByStatus = {
      succeeded: customerPayments.filter(p => p.status === 'succeeded').length,
      failed: customerPayments.filter(p => p.status === 'failed').length,
      pending: customerPayments.filter(p => p.status === 'pending').length,
      created: customerPayments.filter(p => p.status === 'created').length,
    };

    // Transform payments data
    const transactions = customerPayments.map(payment => ({
      payment_intent_id: payment.paymentIntentId,
      amount: payment.amount,
      amount_usd: payment.amountUsd ? parseFloat(payment.amountUsd) : undefined,
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      metadata: payment.metadata,
      tx_id: payment.txId,
      receipt_url: payment.receiptUrl,
      created: Math.floor(payment.createdAt.getTime() / 1000),
      updated: Math.floor(payment.updatedAt.getTime() / 1000),
      product: payment.productId ? {
        id: payment.productId,
        name: payment.productName,
        description: payment.productDescription,
        type: payment.productType,
        images: payment.productImages || [],
        metadata: payment.productMetadata,
      } : null
    }));

    // Get unique products purchased
    const uniqueProducts = [];
    const productIds = new Set();
    
    successfulPayments.forEach(payment => {
      if (payment.productId && !productIds.has(payment.productId)) {
        productIds.add(payment.productId);
        uniqueProducts.push({
          id: payment.productId,
          name: payment.productName,
          description: payment.productDescription,
          type: payment.productType,
          images: payment.productImages || [],
          metadata: payment.productMetadata,
          purchase_count: successfulPayments.filter(p => p.productId === payment.productId).length,
          first_purchased: Math.floor(
            successfulPayments
              .filter(p => p.productId === payment.productId)
              .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]
              .createdAt.getTime() / 1000
          ),
          last_purchased: Math.floor(
            successfulPayments
              .filter(p => p.productId === payment.productId)
              .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
              .createdAt.getTime() / 1000
          ),
        });
      }
    });

    return NextResponse.json({
      object: 'customer',
      customer: customerInfo,
      summary: {
        total_payments: customerPayments.length,
        successful_payments: successfulPayments.length,
        total_spent: totalSpent,
        total_spent_usd: totalSpentUsd > 0 ? totalSpentUsd : undefined,
        currency: customerPayments[0]?.currency || 'sbtc',
        payments_by_status: paymentsByStatus,
        unique_products_purchased: uniqueProducts.length,
        first_payment: Math.floor(customerPayments[0].createdAt.getTime() / 1000),
        last_payment: Math.floor(customerPayments[customerPayments.length - 1].updatedAt.getTime() / 1000),
      },
      products: uniqueProducts,
      transactions: transactions,
      url: `/v1/customers/${identifier}`
    });

  } catch (error) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}