'use client';

import { useState, useEffect } from 'react';
import { WalletConnect } from '@/components/sbtc/wallet-connect';
import { PaymentForm } from '@/components/sbtc/payment-form';
import { PaymentIntentResponse } from '@/types/api';

interface CheckoutFormProps {
  paymentIntentId: string;
}

export function CheckoutForm({ paymentIntentId }: CheckoutFormProps) {
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntentResponse | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  useEffect(() => {
    fetchPaymentIntent();
    fetchExchangeRate();
  }, [paymentIntentId]);

  const fetchPaymentIntent = async () => {
    try {
      // In a real app, this would be a public endpoint that doesn't require auth
      // For demo purposes, we'll simulate the data
      setPaymentIntent({
        id: paymentIntentId,
        amount: 10000000, // 0.1 sBTC in microsBTC (100,000,000 microunits = 1 sBTC)
        amount_usd: 9850, // $98.50 USD
        currency: 'sbtc',
        status: 'created',
        description: 'Product purchase from Demo Store',
        created: Math.floor(Date.now() / 1000)
      });
      setLoading(false);
    } catch (err) {
      setError('Failed to load payment details');
      setLoading(false);
    }
  };

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/v1/public/exchange_rate');
      const data = await response.json();
      setExchangeRate(data.sbtc_usd);
    } catch (err) {
      console.error('Failed to fetch exchange rate:', err);
      setExchangeRate(98500); // Fallback rate
    }
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
  };

  const handlePaymentSuccess = (txId: string) => {
    // Redirect to success page or update UI
    window.location.href = `/checkout/${paymentIntentId}?status=success&tx=${txId}`;
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">❌</div>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!paymentIntent) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Payment not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Details */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium text-gray-900 mb-3">Payment Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">
              {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
            </span>
          </div>
          {paymentIntent.amount_usd && (
            <div className="flex justify-between">
              <span className="text-gray-600">USD Equivalent:</span>
              <span className="font-medium">${paymentIntent.amount_usd.toFixed(2)}</span>
            </div>
          )}
          {paymentIntent.description && (
            <div className="flex justify-between">
              <span className="text-gray-600">Description:</span>
              <span className="font-medium">{paymentIntent.description}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Payment ID:</span>
            <span className="font-mono text-xs">{paymentIntent.id}</span>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="text-xs text-gray-500 text-center">
        Current rate: 1 sBTC = ${exchangeRate.toLocaleString()}
      </div>

      {/* Wallet Connection */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Connect Your Wallet</h3>
        <WalletConnect 
          onConnect={handleWalletConnect}
          onDisconnect={handleWalletDisconnect}
        />
      </div>

      {/* Payment Form */}
      {walletAddress && (
        <PaymentForm
          paymentIntentId={paymentIntent.id}
          amount={paymentIntent.amount}
          recipientAddress="ST1YCCFFCV8G9V2CSXRY8T7H8KYZCN4QWDF9SYEM7" // Merchant address
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}

      {!walletAddress && (
        <div className="text-center text-gray-500 py-4">
          Please connect your wallet to continue with the payment
        </div>
      )}
    </div>
  );
}