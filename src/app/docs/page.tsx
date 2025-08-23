'use client';

import { useState } from 'react';
import { InteractiveDemo } from '@/components/docs/interactive-demo';
import { PaymentComparison } from '@/components/docs/payment-comparison';

export default function DocsPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFlow, setActiveFlow] = useState('merchant');

  const codeSnippets = {
    createProduct: `// Create a product
const product = await fetch('/api/v1/products', {
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
});`,
    
    createPaymentIntent: `// Create payment intent
const paymentIntent = await fetch('/api/v1/payment_intents', {
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
});`,

    checkoutForm: `// Frontend checkout integration
import { SBTCPayCheckout } from '@sbtc-pay/react';

function CheckoutPage() {
  return (
    <SBTCPayCheckout
      paymentIntentId="pi_123"
      onSuccess={(payment) => {
        console.log('Payment succeeded:', payment.id);
        window.location.href = '/success';
      }}
      onError={(error) => {
        console.error('Payment failed:', error);
      }}
    />
  );
}`,

    webhook: `// Handle webhook events
app.post('/webhooks/sbtc', (req, res) => {
  const signature = req.get('x-sbtc-signature');
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
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Get Started
              </button>
              <button className="border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                View Examples
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
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
                      <span>Multiple payment methods</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Real-time webhooks</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Dashboard analytics</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Product management</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      <span>Manual payments</span>
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
              <h3 className="text-white text-lg font-semibold mb-4">🚀 Install SDK</h3>
              <div className="bg-black rounded p-4 mb-4">
                <code className="text-green-400">npm install @sbtc-pay/js @sbtc-pay/react</code>
              </div>
              <div className="bg-gray-800 rounded p-4">
                <pre className="text-gray-300 text-sm overflow-x-auto">
{`import { SBTCPay } from '@sbtc-pay/js';

const sbtcPay = new SBTCPay({
  apiKey: 'sk_live_...',
  environment: 'production' // or 'sandbox'
});

// Create a payment intent
const paymentIntent = await sbtcPay.paymentIntents.create({
  amount: 2999, // $29.99
  currency: 'usd',
  customer_email: 'user@example.com'
});`}
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
                        description: "Show checkout form to customer",
                        code: codeSnippets.checkoutForm,
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
        {activeTab === 'api' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">API Reference</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Base URL</h3>
                  <div className="bg-gray-100 rounded p-3">
                    <code className="text-sm">https://sbtcpay.org/v1</code>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-900">Authentication</h3>
                  <p className="text-gray-600 mb-3">Include your API key in the Authorization header:</p>
                  <div className="bg-gray-900 rounded p-3">
                    <code className="text-green-400 text-sm">Authorization: Bearer sk_live_...</code>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">API Endpoints</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Products</span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">/products</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Intents</span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">/payment_intents</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Webhooks</span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">/webhook-endpoints</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dashboard</span>
                    <span className="bg-white bg-opacity-20 px-2 py-1 rounded">/dashboard/stats</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {[
                {
                  method: 'POST',
                  endpoint: '/products',
                  title: 'Create Product',
                  description: 'Create a new product for sale',
                  example: {
                    request: `{
  "name": "Premium Plan",
  "description": "Monthly subscription",
  "price_usd": 29.99,
  "images": ["https://example.com/image.jpg"]
}`,
                    response: `{
  "id": "prod_123",
  "name": "Premium Plan",
  "price_usd": 29.99,
  "active": true,
  "created": 1640995200
}`
                  }
                },
                {
                  method: 'POST',
                  endpoint: '/payment_intents',
                  title: 'Create Payment Intent',
                  description: 'Create a payment intent for checkout',
                  example: {
                    request: `{
  "amount": 2999,
  "currency": "usd",
  "product_id": "prod_123",
  "customer_email": "user@example.com"
}`,
                    response: `{
  "id": "pi_123",
  "amount": 2999,
  "status": "created",
  "recipient_address": "SP123...",
  "memo": "pi_123"
}`
                  }
                }
              ].map((api, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        api.method === 'POST' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {api.method}
                      </span>
                      <code className="text-sm">{api.endpoint}</code>
                    </div>
                    <h3 className="font-semibold mt-2">{api.title}</h3>
                    <p className="text-gray-600 text-sm">{api.description}</p>
                  </div>
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Request</h4>
                        <div className="bg-gray-900 rounded p-3 text-xs">
                          <pre className="text-gray-300">{api.example.request}</pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Response</h4>
                        <div className="bg-gray-900 rounded p-3 text-xs">
                          <pre className="text-gray-300">{api.example.response}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <span className="text-sm">Automatic retries</span>
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
              <h3 className="text-white text-lg font-semibold mb-4">Example Webhook Handler</h3>
              <div className="bg-black rounded p-4">
                <pre className="text-gray-300 text-sm overflow-x-auto">
{`app.post('/webhooks/sbtc', express.raw({type: 'application/json'}), (req, res) => {
  const payload = req.body.toString();
  const signature = req.get('x-sbtc-signature');
  const secret = process.env.SBTC_WEBHOOK_SECRET;
  
  if (!verifySignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(payload);
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Fulfill the order
      await fulfillOrder(event.data.object);
      break;
    case 'payment_intent.failed':
      // Handle failed payment
      await handleFailedPayment(event.data.object);
      break;
  }
  
  res.status(200).send('OK');
});`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Examples Tab */}
        {activeTab === 'examples' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Code Examples</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">🛒 E-commerce Integration</h3>
                <p className="text-gray-600 mb-4">Complete checkout flow for an online store</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// 1. Create product
const product = await sbtcPay.products.create({
  name: 'Cool T-Shirt',
  price_usd: 25.00,
  images: ['https://shop.com/tshirt.jpg']
});

// 2. Create payment intent
const paymentIntent = await sbtcPay.paymentIntents.create({
  amount: 2500, // $25.00
  product_id: product.id,
  customer_email: 'customer@example.com'
});

// 3. Show checkout
window.location.href = \`/checkout/\${paymentIntent.id}\`;`}
                  </pre>
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium">View full example →</a>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">📱 Subscription Service</h3>
                <p className="text-gray-600 mb-4">Monthly recurring payments setup</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// Create subscription product
const subscription = await sbtcPay.products.create({
  name: 'Premium Monthly',
  price_usd: 9.99,
  type: 'subscription',
  metadata: { interval: 'month' }
});

// Handle subscription webhook
app.post('/webhooks', (req, res) => {
  const event = JSON.parse(req.body);
  
  if (event.type === 'payment_intent.succeeded') {
    // Activate user's subscription
    await activateSubscription(event.data.object);
  }
});`}
                  </pre>
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium">View full example →</a>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">🎫 Event Tickets</h3>
                <p className="text-gray-600 mb-4">Sell event tickets with Bitcoin payments</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// Create ticket product
const ticket = await sbtcPay.products.create({
  name: 'Concert Ticket',
  price_usd: 75.00,
  metadata: { 
    event_date: '2024-12-31',
    venue: 'Music Hall'
  }
});

// Generate unique ticket on payment
webhook.on('payment_intent.succeeded', async (payment) => {
  const ticketCode = generateTicketCode();
  await sendTicketEmail(payment.customer_email, ticketCode);
});`}
                  </pre>
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium">View full example →</a>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold mb-4">💝 Digital Downloads</h3>
                <p className="text-gray-600 mb-4">Sell digital products and files</p>
                <div className="bg-gray-900 rounded p-4 mb-4">
                  <pre className="text-gray-300 text-xs overflow-x-auto">
{`// Create digital product
const ebook = await sbtcPay.products.create({
  name: 'Bitcoin Guide eBook',
  price_usd: 19.99,
  metadata: { 
    type: 'digital',
    download_url: 'https://files.com/ebook.pdf'
  }
});

// Provide download link after payment
webhook.on('payment_intent.succeeded', (payment) => {
  const downloadLink = generateSecureLink(payment.product.metadata.download_url);
  sendDownloadEmail(payment.customer_email, downloadLink);
});`}
                  </pre>
                </div>
                <a href="#" className="text-blue-600 text-sm font-medium">View full example →</a>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Get Started?</h3>
              <p className="text-gray-600 mb-6">
                Join thousands of merchants already accepting Bitcoin payments with sBTC Pay
              </p>
              <div className="flex justify-center gap-4">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Create Account
                </button>
                <button className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  View Live Demo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}