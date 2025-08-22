# @sbtc-gateway/js

JavaScript/TypeScript SDK for sBTC Payment Gateway. Accept Bitcoin payments easily with our comprehensive API wrapper.

## Installation

```bash
npm install @sbtc-gateway/js
```

## Quick Start

```javascript
import SBTCGateway from '@sbtc-gateway/js';

const gateway = new SBTCGateway({
  apiKey: 'your-api-key-here',
  apiBase: 'https://sbtcpay.org' // optional
});

// Create a payment intent
const paymentIntent = await gateway.paymentIntents.create({
  amount: 1000, // 1000 satoshis
  currency: 'sbtc',
  description: 'Test payment'
});

console.log(paymentIntent.id);
```

## Features

- ✅ Payment Intents - Create, confirm, cancel payments
- ✅ Products - Manage your product catalog
- ✅ Webhooks - Handle real-time events
- ✅ Dashboard Analytics - Access payment statistics
- ✅ Public APIs - Exchange rates, address validation
- ✅ Webhook Signature Verification - Secure event handling
- ✅ TypeScript Support - Full type definitions included

## API Reference

### Payment Intents

```javascript
// Create a payment intent
const payment = await gateway.paymentIntents.create({
  amount: 1000,
  currency: 'sbtc',
  description: 'Coffee purchase',
  metadata: { order_id: '12345' }
});

// Retrieve a payment intent
const payment = await gateway.paymentIntents.retrieve('pi_abc123');

// Confirm a payment
const confirmed = await gateway.paymentIntents.confirm('pi_abc123', {
  payment_method: 'bitcoin_address',
  customer_address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
});

// List all payments
const payments = await gateway.paymentIntents.list({
  limit: 10,
  offset: 0
});
```

### Products

```javascript
// Create a product
const product = await gateway.products.create({
  name: 'Premium Coffee',
  description: 'Artisan roasted coffee beans',
  price_sbtc: 50000, // 50,000 satoshis
  price_usd: 25.00,
  metadata: { category: 'beverages' }
});

// List products
const products = await gateway.products.list({
  active: true,
  limit: 20
});

// Update a product
const updated = await gateway.products.update('prod_abc123', {
  price_sbtc: 55000,
  active: true
});
```

### Webhooks

```javascript
// Create a webhook endpoint
const webhook = await gateway.webhookEndpoints.create({
  url: 'https://yoursite.com/webhooks',
  events: ['payment_intent.succeeded', 'payment_intent.failed'],
  description: 'Payment notifications'
});

// List webhook events
const events = await gateway.webhookEvents.list({
  limit: 50,
  event_type: 'payment_intent.succeeded'
});

// Retry a failed webhook
await gateway.webhookEvents.retry('evt_abc123');
```

### Dashboard Analytics

```javascript
// Get dashboard statistics
const stats = await gateway.dashboard.getStats();
console.log(`Total revenue: ${stats.total_revenue_sbtc} sats`);

// Get recent payments
const recentPayments = await gateway.dashboard.getPayments({
  limit: 10,
  status: 'succeeded'
});
```

### Public APIs (No API key required)

```javascript
// Get current exchange rate
const rate = await SBTCGateway.getExchangeRate();
console.log(`1 sBTC = $${rate.sbtc_usd}`);

// Validate a Bitcoin address
const validation = await SBTCGateway.validateAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
console.log(`Address is ${validation.valid ? 'valid' : 'invalid'}`);

// Get public payment intent (for checkout pages)
const payment = await SBTCGateway.getPublicPaymentIntent('pi_abc123');
```

### Webhook Signature Verification

```javascript
// Verify webhook signatures (works in both Node.js and browser)
const isValid = await SBTCGateway.verifyWebhookSignature(
  requestBody, // raw request body as string
  signature,   // x-signature header from webhook
  webhookSecret // your webhook endpoint secret
);

if (!isValid) {
  throw new Error('Invalid webhook signature');
}
```

## Error Handling

The SDK throws `SBTCGatewayError` for API errors:

```javascript
import { SBTCGatewayError } from '@sbtc-gateway/js';

try {
  await gateway.paymentIntents.create({
    amount: 1000,
    currency: 'sbtc'
  });
} catch (error) {
  if (error instanceof SBTCGatewayError) {
    console.log(`API Error ${error.statusCode}: ${error.message}`);
    console.log(`Error type: ${error.type}`);
    console.log(`Error code: ${error.code}`);
  }
}
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import SBTCGateway, { 
  PaymentIntent, 
  Product, 
  WebhookEndpoint,
  CreatePaymentIntentRequest 
} from '@sbtc-gateway/js';

const gateway = new SBTCGateway({ apiKey: 'sk_test_...' });

const params: CreatePaymentIntentRequest = {
  amount: 1000,
  currency: 'sbtc',
  description: 'Test payment'
};

const payment: PaymentIntent = await gateway.paymentIntents.create(params);
```

## Requirements

- Node.js 16+ or modern browser with fetch support
- Valid sBTC Gateway API key for authenticated endpoints

## License

MIT