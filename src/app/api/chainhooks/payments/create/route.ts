import { NextRequest, NextResponse } from 'next/server';
import { SBTC_PAYMENT_CHAINHOOK } from '@/lib/chainhooks/config';

export async function POST(request: NextRequest) {
  try {
    const chainhookServiceUrl = process.env.CHAINHOOK_SERVICE_URL || 'http://localhost:20456';
    
    const response = await fetch(`${chainhookServiceUrl}/v1/chainhooks/stacks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CHAINHOOK_API_KEY || 'default-key'}`
      },
      body: JSON.stringify(SBTC_PAYMENT_CHAINHOOK)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Failed to create chainhook:', response.status, errorData);
      return NextResponse.json(
        { error: 'Failed to register chainhook', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Chainhook registered successfully:', result);

    return NextResponse.json({
      message: 'Chainhook registered successfully',
      chainhook: SBTC_PAYMENT_CHAINHOOK,
      result
    });
  } catch (error) {
    console.error('Error creating chainhook:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}