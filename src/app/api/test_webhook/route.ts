import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/webhooks/sender';

export async function POST(request: NextRequest) {
  try {
    // Get the webhook payload
    const body = await request.text();
    const headers = request.headers;

    // Log the received webhook
    console.log('=== WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Headers:', Object.fromEntries(headers.entries()));
    console.log('Body:', body);

    // Get signature from headers
    const signature = headers.get('x-sbtc-signature');
    const eventId = headers.get('x-sbtc-event-id');
    const eventType = headers.get('x-sbtc-event-type');

    console.log('Event ID:', eventId);
    console.log('Event Type:', eventType);
    console.log('Signature:', signature);

    // If we have a signature, verify it (optional for testing)
    if (signature) {
      // For testing, we'll assume the secret is 'test_secret'
      // In a real scenario, this would be your actual webhook secret
      const testSecret = 'test_secret';
      const isValid = verifyWebhookSignature(body, signature, testSecret);
      console.log('Signature Valid:', isValid);
      
      if (!isValid) {
        console.log('❌ Webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse the JSON payload if possible
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(body);
      console.log('Parsed Payload:', JSON.stringify(parsedPayload, null, 2));
    } catch (err) {
      console.log('Could not parse JSON payload:', err);
    }

    // Log payload details if it's a valid webhook
    if (parsedPayload) {
      console.log('--- Webhook Details ---');
      console.log('Webhook ID:', parsedPayload.id);
      console.log('Webhook Type:', parsedPayload.type);
      console.log('Created:', new Date(parsedPayload.created * 1000).toISOString());
      
      if (parsedPayload.data?.object) {
        console.log('Object Type:', parsedPayload.data.object.id ? 'Has ID' : 'No ID');
        console.log('Object Data:', JSON.stringify(parsedPayload.data.object, null, 2));
      }
    }

    console.log('✅ Webhook processed successfully');
    console.log('========================\n');

    // Return success response
    return NextResponse.json({
      received: true,
      timestamp: new Date().toISOString(),
      event_id: eventId,
      event_type: eventType,
      signature_verified: signature ? 'checked' : 'not_provided',
      payload_size: body.length
    });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Handle GET requests to show webhook endpoint info
export async function GET() {
  return NextResponse.json({
    message: 'Test Webhook Endpoint',
    description: 'This endpoint receives and logs webhook payloads for testing',
    methods: ['POST'],
    expected_headers: [
      'x-sbtc-signature',
      'x-sbtc-event-id', 
      'x-sbtc-event-type',
      'content-type'
    ],
    usage: 'Configure this URL as a webhook endpoint in your merchant dashboard'
  });
}