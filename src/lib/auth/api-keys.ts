import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { db, merchants } from '../db';
import { eq } from 'drizzle-orm';

export function generateApiKey(prefix: 'sk_live_' | 'sk_test_'): string {
  const randomPart = randomBytes(24).toString('base64url');
  return `${prefix}${randomPart}`;
}

export async function hashApiKey(apiKey: string): Promise<string> {
  return bcrypt.hash(apiKey, 12);
}

export async function verifyApiKey(apiKey: string, hashedKey: string): Promise<boolean> {
  return bcrypt.compare(apiKey, hashedKey);
}

export async function validateApiKey(apiKey: string): Promise<{ merchantId: string; isTest: boolean } | null> {
  if (!apiKey.startsWith('sk_live_') && !apiKey.startsWith('sk_test_')) {
    return null;
  }

  const isTest = apiKey.startsWith('sk_test_');
  const keyField = isTest ? 'apiKeyTest' : 'apiKeyLive';

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
      isTest
    };
  } catch (error) {
    console.error('Error validating API key:', error);
    return null;
  }
}

export async function createMerchantApiKeys(merchantId: string): Promise<{ liveKey: string; testKey: string }> {
  const liveKey = generateApiKey('sk_live_');
  const testKey = generateApiKey('sk_test_');

  await db.update(merchants)
    .set({
      apiKeyLive: liveKey,
      apiKeyTest: testKey
    })
    .where(eq(merchants.id, merchantId));

  return { liveKey, testKey };
}