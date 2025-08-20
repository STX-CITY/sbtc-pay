import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRate } from '@/lib/payments/utils';

export async function GET(request: NextRequest) {
  try {
    const rate = await getExchangeRate();
    
    return NextResponse.json({
      sbtc_usd: rate,
      timestamp: Math.floor(Date.now() / 1000),
      source: 'coingecko'
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Unable to fetch exchange rate' } },
      { status: 500 }
    );
  }
}