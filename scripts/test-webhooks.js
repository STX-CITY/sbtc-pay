#!/usr/bin/env node

/**
 * Test script for webhook functionality
 * 
 * This script tests the webhook events for payment intents:
 * - payment_intent.created
 * - payment_intent.succeeded  
 * - payment_intent.failed
 * - payment_intent.canceled
 */

const https = require('https');
const http = require('http');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test_sk_your_test_api_key_here';
const WEBHOOK_PORT = 8080;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Webhook server to receive events
let webhookEvents = [];
let webhookServer;

function startWebhookServer() {
  return new Promise((resolve) => {
    webhookServer = http.createServer((req, res) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const event = JSON.parse(body);
            webhookEvents.push({
              headers: req.headers,
              body: event,
              timestamp: new Date().toISOString()
            });
            console.log(`${colors.cyan}📨 Webhook received:${colors.reset} ${event.type}`);
            res.writeHead(200);
            res.end('OK');
          } catch (error) {
            res.writeHead(400);
            res.end('Bad Request');
          }
        });
      }
    });
    
    webhookServer.listen(WEBHOOK_PORT, () => {
      console.log(`${colors.green}✓ Webhook server listening on port ${WEBHOOK_PORT}${colors.reset}`);
      resolve();
    });
  });
}

function stopWebhookServer() {
  return new Promise((resolve) => {
    if (webhookServer) {
      webhookServer.close(resolve);
    } else {
      resolve();
    }
  });
}

// API request helper
async function apiRequest(path, method = 'GET', body = null) {
  const url = new URL(path, BASE_URL);
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    }
  };

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            data: JSON.parse(data)
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Test scenarios
async function runTests() {
  console.log(`${colors.magenta}🧪 Starting webhook tests...${colors.reset}\n`);
  
  // Start webhook server
  await startWebhookServer();
  
  try {
    // 1. Setup webhook endpoint
    console.log(`${colors.yellow}Setting up webhook endpoint...${colors.reset}`);
    const webhookEndpoint = await apiRequest('/api/v1/webhook-endpoints', 'POST', {
      url: `http://localhost:${WEBHOOK_PORT}/webhook`,
      events: JSON.stringify([
        'payment_intent.created',
        'payment_intent.succeeded',
        'payment_intent.failed',
        'payment_intent.canceled'
      ]),
      description: 'Test webhook endpoint'
    });
    
    if (webhookEndpoint.status === 201 || webhookEndpoint.status === 200) {
      console.log(`${colors.green}✓ Webhook endpoint created${colors.reset}`);
    } else {
      console.log(`${colors.red}✗ Failed to create webhook endpoint:${colors.reset}`, webhookEndpoint.data);
    }
    
    // 2. Create a payment intent (should trigger payment_intent.created)
    console.log(`\n${colors.yellow}Creating payment intent...${colors.reset}`);
    const paymentIntent = await apiRequest('/api/v1/payment_intents', 'POST', {
      amount: 100000, // 0.001 sBTC
      currency: 'sbtc',
      description: 'Test payment for webhook testing',
      metadata: {
        merchantId: 'test-merchant-id', // You'll need to replace with actual merchant ID
        test: true
      }
    });
    
    if (paymentIntent.status === 200 || paymentIntent.status === 201) {
      console.log(`${colors.green}✓ Payment intent created:${colors.reset} ${paymentIntent.data.id}`);
      
      const paymentIntentId = paymentIntent.data.id;
      
      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 3. Simulate success (should trigger payment_intent.succeeded)
      console.log(`\n${colors.yellow}Simulating payment success...${colors.reset}`);
      const successResult = await apiRequest(
        `/api/v1/payment_intents/${paymentIntentId}/simulate_success`,
        'POST'
      );
      
      if (successResult.status === 200) {
        console.log(`${colors.green}✓ Payment marked as succeeded${colors.reset}`);
      }
      
      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 4. Create another payment intent for failure test
      console.log(`\n${colors.yellow}Creating another payment intent for failure test...${colors.reset}`);
      const paymentIntent2 = await apiRequest('/api/v1/payment_intents', 'POST', {
        amount: 200000,
        currency: 'sbtc',
        description: 'Test payment for failure',
        metadata: {
          merchantId: 'test-merchant-id',
          test: true
        }
      });
      
      if (paymentIntent2.status === 200 || paymentIntent2.status === 201) {
        const paymentIntentId2 = paymentIntent2.data.id;
        
        // Simulate failure
        console.log(`\n${colors.yellow}Simulating payment failure...${colors.reset}`);
        const failureResult = await apiRequest(
          `/api/v1/payment_intents/${paymentIntentId2}/simulate_failure`,
          'POST'
        );
        
        if (failureResult.status === 200) {
          console.log(`${colors.green}✓ Payment marked as failed${colors.reset}`);
        }
      }
      
      // Wait for webhook
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Create and cancel a payment intent
      console.log(`\n${colors.yellow}Creating payment intent to cancel...${colors.reset}`);
      const paymentIntent3 = await apiRequest('/api/v1/payment_intents', 'POST', {
        amount: 300000,
        currency: 'sbtc',
        description: 'Test payment for cancellation',
        metadata: {
          merchantId: 'test-merchant-id',
          test: true
        }
      });
      
      if (paymentIntent3.status === 200 || paymentIntent3.status === 201) {
        const paymentIntentId3 = paymentIntent3.data.id;
        
        console.log(`\n${colors.yellow}Canceling payment intent...${colors.reset}`);
        const cancelResult = await apiRequest(
          `/api/v1/payment_intents/${paymentIntentId3}/cancel`,
          'POST'
        );
        
        if (cancelResult.status === 200) {
          console.log(`${colors.green}✓ Payment canceled${colors.reset}`);
        }
      }
      
      // Wait for final webhooks
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Summary
      console.log(`\n${colors.magenta}📊 Webhook Events Summary:${colors.reset}`);
      console.log(`Total events received: ${webhookEvents.length}`);
      
      const eventTypes = {};
      webhookEvents.forEach(event => {
        const type = event.body.type;
        eventTypes[type] = (eventTypes[type] || 0) + 1;
      });
      
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
      
      // Check if all expected events were received
      const expectedEvents = [
        'payment_intent.created',
        'payment_intent.succeeded',
        'payment_intent.failed',
        'payment_intent.canceled'
      ];
      
      const missingEvents = expectedEvents.filter(event => !eventTypes[event]);
      
      if (missingEvents.length === 0) {
        console.log(`\n${colors.green}✅ All webhook events were successfully triggered!${colors.reset}`);
      } else {
        console.log(`\n${colors.red}⚠️  Missing events: ${missingEvents.join(', ')}${colors.reset}`);
      }
      
    } else {
      console.log(`${colors.red}✗ Failed to create payment intent:${colors.reset}`, paymentIntent.data);
    }
    
  } catch (error) {
    console.error(`${colors.red}Error during tests:${colors.reset}`, error);
  } finally {
    await stopWebhookServer();
    console.log(`\n${colors.cyan}Test completed${colors.reset}`);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };