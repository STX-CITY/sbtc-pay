import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, merchants } from '@/lib/db';
import { generateWebhookSecret } from '@/lib/payments/utils';
import { generateApiKey } from '@/lib/auth/api-keys';
import { eq } from 'drizzle-orm';
import { validateStacksAddress } from '@/lib/stacks/sbtc';
import { getCurrentNetwork } from '@/lib/stacks/config';

const registerMerchantSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  stacksAddress: z.string().min(1),
  webhookUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = registerMerchantSchema.parse(body);

    // Validate Stacks address format
    const currentNetwork = getCurrentNetwork();
    if (!validateStacksAddress(validatedData.stacksAddress, currentNetwork)) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Invalid Stacks address format' } },
        { status: 400 }
      );
    }

    // Check if merchant already exists with this email or Stacks address
    const existingMerchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.email, validatedData.email))
      .limit(1);

    if (existingMerchant.length > 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Merchant already exists with this email' } },
        { status: 400 }
      );
    }

    const existingAddress = await db
      .select()
      .from(merchants)
      .where(eq(merchants.stacksAddress, validatedData.stacksAddress))
      .limit(1);

    if (existingAddress.length > 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Merchant already exists with this Stacks address' } },
        { status: 400 }
      );
    }

    // Generate API keys and webhook secret
    const apiKeyLive = generateApiKey('sk_live_');
    const apiKeyTest = generateApiKey('sk_test_');
    const webhookSecret = generateWebhookSecret();

    // Create new merchant - auto-approved
    const newMerchant = {
      name: validatedData.name,
      email: validatedData.email,
      stacksAddress: validatedData.stacksAddress,
      apiKeyLive,
      apiKeyTest,
      webhookUrl: validatedData.webhookUrl,
      webhookSecret,
    };

    const [createdMerchant] = await db
      .insert(merchants)
      .values(newMerchant)
      .returning();

    // Return merchant details (excluding sensitive data for client)
    return NextResponse.json({
      id: createdMerchant.id,
      name: createdMerchant.name,
      email: createdMerchant.email,
      stacksAddress: createdMerchant.stacksAddress,
      webhookUrl: createdMerchant.webhookUrl,
      apiKeyTest: createdMerchant.apiKeyTest, // Return test key for immediate use
      created: Math.floor(createdMerchant.createdAt.getTime() / 1000),
      message: 'Merchant registration successful! You can now start accepting sBTC payments.'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error registering merchant:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}