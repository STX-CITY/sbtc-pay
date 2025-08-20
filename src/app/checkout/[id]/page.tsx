'use client';

import { useState, useEffect } from 'react';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { PaymentStatus } from '@/components/checkout/payment-status';

interface CheckoutPageProps {
  params: { id: string };
  searchParams: { status?: string; tx?: string };
}

interface PaymentIntent {
  id: string;
  status: 'created' | 'pending' | 'succeeded' | 'failed' | 'canceled';
  tx_id?: string;
}

export default function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const paymentIntentId = params.id;
  const urlStatus = searchParams.status;
  const txId = searchParams.tx;
  
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentIntent();
  }, [paymentIntentId]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment');
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
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

  // Show status page for completed/failed states
  debugger;
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