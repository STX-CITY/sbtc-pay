import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, products } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq, and, gte, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const merchantId = auth.merchantId;
    
    // Get date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get total revenue (succeeded payments)
    const totalRevenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentIntents.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'succeeded')
        )
      );

    // Get this month's revenue
    const thisMonthRevenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentIntents.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, thisMonth)
        )
      );

    // Get last month's revenue for comparison
    const lastMonthRevenueResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentIntents.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, lastMonth),
          sql`${paymentIntents.createdAt} < ${thisMonth}`
        )
      );

    // Get pending payments
    const pendingPaymentsResult = await db
      .select({
        total: sql<string>`COALESCE(SUM(${paymentIntents.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'pending')
        )
      );

    // Get failed payments count
    const failedPaymentsResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'failed')
        )
      );

    // Get active products count
    const activeProductsResult = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(products)
      .where(
        and(
          eq(products.merchantId, merchantId),
          eq(products.active, true)
        )
      );

    // Get recent payments (last 10)
    const recentPayments = await db
      .select()
      .from(paymentIntents)
      .where(eq(paymentIntents.merchantId, merchantId))
      .orderBy(desc(paymentIntents.createdAt))
      .limit(10);

    // Get daily revenue for the last 7 days (for chart)
    const dailyRevenueResult = await db
      .select({
        date: sql<string>`DATE(${paymentIntents.createdAt})`,
        total: sql<string>`COALESCE(SUM(${paymentIntents.amount}), 0)`,
        count: sql<number>`COUNT(*)`
      })
      .from(paymentIntents)
      .where(
        and(
          eq(paymentIntents.merchantId, merchantId),
          eq(paymentIntents.status, 'succeeded'),
          gte(paymentIntents.createdAt, last7Days)
        )
      )
      .groupBy(sql`DATE(${paymentIntents.createdAt})`)
      .orderBy(sql`DATE(${paymentIntents.createdAt})`);

    // Calculate percentage changes
    const totalRevenue = parseInt(totalRevenueResult[0].total);
    const thisMonthRevenue = parseInt(thisMonthRevenueResult[0].total);
    const lastMonthRevenue = parseInt(lastMonthRevenueResult[0].total);
    const pendingAmount = parseInt(pendingPaymentsResult[0].total);
    
    const monthOverMonthChange = lastMonthRevenue > 0 
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Format daily revenue for chart
    const chartData = [];
    const dateMap = new Map(dailyRevenueResult.map(r => [r.date, r]));
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = dateMap.get(dateStr);
      
      chartData.push({
        date: dateStr,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        amount: dayData ? parseInt(dayData.total) : 0,
        count: dayData ? dayData.count : 0
      });
    }

    // Format response
    return NextResponse.json({
      stats: {
        totalRevenue: {
          amount: totalRevenue,
          formatted: (totalRevenue / 100_000_000).toFixed(8),
          count: totalRevenueResult[0].count,
          currency: 'sBTC'
        },
        monthlyRevenue: {
          amount: thisMonthRevenue,
          formatted: (thisMonthRevenue / 100_000_000).toFixed(8),
          count: thisMonthRevenueResult[0].count,
          change: monthOverMonthChange,
          currency: 'sBTC'
        },
        pendingPayments: {
          amount: pendingAmount,
          formatted: (pendingAmount / 100_000_000).toFixed(8),
          count: pendingPaymentsResult[0].count,
          currency: 'sBTC'
        },
        failedPayments: {
          count: failedPaymentsResult[0].count
        },
        activeProducts: {
          count: activeProductsResult[0].count
        },
        successRate: {
          percentage: totalRevenueResult[0].count > 0 
            ? ((totalRevenueResult[0].count / (totalRevenueResult[0].count + failedPaymentsResult[0].count)) * 100).toFixed(1)
            : '0'
        }
      },
      recentPayments: recentPayments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        formatted: (payment.amount / 100_000_000).toFixed(8),
        status: payment.status,
        description: payment.description,
        customerEmail: payment.customerEmail,
        created: Math.floor(payment.createdAt.getTime() / 1000),
        txId: payment.txId
      })),
      chartData: {
        daily: chartData,
        summary: {
          total: chartData.reduce((sum, d) => sum + d.amount, 0),
          average: chartData.reduce((sum, d) => sum + d.amount, 0) / 7,
          transactions: chartData.reduce((sum, d) => sum + d.count, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}