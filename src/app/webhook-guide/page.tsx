export default function WebhookGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Webhook Integration Guide
          </h1>
          
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🔐 Webhook Signature Verification
            </h2>
            
            <p className="text-gray-600 mb-4">
              All webhook payloads are signed with HMAC-SHA256 using your webhook endpoint's secret. 
              You should verify these signatures to ensure the webhooks are authentic and haven't been tampered with.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              📋 Required Headers
            </h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <ul className="space-y-2 text-sm font-mono">
                <li><strong>x-sbtc-signature:</strong> The webhook signature</li>
                <li><strong>x-sbtc-event-id:</strong> Unique event identifier</li>
                <li><strong>x-sbtc-event-type:</strong> Type of event (e.g., payment_intent.succeeded)</li>
                <li><strong>content-type:</strong> application/json</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔍 Signature Format
            </h3>
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <code className="text-sm">t=1640995200,v1=a2114d57b48eac7b3b047b7b9710aa3df2e2a49c7e0b4b6b5b8c4e3a6f2c8d9e</code>
              <p className="text-sm text-gray-600 mt-2">
                Where <code>t</code> is the timestamp and <code>v1</code> is the HMAC-SHA256 signature.
              </p>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              💻 Implementation Examples
            </h3>

            <h4 className="text-md font-semibold text-gray-700 mb-2">Node.js / Express</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
              <pre><code>{`const crypto = require('crypto');
const express = require('express');

const app = express();

// Middleware to capture raw body
app.use('/webhooks', express.raw({type: 'application/json'}));

function verifyWebhookSignature(payload, signature, secret, tolerance = 300) {
  try {
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1) {
      return false;
    }

    const timestampNum = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance (prevent replay attacks)
    if (Math.abs(now - timestampNum) > tolerance) {
      return false;
    }

    // Verify signature
    const signedPayload = \`\${timestamp}.\${payload}\`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

app.post('/webhooks', (req, res) => {
  const payload = req.body.toString();
  const signature = req.get('x-sbtc-signature');
  const secret = 'your_webhook_secret_here'; // Get from your webhook endpoint

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }

  const event = JSON.parse(payload);
  
  // Handle the webhook event
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', event.data.object.id);
      break;
    case 'payment_intent.failed':
      console.log('Payment failed:', event.data.object.id);
      break;
    default:
      console.log('Unhandled event type:', event.type);
  }

  res.status(200).send('OK');
});`}</code></pre>
            </div>

            <h4 className="text-md font-semibold text-gray-700 mb-2">Python / Flask</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
              <pre><code>{`import hmac
import hashlib
import time
from flask import Flask, request, abort

app = Flask(__name__)

def verify_webhook_signature(payload, signature, secret, tolerance=300):
    try:
        elements = signature.split(',')
        timestamp = None
        v1 = None
        
        for element in elements:
            if element.startswith('t='):
                timestamp = int(element.split('=')[1])
            elif element.startswith('v1='):
                v1 = element.split('=')[1]
        
        if not timestamp or not v1:
            return False
        
        # Check timestamp tolerance
        if abs(time.time() - timestamp) > tolerance:
            return False
        
        # Verify signature
        signed_payload = f"{timestamp}.{payload}"
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(v1, expected_signature)
    except Exception:
        return False

@app.route('/webhooks', methods=['POST'])
def handle_webhook():
    payload = request.get_data(as_text=True)
    signature = request.headers.get('x-sbtc-signature')
    secret = 'your_webhook_secret_here'  # Get from your webhook endpoint
    
    if not verify_webhook_signature(payload, signature, secret):
        abort(401)
    
    event = request.get_json()
    
    # Handle the webhook event
    if event['type'] == 'payment_intent.succeeded':
        print(f"Payment succeeded: {event['data']['object']['id']}")
    elif event['type'] == 'payment_intent.failed':
        print(f"Payment failed: {event['data']['object']['id']}")
    
    return 'OK', 200`}</code></pre>
            </div>

            <h4 className="text-md font-semibold text-gray-700 mb-2">PHP</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-4 overflow-x-auto">
              <pre><code>{`<?php
function verifyWebhookSignature($payload, $signature, $secret, $tolerance = 300) {
    $elements = explode(',', $signature);
    $timestamp = null;
    $v1 = null;
    
    foreach ($elements as $element) {
        if (strpos($element, 't=') === 0) {
            $timestamp = intval(substr($element, 2));
        } elseif (strpos($element, 'v1=') === 0) {
            $v1 = substr($element, 3);
        }
    }
    
    if (!$timestamp || !$v1) {
        return false;
    }
    
    // Check timestamp tolerance
    if (abs(time() - $timestamp) > $tolerance) {
        return false;
    }
    
    // Verify signature
    $signedPayload = $timestamp . '.' . $payload;
    $expectedSignature = hash_hmac('sha256', $signedPayload, $secret);
    
    return hash_equals($v1, $expectedSignature);
}

// Get webhook data
$payload = file_get_contents('php://input');
$signature = $_SERVER['HTTP_X_SBTC_SIGNATURE'] ?? '';
$secret = 'your_webhook_secret_here'; // Get from your webhook endpoint

if (!verifyWebhookSignature($payload, $signature, $secret)) {
    http_response_code(401);
    exit('Unauthorized');
}

$event = json_decode($payload, true);

// Handle the webhook event
switch ($event['type']) {
    case 'payment_intent.succeeded':
        error_log('Payment succeeded: ' . $event['data']['object']['id']);
        break;
    case 'payment_intent.failed':
        error_log('Payment failed: ' . $event['data']['object']['id']);
        break;
    default:
        error_log('Unhandled event type: ' . $event['type']);
}

echo 'OK';
?>`}</code></pre>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              ⚠️ Security Best Practices
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <ul className="space-y-2 text-sm text-yellow-800">
                <li><strong>Always verify signatures:</strong> Never process webhooks without verification</li>
                <li><strong>Use raw payload:</strong> Verify signature against the raw request body, not parsed JSON</li>
                <li><strong>Check timestamp:</strong> Reject webhooks older than 5 minutes (300 seconds)</li>
                <li><strong>Store secrets securely:</strong> Keep webhook secrets in environment variables</li>
                <li><strong>Use HTTPS:</strong> Only configure webhook URLs with HTTPS</li>
                <li><strong>Idempotency:</strong> Handle duplicate webhooks gracefully using event IDs</li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔄 Event Types
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 mb-6">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr><td className="px-6 py-4 text-sm font-mono">payment_intent.created</td><td className="px-6 py-4 text-sm">Payment intent created</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">payment_intent.succeeded</td><td className="px-6 py-4 text-sm">Payment completed successfully</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">payment_intent.failed</td><td className="px-6 py-4 text-sm">Payment failed</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">payment_intent.canceled</td><td className="px-6 py-4 text-sm">Payment canceled</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">product.created</td><td className="px-6 py-4 text-sm">Product created</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">product.updated</td><td className="px-6 py-4 text-sm">Product updated</td></tr>
                  <tr><td className="px-6 py-4 text-sm font-mono">product.deleted</td><td className="px-6 py-4 text-sm">Product deleted</td></tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🧪 Testing Your Implementation
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ol className="space-y-2 text-sm text-blue-800">
                <li>1. Set up your webhook endpoint with signature verification</li>
                <li>2. Configure the webhook URL in your merchant dashboard</li>
                <li>3. Use the test webhook feature to send sample events</li>
                <li>4. Create test payment intents and products to trigger real events</li>
                <li>5. Monitor your logs to ensure events are processed correctly</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}