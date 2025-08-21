import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, merchants } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/middleware';
import { eq } from 'drizzle-orm';

const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  recipientAddress: z.string().min(1).max(255).optional(),
  webhookUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const [merchant] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, auth.merchantId))
      .limit(1);

    if (!merchant) {
      return NextResponse.json(
        { error: { type: 'resource_missing', message: 'Merchant not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      stacksAddress: merchant.stacksAddress,
      recipientAddress: merchant.recipientAddress || merchant.stacksAddress, // Fallback to stacksAddress
      webhookUrl: merchant.webhookUrl,
      apiKeyTest: merchant.apiKeyTest,
      // Don't return live API key for security
      created: Math.floor(merchant.createdAt.getTime() / 1000)
    });

  } catch (error) {
    console.error('Error fetching merchant profile:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateProfileSchema.parse(body);

    const updateData: any = {};
    
    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }
    if (validatedData.email !== undefined) {
      updateData.email = validatedData.email;
    }
    if (validatedData.recipientAddress !== undefined) {
      updateData.recipientAddress = validatedData.recipientAddress;
    }
    if (validatedData.webhookUrl !== undefined) {
      updateData.webhookUrl = validatedData.webhookUrl || null;
    }

    const [updatedMerchant] = await db
      .update(merchants)
      .set(updateData)
      .where(eq(merchants.id, auth.merchantId))
      .returning();

    return NextResponse.json({
      id: updatedMerchant.id,
      name: updatedMerchant.name,
      email: updatedMerchant.email,
      stacksAddress: updatedMerchant.stacksAddress,
      recipientAddress: updatedMerchant.recipientAddress || updatedMerchant.stacksAddress, // Fallback to stacksAddress
      webhookUrl: updatedMerchant.webhookUrl,
      apiKeyTest: updatedMerchant.apiKeyTest,
      created: Math.floor(updatedMerchant.createdAt.getTime() / 1000),
      message: 'Profile updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: error.issues[0].message } },
        { status: 400 }
      );
    }

    console.error('Error updating merchant profile:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}