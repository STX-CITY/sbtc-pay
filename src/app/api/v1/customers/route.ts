import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, products, paymentLinks } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get successful payment intents with customer data, product names, and payment link metadata
    const successfulPayments = await db
      .select({
        customerAddress: paymentIntents.customerAddress,
        customerEmail: paymentIntents.customerEmail,
        totalAmount: paymentIntents.amount,
        amountUsd: paymentIntents.amountUsd,
        currency: paymentIntents.currency,
        lastPaymentDate: paymentIntents.updatedAt,
        txId: paymentIntents.txId,
        productId: paymentIntents.productId,
        productName: products.name,
        paymentIntentMetadata: paymentIntents.metadata,
        sourceLinkId: paymentIntents.sourceLinkId,
        paymentLinkMetadata: paymentLinks.metadata,
        paymentLinkEmail: paymentLinks.email,
        paymentLinkCode: paymentLinks.linkCode
      })
      .from(paymentIntents)
      .leftJoin(products, eq(paymentIntents.productId, products.id))
      .leftJoin(paymentLinks, eq(paymentIntents.sourceLinkId, paymentLinks.id))
      .where(
        and(
          eq(paymentIntents.merchantId, auth.merchantId),
          eq(paymentIntents.status, 'succeeded'),
          isNotNull(paymentIntents.txId)
        )
      )
      .limit(limit)
      .offset(offset)
      .orderBy(paymentIntents.updatedAt);

    // Group by customer (address or email) and aggregate data
    const customersMap = new Map();
    
    successfulPayments.forEach(payment => {
      const customerId = payment.customerAddress || payment.customerEmail || `anonymous_${payment.txId}`;
      
      // Skip if neither address nor email is available (anonymous payments)
      // but we'll still create an entry using the transaction ID as identifier
      const isAnonymous = !payment.customerAddress && !payment.customerEmail;

      if (customersMap.has(customerId)) {
        const existing = customersMap.get(customerId);
        existing.total_spent += payment.totalAmount;
        existing.total_spent_usd = existing.total_spent_usd 
          ? existing.total_spent_usd + (parseFloat(payment.amountUsd || '0'))
          : parseFloat(payment.amountUsd || '0');
        existing.payment_count += 1;
        existing.last_payment = Math.max(existing.last_payment, Math.floor(payment.lastPaymentDate.getTime() / 1000));
        existing.transactions.push({
          tx_id: payment.txId,
          amount: payment.totalAmount,
          amount_usd: payment.amountUsd ? parseFloat(payment.amountUsd) : undefined,
          product_id: payment.productId,
          product_name: payment.productName,
          date: Math.floor(payment.lastPaymentDate.getTime() / 1000),
          payment_intent_metadata: payment.paymentIntentMetadata,
          source_link_id: payment.sourceLinkId,
          payment_link_metadata: payment.paymentLinkMetadata,
          payment_link_email: payment.paymentLinkEmail,
          payment_link_code: payment.paymentLinkCode
        });
      } else {
        customersMap.set(customerId, {
          id: customerId,
          address: payment.customerAddress,
          email: payment.customerEmail,
          is_anonymous: isAnonymous,
          total_spent: payment.totalAmount,
          total_spent_usd: payment.amountUsd ? parseFloat(payment.amountUsd) : undefined,
          currency: payment.currency,
          payment_count: 1,
          last_payment: Math.floor(payment.lastPaymentDate.getTime() / 1000),
          transactions: [{
            tx_id: payment.txId,
            amount: payment.totalAmount,
            amount_usd: payment.amountUsd ? parseFloat(payment.amountUsd) : undefined,
            product_id: payment.productId,
            product_name: payment.productName,
            date: Math.floor(payment.lastPaymentDate.getTime() / 1000),
            payment_intent_metadata: payment.paymentIntentMetadata,
            source_link_id: payment.sourceLinkId,
            payment_link_metadata: payment.paymentLinkMetadata,
            payment_link_email: payment.paymentLinkEmail,
            payment_link_code: payment.paymentLinkCode
          }]
        });
      }
    });

    const customers = Array.from(customersMap.values());

    return NextResponse.json({
      object: 'list',
      data: customers,
      has_more: customers.length === limit,
      url: '/v1/customers'
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}