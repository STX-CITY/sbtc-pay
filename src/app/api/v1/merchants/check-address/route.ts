import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, merchants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { validateStacksAddress } from '@/lib/stacks/sbtc';
import { getCurrentNetwork } from '@/lib/stacks/config';

const checkAddressSchema = z.object({
  address: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = checkAddressSchema.parse(body);

    // Validate Stacks address format
    const currentNetwork = getCurrentNetwork();
    if (!validateStacksAddress(address, currentNetwork)) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Invalid Stacks address format' } },
        { status: 400 }
      );
    }

    // Check if merchant exists with this address
    const [merchant] = await db
      .select({
        id: merchants.id,
        name: merchants.name,
        email: merchants.email,
        stacksAddress: merchants.stacksAddress,
        apiKeyTest: merchants.apiKeyTest,
        createdAt: merchants.createdAt
      })
      .from(merchants)
      .where(eq(merchants.stacksAddress, address))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { 
          registered: false,
          message: 'Address not registered. Please register first.'
        }
      );
    }

    // Return merchant info (excluding sensitive data)
    return NextResponse.json({
      registered: true,
      merchant: {
        id: merchant.id,
        name: merchant.name,
        email: merchant.email,
        stacksAddress: merchant.stacksAddress,
        apiKeyTest: merchant.apiKeyTest,
        created: Math.floor(merchant.createdAt.getTime() / 1000)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error checking address:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}