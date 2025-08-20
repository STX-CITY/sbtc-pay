import { getCurrentNetwork } from '../stacks/config';

export interface TransactionStatus {
  txId: string;
  status: 'pending' | 'success' | 'failed';
  blockHeight?: number;
  blockHash?: string;
  confirmations?: number;
}

export async function getTransactionStatus(txId: string): Promise<TransactionStatus> {
  try {
    const network = getCurrentNetwork();
    const apiUrl = network === 'mainnet'
      ? 'https://api.stacks.co'
      : 'https://api.testnet.stacks.co';
    
    const response = await fetch(`${apiUrl}/extended/v1/tx/${txId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch transaction: ${response.statusText}`);
    }
    
    const txData = await response.json();
    
    let status: 'pending' | 'success' | 'failed';
    switch (txData.tx_status) {
      case 'success':
        status = 'success';
        break;
      case 'abort_by_response':
      case 'abort_by_post_condition':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }
    
    return {
      txId,
      status,
      blockHeight: txData.block_height,
      blockHash: txData.block_hash,
      confirmations: txData.confirmations || 0
    };
  } catch (error) {
    console.error('Error fetching transaction status:', error);
    return {
      txId,
      status: 'pending'
    };
  }
}

export async function waitForTransactionConfirmation(
  txId: string, 
  maxAttempts: number = 30,
  intervalMs: number = 10000
): Promise<TransactionStatus> {
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const status = await getTransactionStatus(txId);
    
    if (status.status !== 'pending') {
      return status;
    }
    
    attempts++;
    if (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }
  
  return {
    txId,
    status: 'pending'
  };
}

export interface BalanceInfo {
  balance: number; // in microsBTC
  locked: number;
  unlock_height: number;
}

export async function getSBTCBalance(address: string): Promise<BalanceInfo> {
  try {
    const network = getCurrentNetwork();
    const apiUrl = network === 'mainnet'
      ? 'https://api.stacks.co'
      : 'https://api.testnet.stacks.co';
    
    const contractId = `${process.env.SBTC_TOKEN_CONTRACT_ADDRESS || 'ST1F7QA2MDF17S807EPA36TSS8AMEFY4KA9TVGWXT.sbtc-token'}`;
    const response = await fetch(
      `${apiUrl}/extended/v1/address/${address}/balances`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }
    
    const balanceData = await response.json();
    const sbtcBalance = balanceData.fungible_tokens?.[contractId];
    
    return {
      balance: parseInt(sbtcBalance?.balance || '0'),
      locked: parseInt(sbtcBalance?.total_received || '0') - parseInt(sbtcBalance?.balance || '0'),
      unlock_height: 0
    };
  } catch (error) {
    console.error('Error fetching sBTC balance:', error);
    return {
      balance: 0,
      locked: 0,
      unlock_height: 0
    };
  }
}