# sBTC Payment Gateway

A complete "Stripe for sBTC" payment gateway that enables businesses to easily accept Bitcoin payments via sBTC on Stacks blockchain.

## 🚀 Features

- **Developer-First API**: Clean, RESTful API similar to Stripe
- **Real-time Monitoring**: Chainhooks integration for instant payment updates
- **Webhook System**: Reliable event notifications to your backend
- **Multiple Integration Options**: API, SDK, React components, and embeddable widgets
- **Secure by Design**: API key authentication, webhook signature verification
- **Dashboard**: Complete merchant dashboard for payment management

## 📋 Quick Start

### 1. Environment Setup

Copy the environment variables:
```bash
cp .env.example .env.local
```

Configure your environment:
```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# JWT Secret
JWT_SECRET="your-super-secret-jwt-key"

# sBTC Configuration
SBTC_TOKEN_CONTRACT_ADDRESS="ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token"
STACKS_NETWORK="testnet"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
```

### 2. Installation & Development

```bash
# Install dependencies
npm install

# Set up database
npm run db:generate
npm run db:migrate

# Start development server
npm run dev
```

Visit http://localhost:3000 to see the landing page.

## 🏗️ Architecture

### Core Components

1. **Payment Intents**: Core payment tracking (similar to Stripe)
2. **Stacks Connect Integration**: Wallet connection and transactions
3. **Webhook System**: Event notifications with retry logic
4. **Chainhooks**: Real-time blockchain monitoring
5. **Dashboard**: Merchant management interface

### Database Schema

- `merchants` - Merchant accounts and API keys
- `payment_intents` - Payment tracking and status
- `webhook_events` - Event notifications and delivery status
- `payment_methods` - Customer payment methods
- `subscriptions` - Recurring payments (future)

## 🔧 API Reference

### Authentication

Use your API key in the Authorization header:
```bash
curl -H "Authorization: sk_test_..." https://sbtcpay.org/v1/payment_intents
```

### Create Payment Intent

```bash
curl -X POST https://sbtcpay.org/v1/payment_intents \
  -H "Authorization: sk_test_..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100000,
    "currency": "sbtc",
    "description": "Product purchase"
  }'
```

### Response

```json
{
  "id": "pi_1abc123",
  "amount": 100000,
  "amount_usd": 98.50,
  "currency": "sbtc",
  "status": "created",
  "description": "Product purchase",
  "created": 1704067200
}
```

## 📱 Integration Options

### 1. Direct API

```javascript
// Create payment intent
const response = await fetch('/api/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': 'sk_test_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 100000,
    description: 'Product purchase'
  })
});
```

### 2. JavaScript SDK

```bash
npm install @sbtc-gateway/js
```

```javascript
import { SBTCGateway } from '@sbtc-gateway/js';

const gateway = new SBTCGateway({
  apiKey: 'sk_test_...'
});

const paymentIntent = await gateway.paymentIntents.create({
  amount: 100000,
  description: 'Product purchase'
});
```

### 3. React Components

```bash
npm install @sbtc-gateway/react
```

```jsx
import { SBTCProvider, PaymentButton } from '@sbtc-gateway/react';

function App() {
  return (
    <SBTCProvider apiKey="sk_test_...">
      <PaymentButton
        amount={100000}
        description="Product purchase"
        onSuccess={(paymentIntent) => console.log('Success!', paymentIntent)}
      />
    </SBTCProvider>
  );
}
```

### 4. Embeddable Widget

```html
<script src="https://js.sbtcgateway.com/v1/" 
        data-sbtc-key="pk_test_..." 
        data-auto-mount="true"></script>

<div data-sbtc-button 
     data-amount="100000" 
     data-description="Product purchase">
</div>
```

## 🎣 Webhooks

Configure webhook endpoints to receive real-time notifications:

```bash
curl -X POST https://sbtcpay.org/v1/webhooks \
  -H "Authorization: sk_test_..." \
  -d '{
    "url": "https://example.com/webhooks/sbtc"
  }'
```

### Webhook Events

- `payment_intent.created` - Payment intent created
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.failed` - Payment failed

### Webhook Payload

```json
{
  "id": "evt_abc123",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_abc123",
      "status": "succeeded",
      "amount": 100000,
      "tx_id": "0x..."
    }
  },
  "created": 1704067200
}
```

### Signature Verification

```javascript
import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 📊 Dashboard

Access the merchant dashboard at `/dashboard`:

- **Overview**: Payment statistics and recent activity
- **Payments**: Complete payment history with filters
- **Developers**: API keys and webhook configuration
- **Analytics**: Payment volume and success rates

## 🔐 Security

- **API Key Authentication**: Secure access to the API
- **Webhook Signatures**: Verify webhook authenticity
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Prevent API abuse
- **Environment Isolation**: Separate test and live modes

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables

Set these in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NEXTAUTH_URL` - Your domain URL
- `STACKS_NETWORK` - "testnet" or "mainnet"

### Database Migration

```bash
npm run db:generate
npm run db:migrate
```

## 🧪 Testing

### Test Payment Flow

1. Visit `/checkout/pi_demo123456` for a demo payment
2. Connect your Stacks wallet (Hiro Wallet recommended)
3. Complete the sBTC transfer
4. Monitor status updates in real-time

### API Testing

```bash
# Test API endpoints
curl -H "Authorization: sk_test_..." http://localhost:3000/api/v1/payment_intents

# Test webhook delivery
curl -X POST http://localhost:3000/api/v1/webhooks/test \
  -H "Authorization: sk_test_..."
```

## 📚 Documentation

- **API Reference**: `/docs` (when implemented)
- **Widget Examples**: `/packages/widgets/example.html`
- **Integration Guides**: See examples in each package

## 🛠️ Development

### Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── api/v1/            # API endpoints
│   ├── dashboard/         # Merchant dashboard
│   └── checkout/          # Customer checkout
├── components/            # React components
├── lib/                   # Core libraries
│   ├── db/               # Database & schema
│   ├── auth/             # Authentication
│   ├── sbtc/             # Stacks integration
│   ├── webhooks/         # Webhook system
│   └── payments/         # Payment utilities
packages/
├── js-sdk/               # JavaScript SDK
├── react-components/     # React components
└── widgets/              # Embeddable widgets
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs`
- **Community**: [Discord/Slack link]

---

Built with ❤️ for the Bitcoin and Stacks ecosystem.