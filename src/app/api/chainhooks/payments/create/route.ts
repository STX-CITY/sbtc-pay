import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getStartBlockHeight } from '@/lib/stacks/blockheight';

export const revalidate = 0;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const reqData = await req.json();
  const { start_block, tx_id, payment_intent_id, network = 'testnet' } = reqData;

  // If start_block is provided, use it; otherwise, get current block height
  let startBlock: number;
  if (start_block) {
    startBlock = parseInt(start_block, 10);
  } else {
    startBlock = await getStartBlockHeight(network, 10); // Start 10 blocks back
  }

  const chainhookName = `sbtc-payment-${payment_intent_id || tx_id}`;
  const uuid = uuidv4();

  // Webhook URL for payment notifications
  let webhookUrl = "https://your-domain.com/api/chainhooks/payments/hook";
  if (process.env.NODE_ENV === "development") {
    // Use ngrok or similar for development
    webhookUrl = process.env.WEBHOOK_URL || "https://72d502e8d2dc.ngrok-free.app/api/chainhooks/payments/hook";
  } else {
    // Production webhook URL
    webhookUrl = process.env.PRODUCTION_WEBHOOK_URL || "https://your-production-domain.com/api/chainhooks/payments/hook";
  }

  // Get environment variables
  const CHAINHOOK_API = process.env.CHAINHOOK_API_KEY || 'your-chainhook-api-key';
  const CHAINHOOK_BEARER = process.env.CHAINHOOK_BEARER || 'your-bearer-token';

  const chainhookTemplate = {
    "name": chainhookName,
    "uuid": uuid,
    "chain": "stacks",
    "version": 1,
    "networks": {
      "testnet": {
        "if_this": {
          "scope": "txid",
          "equals": tx_id
        },
        "end_block": null,
        "then_that": {
          "http_post": {
            "url": webhookUrl,
            "authorization_header": `Bearer ${CHAINHOOK_BEARER}`
          }
        },
        "start_block": startBlock,
        "decode_clarity_values": true,
        "expire_after_occurrence": 1
      },
      "mainnet": {
        "if_this": {
          "scope": "txid",
          "equals": tx_id
        },
        "end_block": null,
        "then_that": {
          "http_post": {
            "url": webhookUrl,
            "authorization_header": `Bearer ${CHAINHOOK_BEARER}`
          }
        },
        "start_block": startBlock,
        "decode_clarity_values": true,
        "expire_after_occurrence": 1
      }
    }
  };

  try {
    const response = await fetch(`https://api.platform.hiro.so/v1/ext/${CHAINHOOK_API}/chainhooks`, {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(chainhookTemplate)
    });

    const result = await response.json();
    console.log("Chainhook creation result:", result);
    
    if (!response.ok) {
      console.error('Chainhook creation failed:', response.status, result);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return new NextResponse(JSON.stringify({ 
      success: true, 
      txId: tx_id, 
      paymentIntentId: payment_intent_id,
      chainhookUuid: uuid,
      chainhookName: chainhookName,
      result: result
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error creating payment chainhook:', error);
    return new NextResponse(JSON.stringify({ 
      success: false, 
      error: 'Failed to create payment chainhook',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}