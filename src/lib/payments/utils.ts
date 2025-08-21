import { randomBytes } from 'crypto';

export function generatePaymentIntentId(): string {
  const randomPart = randomBytes(12).toString('base64url');
  return `pi_${randomPart}`;
}

export function generatePaymentMethodId(): string {
  const randomPart = randomBytes(12).toString('base64url');
  return `pm_${randomPart}`;
}

export function generateSubscriptionId(): string {
  const randomPart = randomBytes(12).toString('base64url');
  return `sub_${randomPart}`;
}

export function generateProductId(): string {
  const randomPart = randomBytes(12).toString('base64url');
  return `prod_${randomPart}`;
}

export function generateApiKey(prefix: 'live' | 'test'): string {
  const randomPart = randomBytes(24).toString('base64url');
  return `sk_${prefix}_${randomPart}`;
}

export function generateWebhookSecret(): string {
  const randomPart = randomBytes(32).toString('base64url');
  return `whsec_${randomPart}`;
}

export function formatPaymentIntentResponse(paymentIntent: any) {
  return {
    id: paymentIntent.id,
    amount: paymentIntent.amount,
    amount_usd: paymentIntent.amountUsd ? parseFloat(paymentIntent.amountUsd) : undefined,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    customer_address: paymentIntent.customerAddress,
    customer_email: paymentIntent.customerEmail,
    description: paymentIntent.description,
    metadata: paymentIntent.metadata,
    tx_id: paymentIntent.txId,
    receipt_url: paymentIntent.receiptUrl,
    created: Math.floor(paymentIntent.createdAt.getTime() / 1000)
  };
}

export async function getExchangeRate(): Promise<number> {
  // For now, return a mock rate. In production, this would call CoinGecko or similar API
  return 98500.00; // 1 BTC = $98,500 USD
}

export function convertUsdToSbtc(usdAmount: number, exchangeRate: number): number {
  // sBTC is 1:1 with BTC, so we convert USD to BTC
  // Amount is in microsBTC (1 sBTC = 100,000,000 microsBTC) - Updated for correct decimals
  const btcAmount = usdAmount / exchangeRate;
  return Math.floor(btcAmount * 100_000_000);
}

export function convertSbtcToUsd(sbtcAmount: number, exchangeRate: number): number {
  // Convert microsBTC to BTC then to USD
  const btcAmount = sbtcAmount / 100_000_000;
  return btcAmount * exchangeRate;
}