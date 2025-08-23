'use client';

import { useState } from 'react';
import { InteractiveDemo } from '@/components/docs/interactive-demo';
import { PaymentComparison } from '@/components/docs/payment-comparison';
import { ApiReference } from '@/components/docs/api-reference';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFlow, setActiveFlow] = useState('merchant');

  const codeSnippets = {
    nextjsSetup: `// pages/api/products/create.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const response = await fetch('https://sbtcpay.org/api/v1/products', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.SBTC_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: req.body.name,
      description: req.body.description,
      price_usd: req.body.price,
      images: req.body.images
    })
  });

  const product = await response.json();
  res.status(200).json(product);
}`,

    nextjsCheckout: `// pages/checkout/[productId].js
import { useState } from 'react';
import { useRouter } from 'next/router';

export default function CheckoutPage({ product }) {
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const router = useRouter();

  const createPaymentIntent = async () => {
    setLoading(true);
    
    const response = await fetch('/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        amount: product.price_usd * 100, // Convert to cents
        customer_email: document.getElementById('email').value
      })
    });

    const intent = await response.json();
    setPaymentIntent(intent);
    
    // Redirect to sBTC Pay hosted checkout
    window.location.href = \`https://sbtcpay.org/checkout/\${intent.id}\`;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{product.name}</h1>
      <p className="text-gray-600 mb-4">{product.description}</p>
      <p className="text-3xl font-bold mb-6">\${product.price_usd}</p>
      
      <input
        id="email"
        type="email"
        placeholder="Your email"
        className="w-full p-2 border rounded mb-4"
        required
      />
      
      <button
        onClick={createPaymentIntent}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Processing...' : 'Pay with Bitcoin'}
      </button>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const response = await fetch(\`https://sbtcpay.org/api/v1/products/\${params.productId}\`, {
    headers: {
      'Authorization': \`Bearer \${process.env.SBTC_API_KEY}\`
    }
  });
  
  const product = await response.json();
  
  return {
    props: { product }
  };
}`,

    nextjsWebhook: `// pages/api/webhooks/sbtc.js
import crypto from 'crypto';

function verifySignature(payload, signature, secret) {
  const [timestamp, hash] = signature.split(',').map(part => part.split('=')[1]);
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');
  
  return hash === expectedHash;
}

export default async function handler(req, res) {
  const signature = req.headers['x-sbtc-signature'];
  const payload = JSON.stringify(req.body);
  
  // Verify webhook signature
  if (!verifySignature(payload, signature, process.env.SBTC_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Payment successful - fulfill order
      await fulfillOrder(event.data.object);
      break;
      
    case 'payment_intent.failed':
      // Payment failed - notify customer
      await notifyFailedPayment(event.data.object);
      break;
      
    case 'payment_intent.created':
      // Payment intent created - log for analytics
      console.log('New payment intent:', event.data.object.id);
      break;
  }
  
  res.status(200).json({ received: true });
}

async function fulfillOrder(paymentIntent) {
  // Update your database
  await db.orders.update({
    where: { payment_intent_id: paymentIntent.id },
    data: { 
      status: 'paid',
      paid_at: new Date()
    }
  });
  
  // Send confirmation email
  await sendEmail({
    to: paymentIntent.customer_email,
    subject: 'Payment Confirmed',
    template: 'payment-success',
    data: { amount: paymentIntent.amount / 100 }
  });
}`,

    storeExample: `// Complete Next.js Store Example

// 1. Environment Variables (.env.local)
SBTC_API_KEY=sk_live_your_api_key_here
SBTC_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_SBTC_BASE_URL=https://sbtcpay.org

// 2. Product Listing Page (pages/products.js)
export default function ProductsPage({ products }) {
  return (
    <div className="grid md:grid-cols-3 gap-6 p-6">
      {products.map(product => (
        <div key={product.id} className="border rounded-lg p-4">
          <img src={product.images[0]} alt={product.name} className="w-full h-48 object-cover rounded" />
          <h3 className="text-lg font-semibold mt-2">{product.name}</h3>
          <p className="text-gray-600">{product.description}</p>
          <p className="text-2xl font-bold mt-2">\${product.price_usd}</p>
          <a href={\`/checkout/\${product.id}\`} className="block mt-4 bg-blue-600 text-white text-center py-2 rounded">
            Buy Now
          </a>
        </div>
      ))}
    </div>
  );
}

// 3. API Route for Payment Creation (pages/api/payment/create.js)
export default async function handler(req, res) {
  const { product_id, customer_email } = req.body;
  
  const response = await fetch('https://sbtcpay.org/api/v1/payment_intents', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.SBTC_API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id,
      customer_email,
      success_url: \`\${process.env.NEXT_PUBLIC_BASE_URL}/success\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_BASE_URL}/products\`
    })
  });
  
  const paymentIntent = await response.json();
  res.status(200).json(paymentIntent);
}`,
    
    createProduct: `// Create a product via API
const response = await fetch('https://sbtcpay.org/api/v1/products', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Premium Subscription',
    description: 'Monthly premium features',
    price_usd: 29.99,
    images: ['https://example.com/image.jpg']
  })
});

const product = await response.json();
console.log('Product created:', product.id);`,
    
    createPaymentIntent: `// Create payment intent
const response = await fetch('https://sbtcpay.org/api/v1/payment_intents', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk_live_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    amount: 2999, // $29.99 in cents
    currency: 'usd',
    product_id: 'prod_123',
    customer_email: 'user@example.com'
  })
});

const paymentIntent = await response.json();
// Redirect to hosted checkout
window.location.href = \`https://sbtcpay.org/checkout/\${paymentIntent.id}\`;`,

    webhook: `// Handle webhook events
app.post('/webhooks/sbtc', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['x-sbtc-signature'];
  const payload = req.body.toString();
  
  if (!verifySignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Fulfill the order
      fulfillOrder(event.data.object);
      break;
    case 'payment_intent.failed':
      // Handle failed payment
      handleFailedPayment(event.data.object);
      break;
  }
  
  res.status(200).send('OK');
});`
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              sBTC Pay Documentation
            </h1>
            <p className="text-xl mb-8 text-blue-100">
              Complete guide to integrating Bitcoin payments with sBTC Pay
            </p>
            <div className="flex justify-center gap-4">
              <a href="/register" className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started
              </a>
              <a href="#examples" className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                View Examples
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-9 z-10">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'quickstart', label: 'Quick Start' },
              { id: 'flows', label: 'Payment Flows' },
              { id: 'api', label: 'API Reference' },
              { id: 'webhooks', label: 'Webhooks' },
              { id: 'examples', label: 'Examples' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-12">
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">What is sBTC Pay?</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-lg text-gray-600 mb-6">
                    sBTC Pay is a modern Bitcoin payment processor that enables merchants to accept 
                    Bitcoin payments through the Stacks blockchain using sBTC (Stacks Bitcoin).
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Fast & Secure</h3>
                        <p className="text-gray-600">Lightning-fast transactions with enterprise-grade security</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Developer Friendly</h3>
                        <p className="text-gray-600">RESTful APIs, webhooks, and comprehensive documentation</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Global Reach</h3>
                        <p className="text-gray-600">Accept payments from anywhere in the world</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Key Features</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Dashboard for merchants</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>RESTful API</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Real-time webhooks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Product management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Hosted checkout pages</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Architecture Diagram */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Architecture Overview</h2>
              <div className="bg-white rounded-2xl shadow-lg p-8 border">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center space-x-4">
                    <div className="bg-blue-100 p-4 rounded-lg">
                      <span className="text-blue-600 font-semibold">Your App</span>
                    </div>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="bg-green-100 p-4 rounded-lg">
                      <span className="text-green-600 font-semibold">sBTC Pay API</span>
                    </div>
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="bg-orange-100 p-4 rounded-lg">
                      <span className="text-orange-600 font-semibold">Stacks Blockchain</span>
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Create Products</h4>
                    <p className="text-sm text-gray-600">Set up your products and pricing</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Process Payments</h4>
                    <p className="text-sm text-gray-600">Handle payment intents and checkout</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Receive Webhooks</h4>
                    <p className="text-sm text-gray-600">Get notified of payment events</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Quick Start Tab */}
        {activeTab === 'quickstart' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Quick Start Guide</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-blue-500">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Account</h3>
                  <p className="text-gray-600 text-sm">Sign up and get your API keys from the merchant dashboard</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-green-500">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Create Products</h3>
                  <p className="text-gray-600 text-sm">Set up your products with pricing and descriptions</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border-t-4 border-purple-500">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Accept Payments</h3>
                  <p className="text-gray-600 text-sm">Integrate checkout and start accepting Bitcoin payments</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">🚀 Next.js Store Setup</h3>
              <div className="bg-black rounded p-4">
                <pre className="text-gray-300 text-sm overflow-x-auto">
{codeSnippets.storeExample}
                </pre>
              </div>
            </div>

            <InteractiveDemo />
          </div>
        )}

        {/* Payment Flows Tab */}
        {activeTab === 'flows' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-900">Payment Flows</h2>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveFlow('merchant')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFlow === 'merchant'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Merchant View
                </button>
                <button
                  onClick={() => setActiveFlow('customer')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeFlow === 'customer'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Customer View
                </button>
              </div>
            </div>

            {activeFlow === 'merchant' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Merchant Integration Flow</h3>
                  <div className="space-y-4">
                    {[
                      {
                        step: 1,
                        title: "Product Setup",
                        description: "Create products in your dashboard or via API",
                        code: codeSnippets.createProduct,
                        icon: "🏪"
                      },
                      {
                        step: 2,
                        title: "Payment Intent",
                        description: "Create payment intent when customer wants to buy",
                        code: codeSnippets.createPaymentIntent,
                        icon: "💳"
                      },
                      {
                        step: 3,
                        title: "Checkout Integration",
                        description: "Redirect customer to hosted checkout page",
                        code: codeSnippets.nextjsCheckout,
                        icon: "🛒"
                      },
                      {
                        step: 4,
                        title: "Webhook Handling",
                        description: "Process payment events in your backend",
                        code: codeSnippets.webhook,
                        icon: "🔔"
                      }
                    ].map((item) => (
                      <div key={item.step} className="bg-white rounded-lg p-6 shadow-sm border">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-lg">{item.icon}</span>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">Step {item.step}</span>
                              <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            </div>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <details className="group">
                              <summary className="cursor-pointer text-blue-600 text-sm font-medium">
                                View Code Example
                              </summary>
                              <div className="mt-2 bg-gray-900 rounded p-4 overflow-x-auto">
                                <pre className="text-gray-300 text-xs">
                                  <code>{item.code}</code>
                                </pre>
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeFlow === 'customer' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900">Customer Payment Journey</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {[
                        {
                          step: 1,
                          title: "Browse Products",
                          description: "Customer visits your store and selects products",
                          icon: "🛍️"
                        },
                        {
                          step: 2,
                          title: "Checkout",
                          description: "Customer proceeds to checkout and sees payment options",
                          icon: "📝"
                        },
                        {
                          step: 3,
                          title: "Payment Method",
                          description: "Choose between wallet connect or manual payment",
                          icon: "💰"
                        },
                        {
                          step: 4,
                          title: "Complete Payment",
                          description: "Payment is processed and confirmed on blockchain",
                          icon: "✅"
                        }
                      ].map((item) => (
                        <div key={item.step} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm">{item.icon}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{item.title}</h4>
                            <p className="text-gray-600 text-sm">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-lg p-6 shadow-sm border">
                      <h4 className="font-semibold mb-4">Payment Options</h4>
                      <div className="space-y-3">
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-orange-500">🔗</span>
                            <span className="font-medium">Wallet Connect</span>
                          </div>
                          <p className="text-sm text-gray-600">Connect your Stacks wallet (Hiro, Xverse) for seamless payment</p>
                        </div>
                        <div className="border rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-blue-500">📝</span>
                            <span className="font-medium">Manual Payment</span>
                          </div>
                          <p className="text-sm text-gray-600">Send sBTC manually using provided address and memo</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <PaymentComparison />
          </div>
        )}

        {/* API Reference Tab */}
        {activeTab === 'api' && <ApiReference />}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Webhooks</h2>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🔔</span>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Stay Informed with Webhooks</h3>
                  <p className="text-gray-700">
                    Receive real-time notifications when events happen in your account. 
                    Perfect for updating order status, sending emails, and keeping your system in sync.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Event Types</h3>
                {[
                  { event: 'payment_intent.created', desc: 'Payment intent created' },
                  { event: 'payment_intent.succeeded', desc: 'Payment completed successfully' },
                  { event: 'payment_intent.failed', desc: 'Payment failed' },
                  { event: 'payment_intent.expired', desc: 'Payment intent expired' },
                  { event: 'product.created', desc: 'New product created' },
                  { event: 'product.updated', desc: 'Product information updated' }
                ].map((item, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{item.event}</code>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-4">Webhook Security</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm">HMAC-SHA256 signatures</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm">Timestamp validation</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm">Individual endpoint secrets</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-sm">Automatic retries with exponential backoff</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Signature Header</h4>
                  <div className="bg-gray-100 rounded p-2 text-xs">
                    <code>x-sbtc-signature: t=1640995200,v1=a2114d57...</code>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl p-6">
              <h3 className="text-white text-lg font-semibold mb-4">Next.js Webhook Handler</h3>
              <div className="bg-black rounded p-4">
                <pre className="text-gray-300 text-sm overflow-x-auto">
{codeSnippets.nextjsWebhook}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Code Examples</h2>
            
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🛍️ Complete Next.js E-commerce Store</h3>
              <p className="text-gray-700 mb-6">
                A full example of integrating sBTC Pay into your Next.js store with products, checkout, and webhooks.
              </p>
              
              <div className="space-y-6">
                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="font-semibold mb-3">Step 1: Set up environment variables</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
{`// .env.local
SBTC_API_KEY=sk_live_your_api_key_here
SBTC_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_BASE_URL=https://yourstore.com`}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="font-semibold mb-3">Step 2: Create product API route</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
{codeSnippets.nextjsSetup}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="font-semibold mb-3">Step 3: Implement checkout page</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
{codeSnippets.nextjsCheckout}
                    </pre>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border">
                  <h4 className="font-semibold mb-3">Step 4: Handle webhooks</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-gray-300 text-sm overflow-x-auto">
{codeSnippets.nextjsWebhook}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📱 Subscription Service</h3>
                <p className="text-gray-600 mb-4">Handle recurring payments for subscriptions</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// Create subscription product
const response = await fetch('/api/products/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Premium Monthly',
    price: 9.99,
    description: 'Monthly subscription',
    metadata: { type: 'subscription' }
  })
});

// Handle recurring payments
// Set up a cron job to create payment intents monthly`}
                  </pre>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">🎫 Event Tickets</h3>
                <p className="text-gray-600 mb-4">Sell tickets with QR codes</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// Generate ticket after payment
webhook.on('payment_intent.succeeded', async (payment) => {
  const ticket = await generateTicket({
    event: 'Concert 2024',
    customer: payment.customer_email,
    seat: assignSeat()
  });
  
  await sendEmail({
    to: payment.customer_email,
    subject: 'Your Ticket',
    attachments: [ticket.pdf]
  });
});`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6">
                Join thousands of merchants already accepting Bitcoin payments with sBTC Pay
              </p>
              <div className="flex justify-center gap-4">
                <a href="/register" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Create Account
                </a>
                <a href="/checkout/product/prod_dJ5wruTLdgEYUFt3" className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  View Live Demo
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}