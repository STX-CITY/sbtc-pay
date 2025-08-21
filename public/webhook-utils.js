/**
 * sBTC Pay Webhook Utilities
 * 
 * Copy this file to your project to handle webhook signature verification
 * and event processing for sBTC Pay webhooks.
 */

const crypto = require('crypto');

/**
 * Verify webhook signature to ensure authenticity
 * 
 * @param {string} payload - Raw webhook payload (string)
 * @param {string} signature - x-sbtc-signature header value
 * @param {string} secret - Your webhook endpoint secret
 * @param {number} tolerance - Maximum age in seconds (default: 300 = 5 minutes)
 * @returns {boolean} True if signature is valid
 */
function verifyWebhookSignature(payload, signature, secret, tolerance = 300) {
  try {
    // Parse signature format: t=timestamp,v1=signature
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
    const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];

    if (!timestamp || !v1) {
      console.error('Invalid signature format');
      return false;
    }

    const timestampNum = parseInt(timestamp);
    const now = Math.floor(Date.now() / 1000);

    // Check timestamp tolerance to prevent replay attacks
    if (Math.abs(now - timestampNum) > tolerance) {
      console.error('Webhook timestamp too old');
      return false;
    }

    // Verify HMAC-SHA256 signature
    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    // Use timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Process webhook event with proper error handling
 * 
 * @param {Object} event - Parsed webhook event
 * @param {string} eventId - x-sbtc-event-id header value
 * @returns {boolean} True if event was processed successfully
 */
function processWebhookEvent(event, eventId) {
  try {
    console.log(`Processing webhook event: ${event.type} (${eventId})`);
    
    switch (event.type) {
      case 'payment_intent.created':
        return handlePaymentIntentCreated(event.data.object);
        
      case 'payment_intent.succeeded':
        return handlePaymentIntentSucceeded(event.data.object);
        
      case 'payment_intent.failed':
        return handlePaymentIntentFailed(event.data.object);
        
      case 'payment_intent.canceled':
        return handlePaymentIntentCanceled(event.data.object);
        
      case 'product.created':
        return handleProductCreated(event.data.object);
        
      case 'product.updated':
        return handleProductUpdated(event.data.object);
        
      case 'product.deleted':
        return handleProductDeleted(event.data.object);
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return true; // Return true to acknowledge receipt
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    return false;
  }
}

// Event handlers - customize these for your application
function handlePaymentIntentCreated(paymentIntent) {
  console.log('Payment intent created:', paymentIntent.id);
  // TODO: Update your database, send notifications, etc.
  return true;
}

function handlePaymentIntentSucceeded(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  // TODO: Fulfill order, update payment status, send confirmation email
  return true;
}

function handlePaymentIntentFailed(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  // TODO: Update payment status, notify customer, retry logic
  return true;
}

function handlePaymentIntentCanceled(paymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);
  // TODO: Update payment status, release inventory
  return true;
}

function handleProductCreated(product) {
  console.log('Product created:', product.id);
  // TODO: Sync with your catalog, update cache
  return true;
}

function handleProductUpdated(product) {
  console.log('Product updated:', product.id);
  // TODO: Update product in your system, invalidate cache
  return true;
}

function handleProductDeleted(product) {
  console.log('Product deleted:', product.id);
  // TODO: Remove from your catalog, handle dependencies
  return true;
}

/**
 * Express.js middleware for handling sBTC Pay webhooks
 * 
 * Usage:
 * app.use('/webhooks/sbtc', express.raw({type: 'application/json'}));
 * app.post('/webhooks/sbtc', handleSBTCWebhook);
 */
function handleSBTCWebhook(req, res) {
  const payload = req.body.toString();
  const signature = req.get('x-sbtc-signature');
  const eventId = req.get('x-sbtc-event-id');
  const eventType = req.get('x-sbtc-event-type');
  const secret = process.env.SBTC_WEBHOOK_SECRET; // Set this in your environment

  // Verify signature
  if (!verifyWebhookSignature(payload, signature, secret)) {
    console.error('Invalid webhook signature');
    return res.status(401).send('Unauthorized');
  }

  // Parse event
  let event;
  try {
    event = JSON.parse(payload);
  } catch (error) {
    console.error('Invalid JSON payload');
    return res.status(400).send('Bad Request');
  }

  // Process event
  const success = processWebhookEvent(event, eventId);
  
  if (success) {
    res.status(200).send('OK');
  } else {
    res.status(500).send('Internal Server Error');
  }
}

/**
 * Next.js API route handler for sBTC Pay webhooks
 * 
 * Usage in pages/api/webhooks/sbtc.js or app/api/webhooks/sbtc/route.js:
 */
function handleSBTCWebhookNextJS(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  const signature = req.headers['x-sbtc-signature'];
  const eventId = req.headers['x-sbtc-event-id'];
  const secret = process.env.SBTC_WEBHOOK_SECRET;

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }

  const event = JSON.parse(payload);
  const success = processWebhookEvent(event, eventId);
  
  res.status(success ? 200 : 500).send(success ? 'OK' : 'Error');
}

// Export functions for use in your application
module.exports = {
  verifyWebhookSignature,
  processWebhookEvent,
  handleSBTCWebhook,
  handleSBTCWebhookNextJS,
  // Individual event handlers for customization
  handlePaymentIntentCreated,
  handlePaymentIntentSucceeded,
  handlePaymentIntentFailed,
  handlePaymentIntentCanceled,
  handleProductCreated,
  handleProductUpdated,
  handleProductDeleted
};

// TypeScript type definitions (if using TypeScript)
/*
interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'canceled';
  customer_address?: string;
  customer_email?: string;
  description?: string;
  metadata?: Record<string, any>;
  created: number;
  updated: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  price_usd?: number;
  currency: string;
  images?: string[];
  metadata?: Record<string, any>;
  active: boolean;
  created: number;
  updated: number;
}

interface WebhookEvent {
  id: string;
  type: string;
  data: {
    object: PaymentIntent | Product;
  };
  created: number;
}
*/