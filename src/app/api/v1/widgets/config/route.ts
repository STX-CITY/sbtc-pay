import { NextRequest, NextResponse } from 'next/server';
import { db, merchants } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, widgetType, amount, description, currency = 'sbtc' } = body;

    // Validate API key format (public key should start with pk_)
    if (!apiKey || !apiKey.startsWith('pk_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 400 }
      );
    }

    // Find merchant by public API key
    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.publicApiKey, apiKey))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
    }

    // Validate widget configuration
    const validWidgetTypes = ['button', 'inline', 'link'];
    if (!validWidgetTypes.includes(widgetType)) {
      return NextResponse.json(
        { error: 'Invalid widget type' },
        { status: 400 }
      );
    }

    if (amount && (typeof amount !== 'number' || amount <= 0)) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (currency && !['sbtc', 'btc'].includes(currency)) {
      return NextResponse.json(
        { error: 'Invalid currency' },
        { status: 400 }
      );
    }

    // Return widget configuration
    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        domain: merchant.domain
      },
      widget: {
        type: widgetType,
        amount,
        description,
        currency
      },
      embedUrl: process.env.NODE_ENV === 'production' 
        ? 'https://sbtcpay.org/embed/checkout'
        : 'http://localhost:3000/embed/checkout'
    });

  } catch (error) {
    console.error('Widget config error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Widget configuration endpoint',
    supportedTypes: ['button', 'inline', 'link'],
    supportedCurrencies: ['sbtc', 'btc']
  });
}