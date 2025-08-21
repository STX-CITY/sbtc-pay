const SBTCGateway = require('@sbtc-gateway/js');

// Initialize the SDK
const gateway = new SBTCGateway({
  apiKey: process.env.SBTC_API_KEY || 'your-api-key-here'
});

async function example() {
  try {
    console.log('🚀 sBTC Gateway SDK Example\n');

    // 1. Create a product
    console.log('📦 Creating a product...');
    const product = await gateway.products.create({
      name: 'Premium Coffee',
      description: 'Artisan roasted coffee beans',
      price_sbtc: 50000, // 50,000 satoshis
      price_usd: 25.00,
      metadata: { category: 'beverages' }
    });
    console.log(`✅ Product created: ${product.id}`);

    // 2. Create a payment intent
    console.log('\n💳 Creating a payment intent...');
    const payment = await gateway.paymentIntents.create({
      amount: 50000,
      currency: 'sbtc',
      description: 'Coffee purchase',
      metadata: { 
        product_id: product.id,
        customer_email: 'customer@example.com'
      }
    });
    console.log(`✅ Payment intent created: ${payment.id}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Amount: ${payment.amount} satoshis`);

    // 3. Get exchange rate
    console.log('\n💱 Getting current exchange rate...');
    const rate = await SBTCGateway.getExchangeRate();
    console.log(`✅ 1 sBTC = $${rate.sbtc_usd} USD`);
    console.log(`   Last updated: ${new Date(rate.timestamp * 1000).toISOString()}`);

    // 4. Validate a Bitcoin address
    console.log('\n🔍 Validating Bitcoin address...');
    const validation = await SBTCGateway.validateAddress('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    console.log(`✅ Address is ${validation.valid ? 'valid' : 'invalid'}`);
    console.log(`   Network: ${validation.network}`);

    // 5. Create a webhook endpoint
    console.log('\n🔔 Creating webhook endpoint...');
    const webhook = await gateway.webhookEndpoints.create({
      url: 'https://example.com/webhooks',
      events: ['payment_intent.succeeded', 'payment_intent.failed'],
      description: 'Payment notifications'
    });
    console.log(`✅ Webhook created: ${webhook.id}`);
    console.log(`   URL: ${webhook.url}`);

    // 6. Get dashboard stats
    console.log('\n📊 Fetching dashboard statistics...');
    const stats = await gateway.dashboard.getStats();
    console.log(`✅ Total payments: ${stats.total_payments}`);
    console.log(`   Total revenue: ${stats.total_revenue_sbtc} satoshis`);
    console.log(`   Success rate: ${((stats.successful_payments / stats.total_payments) * 100).toFixed(1)}%`);

    // 7. List recent payments
    console.log('\n📋 Listing recent payments...');
    const payments = await gateway.paymentIntents.list({ limit: 5 });
    console.log(`✅ Found ${payments.data.length} payments:`);
    payments.data.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.id} - ${p.status} - ${p.amount} sats`);
    });

    console.log('\n🎉 Example completed successfully!');
    
  } catch (error) {
    if (error.name === 'SBTCGatewayError') {
      console.error(`❌ API Error ${error.statusCode}: ${error.message}`);
      console.error(`   Type: ${error.type}`);
      console.error(`   Code: ${error.code}`);
    } else {
      console.error('❌ Unexpected error:', error.message);
    }
  }
}

// Run the example
if (require.main === module) {
  example();
}

module.exports = example;