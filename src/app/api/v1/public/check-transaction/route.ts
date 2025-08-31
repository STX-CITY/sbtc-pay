import { NextRequest, NextResponse } from 'next/server';
import { db, paymentIntents, merchants } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { getCurrentNetwork } from '@/lib/stacks/config';
import { getRandomHeader } from '@/lib/utils/headers';

interface TransactionResult {
  tx: {
    tx_id: string;
    tx_status: string;
    block_time: number;
    block_time_iso: string;
    sender_address: string;
    contract_call?: {
      contract_id: string;
      function_name: string;
      function_args?: Array<{
        hex: string;
        repr: string;
        name: string;
        type: string;
      }>;
    };
  };
}

interface TransactionsResponse {
  limit: number;
  offset: number;
  total: number;
  results: TransactionResult[];
}

function hexToUtf8(hexString: string): string {
  // Remove 0x prefix if present
  const cleanHex = hexString.replace(/^0x/, '');
  
  // Skip the first byte (type indicator) and convert the rest
  const hexWithoutType = cleanHex.substring(2);
  
  let utf8String = '';
  for (let i = 0; i < hexWithoutType.length; i += 2) {
    const hexByte = hexWithoutType.substring(i, i + 2);
    const charCode = parseInt(hexByte, 16);
    if (charCode > 0) { // Skip null bytes
      utf8String += String.fromCharCode(charCode);
    }
  }
  
  // DO NOT remove spaces here - let the caller handle it
  return utf8String;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent ID is required' } },
        { status: 400 }
      );
    }

    // Get payment intent and merchant data
    const result = await db
      .select({
        paymentIntent: paymentIntents,
        merchantRecipientAddress: merchants.recipientAddress,
        merchantStacksAddress: merchants.stacksAddress
      })
      .from(paymentIntents)
      .leftJoin(merchants, eq(paymentIntents.merchantId, merchants.id))
      .where(eq(paymentIntents.id, paymentIntentId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Payment intent not found' } },
        { status: 404 }
      );
    }

    const { paymentIntent, merchantRecipientAddress, merchantStacksAddress } = result[0];
    const recipientAddress = merchantRecipientAddress || merchantStacksAddress;

    if (!recipientAddress) {
      return NextResponse.json(
        { error: { type: 'invalid_request_error', message: 'Recipient address not configured' } },
        { status: 400 }
      );
    }

    // Check if payment is already completed
    if (paymentIntent.status === 'succeeded') {
      return NextResponse.json({
        status: 'succeeded',
        txId: paymentIntent.txId,
        message: 'Payment already completed'
      });
    }

    // Get network configuration
    const network = getCurrentNetwork();
    const apiUrl = network === 'mainnet' 
      ? 'https://api.testnet.hiro.so'
      : 'https://api.testnet.hiro.so';

    // Query recent transactions for recipient address
    const transactionsUrl = `${apiUrl}/extended/v2/addresses/${recipientAddress}/transactions?limit=20`;
    const response = await fetch(transactionsUrl, {headers: getRandomHeader()});

    if (!response.ok) {
      throw new Error('Failed to fetch transactions from Hiro API');
    }

    const data: TransactionsResponse = await response.json();

    // Filter for sBTC transfers
    const sbtcTransfers = data.results.filter(result => {
      const tx = result.tx;
      
      // Check if it's a contract call
      if (!tx.contract_call) return false;
      
      // Check if it's an sBTC token transfer
      const isSbtcTransfer = 
        tx.contract_call.function_name === 'transfer' &&
        tx.contract_call.contract_id.includes('sbtc-token');
      
      if (!isSbtcTransfer) return false;

      // Check if transaction is successful
      if (tx.tx_status !== 'success') return false;

      return true;
    });

    // Check each transfer for matching payment
    for (const transfer of sbtcTransfers) {
      const tx = transfer.tx;
      const args = tx.contract_call?.function_args;
      
      if (!args || args.length < 4) continue;

      // Extract transfer details
      // arg[0] = amount, arg[1] = sender, arg[2] = recipient, arg[3] = memo
      const amountHex = args[0].hex;
      const recipientArg = args[2].repr;
      const memoArg = args[3];

      // Parse amount (remove 0x01 prefix for uint type)
      const amountStr = amountHex.replace(/^0x01/, '');
      const amount = parseInt(amountStr, 16);

      // Check if recipient matches
      const txRecipient = recipientArg.replace(/^'/, '').replace(/'$/, '');
      if (txRecipient !== recipientAddress) continue;

      // Check amount matches
      if (amount !== paymentIntent.amount) continue;

      // Check memo if present
      if (memoArg && memoArg.hex && memoArg.hex !== '0x09') { // 0x09 is "none"
        // Parse memo from hex
        const memoHex = memoArg.hex.replace(/^0x0a0200/, ''); // Remove optional wrapper
        const memo = hexToUtf8(memoHex);
        const cleanMeno = memo.trim();
        
        // Trim whitespace and remove all internal spaces
        
        
        if (memo.includes(paymentIntentId)) {
          // Found matching transaction! Update payment intent
          await db
            .update(paymentIntents)
            .set({
              status: 'succeeded',
              txId: tx.tx_id,
              updatedAt: new Date()
            })
            .where(eq(paymentIntents.id, paymentIntentId));

          return NextResponse.json({
            status: 'succeeded',
            txId: tx.tx_id,
            message: 'Payment verified and completed'
          });
        }
      }
    }

    // No matching transaction found yet
    return NextResponse.json({
      status: 'pending',
      message: 'Payment not yet detected. Please wait for blockchain confirmation.',
      checkedTransactions: sbtcTransfers.length
    });

  } catch (error) {
    console.error('Error checking transaction:', error);
    return NextResponse.json(
      { error: { type: 'api_error', message: 'Failed to check transaction status' } },
      { status: 500 }
    );
  }
}