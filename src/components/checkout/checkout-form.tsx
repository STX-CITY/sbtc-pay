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
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(0);

  useEffect(() => {
    fetchPaymentIntent();
    fetchExchangeRate();
  }, [paymentIntentId]);

  const fetchPaymentIntent = async () => {
    try {
      const response = await fetch(`/api/v1/public/payment_intents/${paymentIntentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch payment intent');
      }

      const data = await response.json();
      setPaymentIntent(data);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment details');
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

  const handleEmailUpdate = async (email: string) => {
    if (!email || !paymentIntent) return;

    try {
      const apiKey = process.env.NEXT_PUBLIC_TEST_API_KEY || 'test_key';
      const response = await fetch(`/api/v1/payment_intents/${paymentIntent.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          customer_email: email
        })
      });

      if (response.ok) {
        const updatedPaymentIntent = await response.json();
        setPaymentIntent(updatedPaymentIntent);
      }
    } catch (err) {
      console.error('Failed to update payment intent with email:', err);
    }
  };

  const handleEmailChange = (email: string) => {
    setCustomerEmail(email);
    
    // Debounce the email update
    const timeoutId = setTimeout(() => {
      handleEmailUpdate(email);
    }, 1000);

    return () => clearTimeout(timeoutId);
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 text-sm font-semibold">₿</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Amount</span>
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">
                  {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
                </div>
                {paymentIntent.amount_usd && (
                  <div className="text-sm text-gray-500">
                    ≈ ${paymentIntent.amount_usd.toFixed(2)} USD
                  </div>
                )}
              </div>
            </div>
          </div>

          {paymentIntent.description && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Description</span>
                <span className="text-gray-900 text-right max-w-xs">
                  {paymentIntent.description}
                </span>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <span className="text-gray-600 font-medium">Payment ID</span>
              <span className="font-mono text-xs text-gray-500 break-all max-w-xs text-right">
                {paymentIntent.id}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                paymentIntent.status === 'created' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : paymentIntent.status === 'succeeded'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {paymentIntent.status.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Rate Info */}
      <div className="text-xs text-gray-500 text-center">
        Current rate: 1 sBTC = ${exchangeRate.toLocaleString()}
      </div>

      {/* Customer Email */}
      <div className="border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
        <div className="space-y-2">
          <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700">
            Email Address (Optional)
          </label>
          <input
            type="email"
            id="customer-email"
            value={customerEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <p className="text-xs text-gray-500">
            We'll send payment confirmations and receipts to this email.
          </p>
        </div>
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
      {walletAddress && paymentIntent.recipient_address && (
        <PaymentForm
          paymentIntentId={paymentIntent.id}
          amount={paymentIntent.amount}
          recipientAddress={paymentIntent.recipient_address}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
      
      {walletAddress && !paymentIntent.recipient_address && (
        <div className="text-center text-red-500 py-4">
          Merchant address not configured. Payment cannot proceed.
        </div>
      )}

      {!walletAddress && (
        <div className="text-center text-gray-500 py-4">
          Please connect your wallet to continue with the payment
        </div>
      )}
    </div>
  );
}