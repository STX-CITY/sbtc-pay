import { Suspense } from 'react';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { PaymentStatus } from '@/components/checkout/payment-status';

interface CheckoutPageProps {
  params: { id: string };
  searchParams: { status?: string };
}

export default function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const paymentIntentId = params.id;
  const status = searchParams.status;

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PaymentStatus 
          status="success" 
          paymentIntentId={paymentIntentId}
        />
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PaymentStatus 
          status="failed" 
          paymentIntentId={paymentIntentId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">sBTC Payment</h1>
            <p className="text-gray-600">Secure Bitcoin payment via Stacks</p>
          </div>

          <Suspense fallback={<div className="text-center">Loading payment details...</div>}>
            <CheckoutForm paymentIntentId={paymentIntentId} />
          </Suspense>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by sBTC Payment Gateway</p>
        </div>
      </div>
    </div>
  );
}