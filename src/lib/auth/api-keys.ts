import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { db, merchants } from '../db';
import { eq } from 'drizzle-orm';

export function generateApiKey(prefix: 'sk_live_' | 'sk_test_' | 'pk_live_' | 'pk_test_'): string {
  const randomPart = randomBytes(24).toString('base64url');
  return `${prefix}${randomPart}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 12);
}

export async function verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedKey);
}

export async function validateApiKey(apiKey: string): Promise<{ merchantId: string; isTest: boolean; isPublic?: boolean } | null> {
  const isPublic = apiKey.startsWith('pk_');
  const isTest = apiKey.includes('_test_');
  
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_') && 
      !apiKey.startsWith('pk_live_') && !apiKey.startsWith('pk_test_')) {
    return null;
  }

  let keyField: keyof typeof merchants._.columns;
  if (isPublic) {
    keyField = isTest ? 'publicApiKeyTest' : 'publicApiKeyLive';
  } else {
    keyField = isTest ? 'apiKeyTest' : 'apiKeyLive';
  }

  try {
    const merchant = await db.select({
      id: merchants.id,
      [keyField]: merchants[keyField]
    })
    .from(merchants)
    .where(eq(merchants[keyField], apiKey))
    .limit(1);

    if (merchant.length === 0) {
      return null;
    }

    return {
      merchantId: merchant[0].id,
      isTest,
      isPublic
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

export async function createMerchantApiKeys(merchantId: string): Promise<{ 
  liveKey: string; 
  testKey: string;
  publicLiveKey: string;
  publicTestKey: string;
}> {
  const liveKey = generateApiKey('sk_live_');
  const testKey = generateApiKey('sk_test_');
  const publicLiveKey = generateApiKey('pk_live_');
  const publicTestKey = generateApiKey('pk_test_');

  // Try to update with public keys, fall back if columns don't exist
  try {
    await db.update(merchants)
      .set({
        apiKeyLive: liveKey,
        apiKeyTest: testKey,
        publicApiKeyLive: publicLiveKey,
        publicApiKeyTest: publicTestKey
      })
      .where(eq(merchants.id, merchantId));
  } catch (error: any) {
    // If public key columns don't exist, just update the regular keys
    if (error?.cause?.code === '42703') {
      await db.update(merchants)
        .set({
          apiKeyLive: liveKey,
          apiKeyTest: testKey
        })
        .where(eq(merchants.id, merchantId));
    } else {
      throw error;
    }
  }

  return { liveKey, testKey, publicLiveKey, publicTestKey };
}