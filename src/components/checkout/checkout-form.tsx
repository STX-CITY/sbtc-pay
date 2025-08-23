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
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');

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
    // Redirect to checkout page with tx_broadcast status
    window.location.href = `/checkout/${paymentIntentId}?status=tx_broadcast&tx=${txId}`;
  };

  const handlePaymentError = (error: string) => {
    setError(error);
  };

  const handleManualPaymentConfirm = () => {
    // Redirect to checkout page to monitor transaction status
    window.location.href = `/checkout/${paymentIntentId}?status=tx_broadcast`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleEmailUpdate = async (email: string) => {
    if (!email || !paymentIntent) return;

    try {
      // For checkout pages, we use the test API key since customers don't have accounts
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
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-100 rounded-lg p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
          <div className="bg-gray-100 rounded-lg p-4 space-y-3 mt-4">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded mt-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.19 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!paymentIntent) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-600">Payment details not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">₿</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Payment Summary</h3>
              <p className="text-sm text-gray-500">Secure sBTC transaction</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            paymentIntent.status === 'created' 
              ? 'bg-amber-100 text-amber-800' 
              : paymentIntent.status === 'succeeded'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {paymentIntent.status.replace('_', ' ').toUpperCase()}
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
              </div>
              {paymentIntent.amount_usd && (
                <div className="text-sm text-gray-500 mt-1">
                  ≈ ${paymentIntent.amount_usd.toFixed(2)} USD
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Exchange Rate</div>
              <div className="text-sm font-medium text-gray-700">
                1 sBTC = ${exchangeRate.toLocaleString()}
              </div>
            </div>
          </div>
          
          {paymentIntent.description && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Description:</span> {paymentIntent.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div>
          <label htmlFor="customer-email" className="block text-sm font-medium text-gray-900 mb-2">
            Email address
          </label>
          <input
            type="email"
            id="customer-email"
            value={customerEmail}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-all bg-white text-gray-900 placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            We'll send your receipt and payment confirmations here
          </p>
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment method</h3>
          <div className="space-y-3">
            <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'wallet' 
                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="payment-method"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={() => setPaymentMethod('wallet')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'wallet' 
                  ? 'border-blue-600' 
                  : 'border-gray-300'
              }`}>
                {paymentMethod === 'wallet' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-gray-900">Wallet Payment</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Connect your wallet and pay automatically</p>
              </div>
              {paymentMethod === 'wallet' && (
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </label>

            <label className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
              paymentMethod === 'manual' 
                ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                : 'border-gray-300 hover:border-gray-400'
            }`}>
              <input
                type="radio"
                name="payment-method"
                value="manual"
                checked={paymentMethod === 'manual'}
                onChange={() => setPaymentMethod('manual')}
                className="sr-only"
              />
              <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                paymentMethod === 'manual' 
                  ? 'border-blue-600' 
                  : 'border-gray-300'
              }`}>
                {paymentMethod === 'manual' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium text-gray-900">Manual Payment</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">Copy address and send payment manually</p>
              </div>
              {paymentMethod === 'manual' && (
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Wallet Payment */}
      {paymentMethod === 'wallet' && (
        <div className="space-y-4">
          <div className="border border-gray-200 rounded-xl p-6">
            <h4 className="font-medium text-gray-900 mb-4">Connect Wallet</h4>
            <WalletConnect 
              onConnect={handleWalletConnect}
              onDisconnect={handleWalletDisconnect}
            />
          </div>

          {walletAddress && paymentIntent.recipient_address && (
            <div className="border border-gray-200 rounded-xl p-6">
              <PaymentForm
                paymentIntentId={paymentIntent.id}
                amount={paymentIntent.amount}
                recipientAddress={paymentIntent.recipient_address}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}
          
          {walletAddress && !paymentIntent.recipient_address && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-red-800">
                  <strong>Configuration Error:</strong> Merchant payment address not configured. Please contact support.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Payment */}
      {paymentMethod === 'manual' && paymentIntent.recipient_address && (
        <div className="border border-gray-200 rounded-xl p-6">
          <h4 className="font-medium text-gray-900 mb-4">Manual Payment Instructions</h4>
          
          <div className="space-y-4">
            {/* Payment Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Recipient Address
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                  <code className="flex-1 px-3 py-3 text-sm font-mono text-gray-900 break-all">
                    {paymentIntent.recipient_address}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentIntent.recipient_address || '')}
                    className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-r-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Amount
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                  <code className="flex-1 px-3 py-3 text-sm font-mono text-gray-900">
                    {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
                  </code>
                  <button
                    onClick={() => copyToClipboard((paymentIntent.amount / 100_000_000).toFixed(8))}
                    className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-r-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  Memo (Required)
                </label>
                <div className="flex items-center bg-white border border-gray-200 rounded-lg">
                  <code className="flex-1 px-3 py-3 text-sm font-mono text-gray-900">
                    {paymentIntent.id}
                  </code>
                  <button
                    onClick={() => copyToClipboard(paymentIntent.id)}
                    className="px-3 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-r-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Include this memo to ensure automatic payment verification
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <svg className="w-5 h-5 text-amber-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm">
                  <div className="font-medium text-amber-900 mb-2">Payment Instructions</div>
                  <ol className="text-amber-800 space-y-1">
                    <li className="flex items-start">
                      <span className="font-medium mr-2">1.</span>
                      <span>Copy the recipient address and send the exact sBTC amount</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">2.</span>
                      <span>Include the memo in your transaction for automatic verification</span>
                    </li>
                    <li className="flex items-start">
                      <span className="font-medium mr-2">3.</span>
                      <span>Click "Confirm Payment Sent" after sending the transaction</span>
                    </li>
                  </ol>
                </div>
              </div>
            </div>

            <button
              onClick={handleManualPaymentConfirm}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-medium focus:ring-4 focus:ring-blue-200 focus:outline-none"
            >
              Confirm Payment Sent
            </button>
          </div>
        </div>
      )}

      {paymentMethod === 'manual' && !paymentIntent.recipient_address && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-red-800">
              <strong>Configuration Error:</strong> Merchant payment address not configured. Please contact support.
            </div>
          </div>
        </div>
      )}

      {/* Trust Indicators */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center text-xs text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secured by blockchain technology • Payment ID: {paymentIntent.id.slice(0, 8)}...
        </div>
      </div>
    </div>
  );
}