import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  standardPrincipalCV,
  someCV,
  bufferCVFromString,
  FungiblePostCondition,
} from '@stacks/transactions';
import { STACKS_NETWORK, NETWORK_CONFIG } from '../stacks/config';

export interface TransferSBTCParams {
  senderAddress: string;
  recipientAddress: string;
  amount: number; // in microsBTC
  memo?: string;
  privateKey: string;
}

export async function createSBTCTransfer(params: TransferSBTCParams) {
  const {
    senderAddress,
    recipientAddress,
    amount,
    memo = 'sBTC Payment',
    privateKey
  } = params;

  const postConditions: FungiblePostCondition[] = [
    {
      type: 'ft-postcondition',
      address: senderAddress,
      condition: 'eq' as const,
      amount: amount.toString(),
      asset: `${NETWORK_CONFIG.contract.address}.${NETWORK_CONFIG.contract.name}::sbtc`
    }
  ];

  const txOptions = {
    contractAddress: NETWORK_CONFIG.contract.address,
    contractName: NETWORK_CONFIG.contract.name,
    functionName: 'transfer',
    functionArgs: [
      uintCV(amount),
      standardPrincipalCV(senderAddress),
      standardPrincipalCV(recipientAddress),
      someCV(bufferCVFromString(memo))
    ],
    senderKey: privateKey,
    network: STACKS_NETWORK,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Deny,
    postConditions,
  };

  return makeContractCall(txOptions);
}

export async function broadcastSBTCTransfer(transaction: any) {
  try {
    const result = await broadcastTransaction(transaction);
    return result;
  } catch (error) {
    console.error('Error broadcasting sBTC transfer:', error);
    throw error;
  }
}

export function validateStacksAddress(address: string): boolean {
  // Validate Stacks address format - addresses can vary in length
  // SP for mainnet, ST for testnet, followed by base58 characters
  return /^SP[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,}$/.test(address) ||
         /^ST[123456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,}$/.test(address);
}