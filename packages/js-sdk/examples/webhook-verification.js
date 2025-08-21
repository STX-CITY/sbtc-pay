const SBTCGateway = require('@sbtc-gateway/js');

/**
 * Example of webhook signature verification
 * This would typically be used in your webhook handler endpoint
 */
async function verifyWebhookExample() {
  // Example webhook payload (what you'd receive in your webhook endpoint)
  const webhookPayload = JSON.stringify({
    id: 'evt_123abc',
    type: 'payment_intent.succeeded',
    data: {
      id: 'pi_456def',
      amount: 50000,
      currency: 'sbtc',
      status: 'succeeded'
    },
    created: Math.floor(Date.now() / 1000)
  });

  // Example signature from webhook headers (x-signature)
  const webhookSignature = 'sha256=7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730';
  
  // Your webhook endpoint secret
  const webhookSecret = 'whsec_abc123def456';

  try {
    console.log('🔐 Verifying webhook signature...');
    
    const isValid = await SBTCGateway.verifyWebhookSignature(
      webhookPayload,
      webhookSignature,
      webhookSecret
    );

    if (isValid) {
      console.log('✅ Webhook signature is valid!');
      
      // Parse and process the webhook
      const event = JSON.parse(webhookPayload);
      console.log(`📨 Processing event: ${event.type}`);
      console.log(`   Event ID: ${event.id}`);
      console.log(`   Payment ID: ${event.data.id}`);
      console.log(`   Amount: ${event.data.amount} satoshis`);
      console.log(`   Status: ${event.data.status}`);
      
      // Your business logic here
      switch (event.type) {
        case 'payment_intent.succeeded':
          console.log('💚 Payment succeeded - fulfill order');
          break;
        case 'payment_intent.failed':
          console.log('❌ Payment failed - handle failure');
          break;
        default:
          console.log(`🔄 Handling event type: ${event.type}`);
      }
      
    } else {
      console.log('❌ Invalid webhook signature - ignoring request');
      // Important: Always reject requests with invalid signatures
      // This protects against malicious requests
    }
    
  } catch (error) {
    console.error('Error verifying webhook:', error);
  }
}

/**
 * Example Express.js webhook handler
 */
function expressWebhookHandler() {
  return `
const express = require('express');
const SBTCGateway = require('@sbtc-gateway/js');
const app = express();

// Important: Use raw body parser for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));

app.post('/webhooks', async (req, res) => {
  const signature = req.headers['x-signature'];
  const payload = req.body.toString();
  const secret = process.env.WEBHOOK_SECRET;

  try {
    // Verify signature
    const isValid = await SBTCGateway.verifyWebhookSignature(
      payload, 
      signature, 
      secret
    );

    if (!isValid) {
      return res.status(400).send('Invalid signature');
    }

    // Process webhook
    const event = JSON.parse(payload);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Fulfill order
        await fulfillOrder(event.data);
        break;
      case 'payment_intent.failed':
        // Handle failed payment
        await handleFailedPayment(event.data);
        break;
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal error');
  }
});

app.listen(3000, () => {
  console.log('Webhook server running on port 3000');
});
`;
}

console.log('📝 Express.js webhook handler example:');
console.log(expressWebhookHandler());

// Run verification example
if (require.main === module) {
  verifyWebhookExample();
}