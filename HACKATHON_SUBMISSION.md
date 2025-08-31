# 🚀 sBTC Pay - The Stripe for Bitcoin on Stacks


## 💡 Empowering Commerce with Programmable Bitcoin


### **Project Category:** DeFi & Payments Infrastructure
### **Live Demo:** [https://sbtcpay.org](https://sbtcpay.org)
### **Demo Site:** [https://demo.sbtcpay.org](https://demo.sbtcpay.org)
### **GitHub:** [View Source Code](https://github.com/STX-CITY/demo-sbtc-pay)


---


## 🎯 Executive Summary


**sBTC Pay** is a complete payment gateway infrastructure that makes accepting Bitcoin as easy as traditional payment methods. Built on Stacks and powered by sBTC, we provide developers and businesses with the tools they need to seamlessly integrate Bitcoin payments into their applications.


Think of it as **"Stripe for Bitcoin"** - but decentralized, non-custodial, and powered by the security of Bitcoin itself. With our RESTful APIs, SDKs, embeddable widgets, and comprehensive dashboard, any business can start accepting Bitcoin payments in minutes, not months.


### **Key Highlights:**
- ✅ **Production-Ready**: Complete payment infrastructure with APIs, webhooks, and dashboard
- ✅ **Developer-First**: Clean APIs, SDKs, and extensive documentation
- ✅ **Real-Time Monitoring**: Chainhooks integration for instant payment updates
- ✅ **Enterprise Features**: Product catalogs, payment links, customer management
- ✅ **100% Non-Custodial**: Merchants receive payments directly to their wallets


---


## 🔥 Problem Statement


### The Bitcoin Payment Challenge


Despite Bitcoin's $1+ trillion market cap, merchants face significant barriers to accepting BTC payments:


1. **Technical Complexity**: Setting up Bitcoin payment infrastructure requires deep blockchain knowledge
2. **Poor Developer Experience**: Lack of modern APIs and SDKs similar to Stripe or PayPal
3. **No Real-Time Updates**: Merchants wait for confirmations without instant notifications
4. **Limited Smart Contract Capabilities**: Native Bitcoin lacks programmability for complex payment flows
5. **Integration Nightmare**: Each business must build custom solutions from scratch


### Current Market Gaps:
- **Lightning Network**: Limited liquidity and requires channel management
- **Wrapped Bitcoin on Ethereum**: High gas fees and centralized bridges
- **Traditional Payment Processors**: Take custody of funds and charge high fees (2-3%)
- **Direct Bitcoin Payments**: Slow confirmations (10+ minutes) and no programmability


---


## 💎 Solution: sBTC Pay


### Bridging Bitcoin to Modern Commerce


sBTC Pay leverages the revolutionary sBTC protocol on Stacks to bring Bitcoin into the world of smart contracts while maintaining 100% Bitcoin finality. We've built a complete payment infrastructure that rivals traditional payment processors but remains fully decentralized.


### Our Approach:
1. **sBTC Protocol**: 1:1 Bitcoin-backed asset enabling instant, programmable payments
2. **Developer-Friendly APIs**: RESTful endpoints that feel familiar to any developer
3. **Real-Time Infrastructure**: Chainhooks for instant payment notifications
4. **Complete Ecosystem**: From checkout widgets to analytics dashboards
5. **Non-Custodial Architecture**: Merchants maintain full control of their funds


---


## 🌟 Key Features


### 1. **Payment Processing Core**
- **Payment Intents API**: Create and manage payment requests programmatically
- **Multi-Currency Support**: Accept sBTC with automatic USD conversion display
- **Smart Status Tracking**: Real-time payment status updates (created → pending → succeeded)
- **Metadata Support**: Attach custom data to payments for order tracking


### 2. **Developer Tools & Integration**


#### **RESTful API**
```javascript
// Create a payment intent
POST /api/v1/payment_intents
{
  "amount": 100000,        // in microsBTC
  "description": "Premium subscription",
  "metadata": {
    "order_id": "ord_123",
    "customer_id": "cust_456"
  }
}
```


#### **JavaScript SDK** (Coming Soon)
```javascript
import { SBTCGateway } from '@sbtc-gateway/js';


const gateway = new SBTCGateway({ apiKey: 'sk_test_...' });
const payment = await gateway.paymentIntents.create({
  amount: 100000,
  description: 'Product purchase'
});
```


#### **React Components**
```jsx
<SBTCProvider apiKey="sk_test_...">
  <PaymentButton
    amount={100000}
    onSuccess={(payment) => console.log('Payment completed!')}
  />
</SBTCProvider>
```


#### **Embeddable Widgets**
```html
<script src="https://js.sbtcgateway.com/v1/" 
        data-sbtc-key="pk_test_..."></script>
<div data-sbtc-button data-amount="100000"></div>
```


### 3. **Real-Time Monitoring**
- **Chainhooks Integration**: Instant blockchain event notifications
- **WebSocket Support**: Live payment status updates
- **Webhook System**: HTTP callbacks with retry logic and signature verification
- **Event Types**: payment.created, payment.succeeded, payment.failed


### 4. **Merchant Dashboard**
- **Analytics & Insights**: Payment volume, success rates, customer metrics
- **Payment Management**: View, filter, and export payment history
- **Product Catalog**: Create and manage products with images and descriptions
- **Customer Database**: Track customer payment history and details
- **API Key Management**: Separate test/live environments with key rotation


### 5. **Payment Links & Checkout**
- **No-Code Payment Links**: Generate payment URLs without writing code
- **Customizable Checkout**: Branded payment pages with your logo
- **QR Code Generation**: Easy mobile payments
- **Email Notifications**: Automatic receipts to customers
- **Expiring Links**: Time-limited payment requests for security


### 6. **Enterprise Features**
- **Multi-Webhook Endpoints**: Send events to multiple URLs
- **Webhook Testing Tools**: Built-in webhook tester and debugger
- **Rate Limiting**: Protect against API abuse
- **Idempotency Keys**: Prevent duplicate payments
- **Comprehensive Logging**: Full audit trail of all transactions


### 7. **Security & Compliance**
- **Non-Custodial Design**: Funds go directly to merchant wallets
- **API Authentication**: Secure API keys with test/live modes
- **Webhook Signatures**: HMAC-SHA256 verification
- **Input Validation**: Zod schemas for all API inputs
- **HTTPS Everywhere**: Enforced TLS for all communications


---


## 🏗️ Technical Architecture


### Technology Stack


#### **Frontend**
- **Framework**: Next.js 14 with App Router
- **UI Library**: Hero UI & Tailwind CSS
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Wallet Integration**: Stacks Connect


#### **Backend**
- **Runtime**: Node.js with TypeScript
- **API Framework**: Next.js API Routes
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: WebSockets for live updates
- **Queue System**: Background job processing


#### **Blockchain Integration**
- **sBTC Protocol**: 1:1 Bitcoin-backed payments
- **Stacks.js**: Transaction building and broadcasting
- **Chainhooks**: Real-time blockchain monitoring
- **Smart Contracts**: Clarity contracts for payment logic


#### **Infrastructure**
- **Hosting**: Vercel Edge Functions
- **Database**: Neon Serverless PostgreSQL
- **CDN**: Global content delivery
- **Monitoring**: Real-time error tracking


### System Architecture


```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Customer      │────▶│   sBTC Pay      │────▶│   Merchant      │
│   Wallet        │     │   Platform      │     │   Dashboard     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                         │
        │                       │                         │
        ▼                       ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Stacks Chain   │────▶│   Chainhooks    │────▶│   Webhooks      │
│   (sBTC)        │     │   Monitor       │     │   Delivery      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```


---


## ⚡ sBTC Integration Deep Dive


### Leveraging sBTC's Unique Capabilities


#### **1. Instant Finality**
Unlike Lightning Network's probabilistic payments, sBTC transactions achieve Bitcoin finality, giving merchants absolute certainty.


#### **2. Smart Contract Integration**
```clarity
;; Example: Automated payment splitting
(define-public (process-payment (amount uint) (merchant principal))
  (begin
    ;; 98% to merchant
    (try! (stx-transfer? (* amount u98) u100) tx-sender merchant)
    ;; 2% platform fee
    (try! (stx-transfer? (* amount u2) u100) tx-sender platform-address)
    (ok true)))
```


#### **3. Decentralized Security**
- **15+ Validators**: Industry-leading signers secure the protocol
- **70% Consensus**: No single point of failure
- **Bitcoin Backing**: Every sBTC is backed 1:1 by real BTC
- **Permissionless Redemption**: Convert back to BTC anytime


#### **4. Nakamoto Upgrade Benefits**
- **Faster Blocks**: ~5 second block times
- **100% Bitcoin Finality**: Transactions can't be reversed
- **Higher Throughput**: Scale to thousands of TPS
- **MEV Protection**: Fair transaction ordering


---


## 🎮 Live Demo & Screenshots


### Try It Yourself


1. **Demo Checkout**: [Try a test payment](https://sbtcpay.org/checkout/product/prod_fcp_JpCwaWsKUU8Z)
2. **Live E-commerce Site**: [demo.sbtcpay.org](https://demo.sbtcpay.org) - Digial Product Test platform accepting sBTC
3. **Merchant Dashboard**: Full-featured admin panel for payment management


### Screenshots


#### Payment Flow
- Clean, intuitive checkout experience
- Real-time payment status updates
- Mobile-responsive design
- Wallet integration (Xverse, Leather)


#### Merchant Dashboard
- Comprehensive analytics
- Payment history with filters
- Product management
- API key configuration


---


## 💼 Use Cases & Target Markets


### Current Applications


#### **E-commerce**
- Online stores accepting Bitcoin payments
- Digital product sales (courses, software, NFTs)
- Subscription services with recurring payments


#### **SaaS Platforms**
- API monetization with usage-based billing
- Premium feature unlocking
- Pay-per-use services


#### **Marketplaces**
- Peer-to-peer payment facilitation
- Escrow and split payments
- Commission handling


#### **Content Creators**
- Paywalled content
- Donation systems
- Membership platforms


### Future Opportunities
- **Cross-border Remittances**: Instant, low-cost international transfers
- **DeFi Integration**: Yield-bearing payment accounts
- **Micropayments**: Sub-cent transactions for content monetization
- **B2B Payments**: Invoice processing and net terms


---


## 🚀 Roadmap & Vision


### Completed (Q3 2025)
- ✅ Core payment processing API
- ✅ Merchant dashboard
- ✅ Webhook system
- ✅ Product catalog
- ✅ Payment links
- ✅ Chainhooks integration
- ✅ Demo e-commerce site


### In Progress 
- 🔄 JavaScript/TypeScript SDK
- 🔄 React component library
- 🔄 Subscription/recurring payments
- 🔄 Advanced analytics dashboard
- 🔄 Mobile SDK (React Native)


### Planned 
- 📋 Multi-currency support (STX, other tokens)
- 📋 Fraud detection system
- 📋 Advanced checkout customization
- 📋 Shopify/WooCommerce plugins
- 📋 Python, Ruby, Go SDKs
- 📋 Invoice generation system
- 📋 Accounting integrations (QuickBooks, Xero)


### Long-term Vision (2026+)
- 🎯 Become the leading payment infrastructure for Bitcoin commerce
- 🎯 Process $1B+ in annual payment volume
- 🎯 Support 10,000+ merchants globally
- 🎯 Enable new business models with programmable money


---


## 🛡️ Security & Compliance


### Security Measures
- **Non-Custodial Architecture**: We never hold merchant funds
- **API Security**: Rate limiting, API key rotation, IP whitelisting
- **Data Protection**: Encrypted at rest and in transit
- **Smart Contract Audits**: Planned third-party security audits
- **PCI Compliance**: Following payment industry best practices


### Open Source Commitment
- Transparent codebase for community review
- Bug bounty program (planned)
- Regular security updates
- Community-driven development


---


## 🏆 Why sBTC Pay Wins


### Competitive Advantages


1. **First-Mover Advantage**: First complete payment gateway for sBTC
2. **Developer Experience**: APIs that feel like Stripe, not blockchain
3. **Complete Solution**: Everything from APIs to dashboards in one platform
4. **Real Bitcoin**: Not wrapped tokens or synthetic assets
5. **Instant Settlement**: No waiting for confirmations
6. **Low Fees**: <0.1% transaction costs vs 2-3% for traditional processors
7. **Global Access**: Available anywhere without geographic restrictions


### Market Validation
- Active merchants using the platform
- Positive developer feedback
- Growing transaction volume
- Strategic position for sBTC mainnet launch


---


## 👥 Team & Contributors


### Core Team

 [Kai Builder](https://x.com/kai_builder)

### Community
- Open to contributions via GitHub
- Active development and feature requests
- Community-driven roadmap


---


## 📚 Documentation & Resources


### For Developers
- **API Documentation**: [sbtcpay.org/docs](https://sbtcpay.org/docs)
- **Integration Guides**: Step-by-step tutorials
- **Code Examples**: Sample implementations
- **Webhook Testing**: Built-in testing tools


### For Merchants
- **Getting Started Guide**: Quick setup instructions
- **Video Tutorials**: Coming soon
- **FAQ Section**: Common questions answered
- **Support Channel**: GitHub issues


---


## 🔗 Links & Resources


- **Website**: [sbtcpay.org](https://sbtcpay.org)
- **Demo Site**: [demo.sbtcpay.org](https://demo.sbtcpay.org)
- **GitHub**: [Source Code Repository](https://github.com/STX-CITY/sbtc-pay)
- **Documentation**: [sbtcpay.org/docs](https://sbtcpay.org/docs)



### Related Resources
- **sBTC Official**: [stacks.co/sbtc](https://stacks.co/sbtc)
- **Stacks Blockchain**: [stacks.co](https://stacks.co)
- **Hiro Wallet**: [wallet.hiro.so](https://wallet.hiro.so)


---


## 💬 Conclusion


sBTC Pay represents a paradigm shift in how businesses accept Bitcoin payments. By combining the security of Bitcoin with the programmability of smart contracts through sBTC, we've created a payment infrastructure that rivals traditional processors while remaining completely decentralized.


We're not just building another payment gateway - we're enabling a new economy where Bitcoin becomes as easy to accept as credit cards, but with instant settlement, lower fees, and global accessibility.


**The future of commerce is decentralized, and sBTC Pay is making it happen today.**


---


### 🏗️ Built for the Stacks Challenge 2025
### 💪 Powered by sBTC on Stacks
### ❤️ Made with love for the Bitcoin community