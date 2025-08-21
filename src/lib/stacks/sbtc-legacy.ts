import { request } from '@stacks/connect';
import {
  uintCV,
  standardPrincipalCV,
  noneCV
} from '@stacks/transactions';
import { SBTC_CONTRACT, getCurrentNetwork, type NetworkType, MICROUNITS_PER_SBTC } from './config';
import { validateStacksAddress } from './validation';
import { fetchBlockHeight } from './blockheight';

export interface SBTCTransferParams {
  paymentIntentId: string;
  amount: number;           // Amount in sBTC microunits (1 sBTC = 100,000,000 microunits)
  sender: string;          // Sender Stacks address
  recipient: string;        // Recipient Stacks address
  memo?: string;           // Optional memo (max 34 bytes)
  network?: NetworkType;   // Network type
}

export interface SBTCTransferResult {
  txId: string;
  paymentIntentId?: string;
}

export const transferSBTCLegacy = async ({
  paymentIntentId,
  amount,
  sender,
  recipient,
  memo,
  network = getCurrentNetwork()
  
}: SBTCTransferParams): Promise<SBTCTransferResult> => {
  try {
    const contractConfig = SBTC_CONTRACT[network];

    // Validate inputs
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }
    
    if (!validateStacksAddress(recipient, network)) {
      throw new Error('Invalid recipient address format');
    }

    if (memo && Buffer.from(memo, 'utf8').length > 34) {
      throw new Error('Memo must be 34 bytes or less');
    }

    console.log('Initiating sBTC transfer (Legacy):', {
      contractAddress: contractConfig.address,
      contractName: contractConfig.name,
      amount: `${amount} microsBTC (${amount / MICROUNITS_PER_SBTC} sBTC)`,
      sender,
      recipient,
      memo,
      network
    });

    // Use proven legacy CV functions
    const functionArgs = [
      uintCV(amount),                    // amount in microsBTC
      standardPrincipalCV(sender),       // sender address
      standardPrincipalCV(recipient),    // recipient address
      noneCV()                          // no memo for now
    ];
    
    console.log('Legacy function args created:', functionArgs);
    
    // Use request API for contract call
    const response = await request('stx_callContract', {
      contract: `${contractConfig.address}.${contractConfig.name}`,
      functionName: 'transfer',
      functionArgs,
      postConditionMode: 'allow',
      network: 'testnet'
    });

    const txCorrectFormat = response.txid?.startsWith('0x') ? response.txid : `0x${response.txid}`;

    // Update the payment intent with the tx id
    if (response.txid) {
      try {
        const apiKey = process.env.NEXT_PUBLIC_TEST_API_KEY || 'test_key';
        
        const updateResponse = await fetch(`/api/v1/payment_intents/${paymentIntentId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            tx_id: txCorrectFormat
          })
        });
        
        
        if (updateResponse.ok) {
          console.log(`Updated payment intent ${paymentIntentId} with transaction ID: ${response.txid}`);
        } else {
          console.error('Failed to update payment intent with transaction ID:', updateResponse.statusText);
        }
      } catch (error) {
        console.error('Error updating payment intent with transaction ID:', error);
      }
    }

    // Get current block height
    const currentBlockHeight = await fetchBlockHeight(network);

    // Use chainhooks to listen for the tx to be confirmed and update the database
    await fetch('/api/chainhooks/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_id: txCorrectFormat,
        start_block: currentBlockHeight,
        network: network
      }),
    });

    return {
      txId: response.txid || '',
      paymentIntentId
    };
  } catch (error) {
    console.error('sBTC transfer failed (Legacy):', error);
    throw new Error(`sBTC transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};