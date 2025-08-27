'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types/products';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';

function EmbedCheckoutContent() {
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  const productId = searchParams.get('product_id');
  const apiKey = searchParams.get('api_key');
  const theme = searchParams.get('theme') || 'light';
  const primaryColor = searchParams.get('primary_color') || '#3B82F6';

  useEffect(() => {
    if (productId && apiKey) {
      fetchProduct();
    } else {
      setError('Missing required parameters');
      setLoading(false);
    }
  }, [productId, apiKey]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/v1/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const productData = await response.json();
      setProduct(productData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!product) return;

    setPaymentStatus('processing');

    try {
      // Create payment intent
      const response = await fetch('/api/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product_id: product.id,
          customer_email: 'customer@example.com', // This would come from a form in a real implementation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntent = await response.json();
      
      // Simulate payment processing (in real implementation, this would integrate with wallet)
      setTimeout(() => {
        setPaymentStatus('success');
        
        // Send success message to parent window
        window.parent.postMessage({
          type: 'sbtc_payment_success',
          paymentIntent: paymentIntent
        }, '*');
      }, 2000);

    } catch (err) {
      setPaymentStatus('error');
      
      // Send error message to parent window
      window.parent.postMessage({
        type: 'sbtc_payment_error',
        error: err instanceof Error ? err.message : 'Payment failed'
      }, '*');
    }
  };

  const handleCancel = () => {
    // Send cancel message to parent window
    window.parent.postMessage({
      type: 'sbtc_payment_cancel'
    }, '*');
  };

  // Apply theme styles
  const isDark = theme === 'dark';
  const backgroundColor = isDark ? '#1f2937' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#1f2937';
  const secondaryTextColor = isDark ? '#d1d5db' : '#6b7280';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6" style={{ backgroundColor, color: textColor }}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2">Error Loading Checkout</h2>
          <p style={{ color: secondaryTextColor }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen p-6 flex flex-col" style={{ backgroundColor }}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
            <span className="text-white font-bold text-sm">₿</span>
          </div>
          <h1 className="text-lg font-semibold ml-2" style={{ color: textColor }}>sBTC Pay</h1>
        </div>
        <div className="flex items-center justify-center text-sm" style={{ color: secondaryTextColor }}>
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          Secure payment
        </div>
      </div>

      {/* Product Info */}
      <div className="flex-1 max-w-sm mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: textColor }}>{product.name}</h2>
          <div className="text-2xl font-bold mb-1" style={{ color: textColor }}>
            {product.price_usd 
              ? `$${product.price_usd.toFixed(2)}`
              : `${formatSBTCAmount(product.price)} sBTC`
            }
          </div>
          {product.price_usd && (
            <div className="text-sm" style={{ color: secondaryTextColor }}>
              ≈ {formatSBTCAmount(product.price)} sBTC
            </div>
          )}
        </div>

        {/* Product Image */}
        {product.images?.[0] && (
          <div className="mb-6">
            <div className="relative rounded-lg overflow-hidden bg-gray-100 h-32">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <p className="text-sm" style={{ color: secondaryTextColor }}>{product.description}</p>
          </div>
        )}

        {/* Payment Section */}
        <div className="space-y-4">
          {paymentStatus === 'idle' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>Email</label>
                <input
                  type="email"
                  placeholder="customer@example.com"
                  className="w-full p-3 border rounded-lg"
                  style={{
                    backgroundColor: isDark ? '#374151' : '#ffffff',
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: textColor
                  }}
                />
              </div>

              <div className="space-y-2">
                <button
                  onClick={handlePayment}
                  className="w-full py-3 px-4 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Pay Now
                </button>
                
                <button
                  onClick={handleCancel}
                  className="w-full py-2 px-4 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: isDark ? '#4b5563' : '#d1d5db',
                    color: secondaryTextColor,
                    backgroundColor: 'transparent'
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4" style={{ borderColor: primaryColor }}></div>
              <p style={{ color: textColor }}>Processing payment...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#10b981' }}>
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>Payment Successful!</h3>
              <p style={{ color: secondaryTextColor }}>Thank you for your purchase.</p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>Payment Failed</h3>
              <p className="mb-4" style={{ color: secondaryTextColor }}>Something went wrong. Please try again.</p>
              <button
                onClick={() => setPaymentStatus('idle')}
                className="px-4 py-2 rounded-lg text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-4 mt-6 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
        <p className="text-xs" style={{ color: secondaryTextColor }}>
          Powered by sBTC Payment Gateway
        </p>
      </div>
    </div>
  );
}

export default function EmbedCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <EmbedCheckoutContent />
    </Suspense>
  );
}