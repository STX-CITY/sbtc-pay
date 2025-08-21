'use client';

import { useState, useEffect, useRef } from 'react';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { PaymentStatus } from '@/components/checkout/payment-status';

interface CheckoutPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; tx?: string }>;
}

interface PaymentIntent {
  id: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'canceled';
  tx_id?: string;
}

export default function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const [paymentIntentId, setPaymentIntentId] = useState<string>('');
  const [urlStatus, setUrlStatus] = useState<string | undefined>();
  const [txId, setTxId] = useState<string | undefined>();
  
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Function to check transaction status from Hiro API
  const checkTransactionStatus = async (txId: string) => {
    try {
      // Determine network based on environment
      const isMainnet = process.env.NODE_ENV === 'production';
      const apiUrl = isMainnet 
        ? `https://api.mainnet.hiro.so/extended/v1/tx/${txId}`
        : `https://api.testnet.hiro.so/extended/v1/tx/${txId}`;

      const response = await fetch(apiUrl);
      if (!response.ok) {
        console.error('Failed to fetch transaction status from Hiro');
        return null;
      }

      const txData = await response.json();
      
      // Check if transaction status has changed
      if (txData.tx_status === 'success') {
        // Transaction confirmed - redirect to success
        window.location.href = `/checkout/${paymentIntentId}?status=succeeded&tx=${txId}`;
        return 'success';
      } else if (txData.tx_status === 'abort_by_response' || txData.tx_status === 'abort_by_post_condition') {
        // Transaction failed - redirect to failed
        window.location.href = `/checkout/${paymentIntentId}?status=failed&tx=${txId}`;
        return 'failed';
      }
      
      // Still pending
      return 'pending';
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return null;
    }
  };

  // Unwrap params and searchParams
  useEffect(() => {
    const unwrapParams = async () => {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      
      setPaymentIntentId(resolvedParams.id);
      setUrlStatus(resolvedSearchParams.status);
      setTxId(resolvedSearchParams.tx);
    };
    
    unwrapParams();
  }, [params, searchParams]);

  useEffect(() => {
    if (!paymentIntentId) return;
    
    fetchPaymentIntent();
    
    // Start polling if status is tx_broadcast
    if (urlStatus === 'tx_broadcast') {
      startPolling();
      
      // If we have tx_id from URL, immediately check Hiro API
      if (txId) {
        checkTransactionStatus(txId);
      }
    }
    
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [paymentIntentId, urlStatus, txId]);

  const fetchPaymentIntent = async () => {
    try {
      const response = await fetch(`/api/v1/public/payment_intents/${paymentIntentId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Payment intent not found');
      }

      const data = await response.json();
      setPaymentIntent(data);
      setLoading(false);
      
      // Check if payment is completed and stop polling
      if (data.status === 'succeeded' || data.status === 'failed') {
        stopPolling();
        
        // If we were polling and payment is now succeeded, redirect to success
        if (isPolling && data.status === 'succeeded') {
          window.location.href = `/checkout/${paymentIntentId}?status=succeeded&tx=${data.tx_id || txId}`;
        } else if (isPolling && data.status === 'failed') {
          window.location.href = `/checkout/${paymentIntentId}?status=failed&tx=${data.tx_id || txId}`;
        }
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
      setLoading(false);
      stopPolling();
    }
  };
  
  const startPolling = () => {
    setIsPolling(true);
    
    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(async () => {
      const latestPaymentIntent = await fetchPaymentIntent();
      
      // If we have a tx_id, also check Hiro API for faster updates
      if (latestPaymentIntent?.tx_id) {
        await checkTransactionStatus(latestPaymentIntent.tx_id);
      }
    }, 3000);
  };
  
  const stopPolling = () => {
    setIsPolling(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Loading state (also wait for params to be resolved)
  if (loading || !paymentIntentId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paymentIntent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Payment not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // URL status takes precedence over database status
  const effectiveStatus = urlStatus || paymentIntent.status;
  const effectiveTxId = txId || paymentIntent.tx_id;
  
  // Show loading state for tx_broadcast status
  if (effectiveStatus === 'tx_broadcast') {
    // If no tx_id in database yet, show waiting for transaction state
    if (!paymentIntent.tx_id) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
              <div className="text-center">
                <div className="mb-6">
                  <div className="animate-pulse">
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                      <span className="text-blue-600 text-2xl font-bold">₿</span>
                    </div>
                  </div>
                </div>
                <h1 className="text-2xl font-bold mb-3 text-gray-900">
                  Waiting for Transaction
                </h1>
                <p className="text-gray-600 mb-6">
                  Waiting for transaction to be registered...
                  <br />
                  <span className="text-sm">Please do not close this window.</span>
                </p>
                
                <div className="text-sm text-gray-500">
                  <p>⏱️ Checking for transaction ID...</p>
                  <p className="mt-2">Polling every 3 seconds</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Transaction ID exists, show processing state
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center">
              <div className="mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
              </div>
              <h1 className="text-2xl font-bold mb-3 text-gray-900">
                Processing Transaction
              </h1>
              <p className="text-gray-600 mb-6">
                Your transaction has been broadcast to the network.
                <br />
                Please wait while we confirm your payment...
              </p>
              
              {effectiveTxId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Transaction ID:</p>
                  <p className="font-mono text-xs text-gray-500 break-all">
                    {effectiveTxId}
                  </p>
                </div>
              )}
              
              <div className="text-sm text-gray-500">
                <p>⏱️ This usually takes 1-2 minutes</p>
                <p className="mt-2">Checking status every 3 seconds...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show status page for completed/failed states
  if (effectiveStatus === 'succeeded' || effectiveStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PaymentStatus 
          status="success" 
          paymentIntentId={paymentIntentId}
          txId={effectiveTxId}
        />
      </div>
    );
  }

  if (effectiveStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PaymentStatus 
          status="failed" 
          paymentIntentId={paymentIntentId}
          txId={effectiveTxId}
        />
      </div>
    );
  }

  if (effectiveStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PaymentStatus 
          status="pending" 
          paymentIntentId={paymentIntentId}
          txId={effectiveTxId}
        />
      </div>
    );
  }

  if (effectiveStatus === 'canceled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="text-center">
              <div className="text-4xl mb-4">🚫</div>
              <h1 className="text-2xl font-bold mb-2 text-gray-600">
                Payment Canceled
              </h1>
              <p className="text-gray-600 mb-6">
                This payment has been canceled and is no longer available.
              </p>
              <button 
                onClick={() => window.history.back()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show checkout form for 'created' status or unknown status
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">sBTC Payment</h1>
            <p className="text-gray-600">Secure Bitcoin payment via Stacks</p>
          </div>

          <CheckoutForm paymentIntentId={paymentIntentId} />
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by sBTC Payment Gateway</p>
        </div>
      </div>
    </div>
  );
}