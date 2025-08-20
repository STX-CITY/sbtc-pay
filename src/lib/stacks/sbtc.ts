import { request } from '@stacks/connect';
import {
  uintCV,
  standardPrincipalCV,
  someCV,
  bufferCVFromString,
  noneCV,
  Pc,
  PostCondition,
  Cl  
} from '@stacks/transactions';
import { SBTC_CONTRACT, getNetwork, getCurrentNetwork, type NetworkType, MICROUNITS_PER_SBTC } from './config';

export interface SBTCTransferParams {
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

export const transferSBTC = async ({
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

    // Create the asset string for sBTC
    const assetString = `${contractConfig.address}.${contractConfig.name}::sbtc`;

    // Create post conditions to ensure the exact amount is transferred
    const postConditions: PostCondition[] = [
      Pc.principal(sender).willSendEq(amount).ft(assetString, 0)
    ];

    console.log('Initiating sBTC transfer:', {
      contractAddress: contractConfig.address,
      contractName: contractConfig.name,
      amount: `${amount} microsBTC (${amount / MICROUNITS_PER_SBTC} sBTC)`,
      sender,
      recipient,
      memo,
      network
    });

    debugger;
    // Use request API for contract call
    const response = await request('stx_callContract', {
      contract: `${contractConfig.address}.${contractConfig.name}`,
      functionName: 'transfer',
      functionArgs: [
        Cl.uint(amount),                    // amount in microsBTC
        Cl.principal(sender),       // sender address
        Cl.principal(recipient),    // recipient address
        Cl.none() 
      ],
      postConditionMode: 'allow',
      network: 'testnet'
    });

    console.log('sBTC transfer completed:', response);

    // Use chainhooks to listen for the tx to be confirmed and update the database
    const txCorrectFormat = response.txid?.startsWith('0x') ? response.txid : `0x${response.txid}`;
    await fetch('/api/chainhooks/bns/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_id: txCorrectFormat,
        start_block: blockHeight
      }),
    });
    

    return {
      txId: response.txid || '',
      paymentIntentId: memo?.includes('Payment:') ? memo.split('Payment:')[1]?.trim() : undefined
    };
  } catch (error) {
    console.error('sBTC transfer failed:', error);
    throw new Error(`sBTC transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get sBTC balance for an address using Stacks API
export const getSBTCBalance = async (
  address: string, 
  network: NetworkType = getCurrentNetwork()
): Promise<number> => {
  try {
    const contractConfig = SBTC_CONTRACT[network];
    
    // Use Stacks API to get balance instead of contract call
    const apiUrl = network === 'mainnet' 
      ? 'https://api.stacks.co'
      : 'https://api.testnet.stacks.co';
    
    const contractId = `${contractConfig.address}.${contractConfig.name}`;
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    
    const balanceData = await response.json();
    const sbtcBalance = balanceData.fungible_tokens?.[contractId];
    
    return parseInt(sbtcBalance?.balance || '0');
  } catch (error) {
    console.error('Failed to get sBTC balance:', error);
    throw new Error(`Failed to get sBTC balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate Stacks address format
export const validateStacksAddress = (address: string, network: NetworkType = getCurrentNetwork()): boolean => {
  if (network === 'mainnet') {
    return address.startsWith('SP');
  } else {
    return address.startsWith('ST');
  }
};

// Convert between sBTC and microsBTC
export const sbtcToMicrosBTC = (sbtcAmount: number): number => {
  return Math.floor(sbtcAmount * MICROUNITS_PER_SBTC);
};

export const microsBTCToSBTC = (microsBTCAmount: number): number => {
  return microsBTCAmount / MICROUNITS_PER_SBTC;
};

// Format sBTC amount for display
export const formatSBTCAmount = (microsBTCAmount: number, decimals: number = 8): string => {
  const sbtcAmount = microsBTCToSBTC(microsBTCAmount);
  return sbtcAmount.toFixed(decimals);
};