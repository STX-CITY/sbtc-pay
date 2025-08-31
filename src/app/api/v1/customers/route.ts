import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, products, paymentLinks } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, isNotNull } from 'drizzle-orm';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('[Customers API] Starting GET request');
    console.log('[Customers API] Request URL:', request.url);
    
    
    const auth = await authenticateRequest(request);
    if (!auth) {
      console.log('[Customers API] Authentication failed');
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }
    console.log('[Customers API] Authenticated merchant:', auth.merchantId);

    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    console.log('[Customers API] Query params - limit:', limit, 'offset:', offset);

    // First, let's check what payment intents exist for this merchant (for debugging)
    console.log('[Customers API] Checking all payment intents for merchant...');
    const allPayments = await db
      .select({
        id: paymentIntents.id,
        status: paymentIntents.status,
        txId: paymentIntents.txId,
        customerAddress: paymentIntents.customerAddress,
        customerEmail: paymentIntents.customerEmail,
        amount: paymentIntents.amount
      })
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, auth.merchantId))
      .limit(10);
    
    console.log('[Customers API] All payments for merchant:', allPayments.length);
    console.log('[Customers API] All payments data:', allPayments);
    
    // Now check each condition separately
    const paymentsWithMerchant = await db
      .select({
        id: paymentIntents.id,
        status: paymentIntents.status,
        txId: paymentIntents.txId
      })
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, auth.merchantId));
    console.log('[Customers API] Payments for merchant:', paymentsWithMerchant.length);
    
    const succeededPayments = await db
      .select({
        id: paymentIntents.id,
        status: paymentIntents.status,
        txId: paymentIntents.txId
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, auth.merchantId),
          eq(paymentIntents.status, 'succeeded')
        )
      );
    console.log('[Customers API] Succeeded payments for merchant:', succeededPayments.length);
    console.log('[Customers API] Succeeded payments data:', succeededPayments);
    
    const paymentsWithTxId = await db
      .select({
        id: paymentIntents.id,
        status: paymentIntents.status,
        txId: paymentIntents.txId
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, auth.merchantId),
          isNotNull(paymentIntents.txId)
        )
      );
    console.log('[Customers API] Payments with txId for merchant:', paymentsWithTxId.length);

    // Get successful payment intents with customer data, product names, and payment link metadata
    console.log('[Customers API] Executing database query for successful payments');
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
    
    console.log('[Customers API] Found successful payments:', successfulPayments.length);
    console.log('[Customers API] Sample payment data:', successfulPayments.length > 0 ? successfulPayments[0] : 'none');

    // Group by customer (address or email) and aggregate data
    console.log('[Customers API] Processing payments to group by customers');
    const customersMap = new Map();
    
    successfulPayments.forEach((payment, index) => {
      console.log(`[Customers API] Processing payment ${index + 1}:`, {
        customerAddress: payment.customerAddress,
        customerEmail: payment.customerEmail,
        txId: payment.txId,
        amount: payment.totalAmount
      });
      
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
        console.log(`[Customers API] Updated existing customer ${customerId}, new total: ${existing.total_spent}`);
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
        console.log(`[Customers API] Created new customer ${customerId}, spent: ${payment.totalAmount}`);
      }
    });

    const customers = Array.from(customersMap.values());
    console.log(`[Customers API] Created ${customers.length} unique customers`);

    console.log('[Customers API] Returning response with', customers.length, 'customers');
    console.log('[Customers API] Sample customer:', customers.length > 0 ? customers[0] : 'none');
    
    return NextResponse.json({
      object: 'list',
      data: customers,
      has_more: customers.length === limit,
      url: '/v1/customers'
    });
  } catch (error) {
    console.error('[Customers API] Error fetching customers:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}