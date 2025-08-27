'use client';

import { useState, useEffect } from 'react';
import { ApiReference } from '@/components/docs/api-reference';
import { WebhookTester } from '@/components/dashboard/webhook-tester';
import Link from 'next/link';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('quickstart');

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'api' || hash === 'webhook') {
        setActiveSection(hash);
      } else {
        setActiveSection('quickstart');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold mb-4">sBTC Pay Documentation</h1>
          <p className="text-xl text-blue-100">Simple Bitcoin payments for developers</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'quickstart', label: 'Quick Start', hash: '' },
              { id: 'api', label: 'API Reference', hash: '#api' },
              { id: 'webhook', label: 'Webhooks', hash: '#webhook' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveSection(tab.id);
                  window.location.hash = tab.hash;
                }}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeSection === tab.id
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Quick Start Section */}
        {activeSection === 'quickstart' && (
          <div className="space-y-12">
            {/* Quick Start Steps */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Quick Start</h2>
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Create account</h3>
                    <p className="text-gray-600">Sign up at <Link href="/register" className="text-blue-600 hover:underline">sbtcpay.org</Link> and get your API keys</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Create product</h3>
                    <p className="text-gray-600">Set up your products with pricing in the dashboard</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Get the checkout links or use API to generate payment links</h3>
                    <p className="text-gray-600">Use direct product links or <Link href="#api" className="text-blue-600 hover:underline">API</Link> for dynamic payment link generation</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Manually process customer in Dashboard or use Webhook</h3>
                    <p className="text-gray-600">Monitor payments in <a href="https://sbtcpay.org" className="text-blue-600 hover:underline">Dashboard</a> or automate with <Link href="#webhook" className="text-blue-600 hover:underline">Webhooks</Link></p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tools Section */}
            <section>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Tools</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    <Link href="#api" className="text-blue-600 hover:underline">API Reference</Link>
                  </h3>
                  <p className="text-gray-600 mb-4">Complete API documentation with live testing capabilities. You can call endpoints directly to test integration.</p>
                  <Link href="#api" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
                    View API Docs
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                <div className="bg-white border rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    <Link href="#webhook" className="text-blue-600 hover:underline">Webhook Caller</Link>
                  </h3>
                  <p className="text-gray-600 mb-4">Test and configure webhook endpoints to receive real-time payment notifications.</p>
                  <Link href="#webhook" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
                    Setup Webhooks
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="mt-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border rounded-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    <a href="https://demo.sbtcpay.org" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Sample Project Demo</a>
                  </h3>
                  <p className="text-gray-600 mb-4">See sBTC Pay in action with our live demo store. Test the complete payment flow from product selection to checkout.</p>
                  <a href="https://demo.sbtcpay.org" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700" target="_blank" rel="noopener noreferrer">
                    Try Live Demo
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* API Reference Section */}
        {activeSection === 'api' && <ApiReference />}

        {/* Webhook Section */}
        {activeSection === 'webhook' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-900">Webhooks</h2>
            
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Event Notifications</h3>
              <p className="text-gray-700">
                Receive instant notifications when payments are completed, failed, or other events occur. Perfect for automating order fulfillment and customer notifications.
              </p>
            </div>

            {/* Webhook Tester Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🔧</span>
                <h3 className="text-xl font-semibold text-gray-900">Webhook Tester</h3>
              </div>
              <p className="text-gray-600 mb-6">Test webhook endpoints and receive real-time notifications.</p>
              
              <WebhookTester />
            </div>

            {/* Webhook Integration Guide */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">📋</span>
                <h3 className="text-xl font-semibold text-gray-900">Webhook Integration Guide</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">1. Create Webhook Endpoint</h4>
                  <div className="bg-gray-900 rounded p-4 mb-3">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`// Express.js example
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = JSON.parse(req.body);
  } catch (err) {
    return res.status(400).send(\`Webhook error: \${err.message}\`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!');
      break;
    default:
      console.log(\`Unhandled event type \${event.type}\`);
  }

  res.json({received: true});
});`}
                    </pre>
                  </div>
                  <p className="text-gray-600 text-sm">Your endpoint should return a 2xx status code to acknowledge receipt of the webhook.</p>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">2. Register Webhook URL</h4>
                  <p className="text-gray-600 mb-3">Use the API or dashboard to register your webhook endpoint:</p>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`curl -X POST https://api.sbtcpay.org/v1/webhook-endpoints \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://your-domain.com/webhook",
    "events": ["payment_intent.succeeded", "payment_intent.failed"],
    "description": "My webhook endpoint"
  }'`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">3. Verify Webhook Signatures</h4>
                  <p className="text-gray-600 mb-3">Verify webhook signatures to ensure they're from sBTC Pay:</p>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Webhook Integration */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-3">🧪</span>
                <h3 className="text-xl font-semibold text-gray-900">Sample Webhook Integration</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">E-commerce Order Fulfillment</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`const express = require('express');
const app = express();

app.post('/webhook/sbtc-payment', express.json(), (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const payment = event.data.object;
      
      // Update order status
      updateOrderStatus(payment.metadata.order_id, 'paid');
      
      // Send confirmation email
      sendConfirmationEmail(payment.receipt_email, {
        orderId: payment.metadata.order_id,
        amount: payment.amount,
        currency: payment.currency
      });
      
      // Trigger fulfillment
      fulfillOrder(payment.metadata.order_id);
      break;
      
    case 'payment_intent.failed':
      const failedPayment = event.data.object;
      
      // Update order status
      updateOrderStatus(failedPayment.metadata.order_id, 'payment_failed');
      
      // Send failure notification
      sendPaymentFailedEmail(failedPayment.receipt_email);
      break;
  }
  
  res.json({ received: true });
});`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Subscription Service</h4>
                  <div className="bg-gray-900 rounded p-4">
                    <pre className="text-green-400 text-sm overflow-x-auto">
{`app.post('/webhook/subscription', express.json(), (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      const payment = event.data.object;
      
      if (payment.metadata.subscription_id) {
        // Extend subscription
        extendSubscription(
          payment.metadata.user_id,
          payment.metadata.subscription_id,
          payment.metadata.duration
        );
        
        // Grant access to premium features
        grantPremiumAccess(payment.metadata.user_id);
        
        // Send welcome email for new subscribers
        if (payment.metadata.is_first_payment === 'true') {
          sendWelcomeEmail(payment.receipt_email);
        }
      }
      break;
      
    case 'payment_intent.failed':
      const failedPayment = event.data.object;
      
      // Handle failed subscription payment
      handleSubscriptionPaymentFailure(
        failedPayment.metadata.user_id,
        failedPayment.metadata.subscription_id
      );
      break;
  }
  
  res.json({ received: true });
});`}
                    </pre>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-800 mb-2">💡 Best Practices</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Always verify webhook signatures for security</li>
                    <li>• Handle duplicate events with idempotency keys</li>
                    <li>• Return 2xx status codes quickly (within 30 seconds)</li>
                    <li>• Use exponential backoff for retry logic</li>
                    <li>• Log webhook events for debugging and monitoring</li>
                    <li>• Handle all event types gracefully, even unknown ones</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Common Events</h3>
                <div className="space-y-3">
                  {[
                    'payment_intent.created',
                    'payment_intent.succeeded',
                    'payment_intent.failed',
                    'payment_intent.canceled',
                    'product.created',
                    'product.updated',
                    'merchant.updated'
                  ].map((event) => (
                    <div key={event} className="bg-white border rounded p-3">
                      <code className="text-sm text-blue-600">{event}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Setup</h3>
                <div className="bg-gray-900 rounded p-4">
                  <pre className="text-green-400 text-sm overflow-x-auto">
{`// Minimal webhook endpoint
app.post('/webhooks/sbtc', (req, res) => {
  const event = req.body;
  
  if (event.type === 'payment_intent.succeeded') {
    // Fulfill the order
    fulfillOrder(event.data.object);
  }
  
  res.status(200).send('OK');
});`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}