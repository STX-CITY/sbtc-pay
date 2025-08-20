'use client';

import React, { useState } from 'react';
import { transferSBTC, formatSBTCAmount, microsBTCToSBTC } from '@/lib/stacks/sbtc';
import { getCurrentNetwork } from '@/lib/stacks/config';
import useWalletStore from '@/stores/WalletStore';

interface PaymentFormProps {
  paymentIntentId: string;
  amount: number; // in microsBTC
  recipientAddress: string;
  onSuccess: (txId: string) => void;
  onError: (error: string) => void;
}

// Network is now managed by the config system

export function PaymentForm({ 
  paymentIntentId, 
  amount, 
  recipientAddress, 
  onSuccess, 
  onError 
}: PaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentAddress } = useWalletStore();

  const handlePayment = async () => {
    if (!currentAddress) {
      onError('No wallet connected');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await transferSBTC({
        paymentIntentId,
        amount,
        sender: currentAddress,
        recipient: recipientAddress,
        memo: `Payment: ${paymentIntentId}`,
        network: getCurrentNetwork()
      });

      console.log('sBTC transfer completed:', result);
      onSuccess(result.txId);
    } catch (error) {
      console.error('sBTC payment error:', error);
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Amount:</span>
            <span>{formatSBTCAmount(amount)} sBTC</span>
          </div>
          {currentAddress && (
            <div className="flex justify-between">
              <span>From:</span>
              <span className="text-sm font-mono">
                {currentAddress.slice(0, 8)}...{currentAddress.slice(-8)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>To:</span>
            <span className="text-sm font-mono">
              {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-8)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Payment ID:</span>
            <span className="text-sm">{paymentIntentId}</span>
          </div>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={`w-full py-3 px-4 rounded-lg font-semibold ${
          isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isProcessing ? 'Processing Payment...' : 'Pay with sBTC'}
      </button>
    </div>
  );
}