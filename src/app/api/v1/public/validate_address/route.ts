import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateStacksAddress } from '@/lib/sbtc/transactions';

const validateAddressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = validateAddressSchema.parse(body);

    const isValid = validateStacksAddress(address);

    return NextResponse.json({
      address,
      valid: isValid,
      network: address.startsWith('ST') ? 'testnet' : 'mainnet'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error validating address:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}