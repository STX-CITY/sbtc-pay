import React, { useState, useEffect, useCallback } from 'react';
import { SBTCGateway, PaymentIntent, CreatePaymentIntentRequest } from '../../js-sdk/dist/index';

interface SBTCProviderProps {
  apiKey: string;
  apiBase?: string;
  children: React.ReactNode;
}

interface SBTCContextValue {
  gateway: SBTCGateway;
  createPaymentIntent: (params: CreatePaymentIntentRequest) => Promise<PaymentIntent>;
  retrievePaymentIntent: (id: string) => Promise<PaymentIntent>;
}

const SBTCContext = React.createContext<SBTCContextValue | null>(null);

export function SBTCProvider({ apiKey, apiBase, children }: SBTCProviderProps) {
  const gateway = new SBTCGateway({ apiKey, apiBase });

  const createPaymentIntent = useCallback(
    (params: CreatePaymentIntentRequest) => gateway.paymentIntents.create(params),
    [gateway]
  );

  const retrievePaymentIntent = useCallback(
    (id: string) => gateway.paymentIntents.retrieve(id),
    [gateway]
  );

  const value: SBTCContextValue = {
    gateway,
    createPaymentIntent,
    retrievePaymentIntent
  };

  return (
    <SBTCContext.Provider value={value}>
      {children}
    </SBTCContext.Provider>
  );
}

export function useSBTC() {
  const context = React.useContext(SBTCContext);
  if (!context) {
    throw new Error('useSBTC must be used within an SBTCProvider');
  }
  return context;
}

interface PaymentButtonProps {
  amount: number;
  amount_usd?: number;
  description?: string;
  metadata?: Record<string, string>;
  onSuccess?: (paymentIntent: PaymentIntent) => void;
  onError?: (error: Error) => void;
  className?: string;
  children?: React.ReactNode;
}

export function PaymentButton({
  amount,
  amount_usd,
  description,
  metadata,
  onSuccess,
  onError,
  className = '',
  children
}: PaymentButtonProps) {
  const { createPaymentIntent } = useSBTC();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const paymentIntent = await createPaymentIntent({
        amount,
        amount_usd,
        currency: 'sbtc',
        description,
        metadata
      });

      // Redirect to checkout page
      window.location.href = `/checkout/${paymentIntent.id}`;
      
      onSuccess?.(paymentIntent);
    } catch (error) {
      onError?.(error as Error);
    } finally {
      setLoading(false);
    }
  };

  const defaultClassName = `
    bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 
    text-white font-semibold py-2 px-4 rounded
    transition-colors duration-200
    ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
  `.trim();

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className || defaultClassName}
    >
      {loading ? 'Processing...' : (children || 'Pay with sBTC')}
    </button>
  );
}

interface PaymentStatusProps {
  paymentIntentId: string;
  onStatusChange?: (status: string) => void;
  pollInterval?: number;
}

export function PaymentStatus({ 
  paymentIntentId, 
  onStatusChange, 
  pollInterval = 5000 
}: PaymentStatusProps) {
  const { retrievePaymentIntent } = useSBTC();
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const pi = await retrievePaymentIntent(paymentIntentId);
      setPaymentIntent(pi);
      onStatusChange?.(pi.status);
      
      // Stop polling if payment is final
      if (['succeeded', 'failed', 'canceled'].includes(pi.status)) {
        return false; // Stop polling
      }
      return true; // Continue polling
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch payment status');
      return false;
    } finally {
      setLoading(false);
    }
  }, [paymentIntentId, retrievePaymentIntent, onStatusChange]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const poll = async () => {
      const shouldContinue = await fetchStatus();
      if (shouldContinue) {
        intervalId = setTimeout(poll, pollInterval);
      }
    };

    poll();

    return () => {
      if (intervalId) clearTimeout(intervalId);
    };
  }, [fetchStatus, pollInterval]);

  if (loading && !paymentIntent) {
    return <div>Loading payment status...</div>;
  }

  if (error) {
    return <div className="text-red-600">Error: {error}</div>;
  }

  if (!paymentIntent) {
    return <div>Payment not found</div>;
  }

  const statusColors = {
    created: 'text-gray-600',
    pending: 'text-yellow-600',
    succeeded: 'text-green-600',
    failed: 'text-red-600',
    canceled: 'text-gray-600'
  };

  return (
    <div className="p-4 border rounded">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-medium">Payment Status:</span>
        <span className={`font-semibold ${statusColors[paymentIntent.status]}`}>
          {paymentIntent.status.toUpperCase()}
        </span>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <div>Amount: {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC</div>
        {paymentIntent.amount_usd && (
          <div>USD: ${paymentIntent.amount_usd.toFixed(2)}</div>
        )}
        {paymentIntent.tx_id && (
          <div>Transaction: {paymentIntent.tx_id.slice(0, 16)}...</div>
        )}
      </div>
    </div>
  );
}

export * from '../../js-sdk/dist/index';