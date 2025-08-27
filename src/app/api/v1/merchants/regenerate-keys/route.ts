import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { createMerchantApiKeys } from '@/lib/auth/api-keys';

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json(
        { error: { type: 'authentication_error', message: 'Invalid authentication' } },
        { status: 401 }
      );
    }

    // Generate new API keys for the merchant
    const { liveKey, testKey, publicLiveKey, publicTestKey } = await createMerchantApiKeys(auth.merchantId);

    return NextResponse.json({
      message: 'API keys regenerated successfully',
      apiKeyTest: testKey,
      publicApiKeyTest: publicTestKey,
      publicApiKeyLive: publicLiveKey,
      // Don't return the live secret key for security (would need admin verification)
      warning: 'All existing API keys have been invalidated. Update your applications immediately.'
    });

  } catch (error) {
    console.error('Error regenerating API keys:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}