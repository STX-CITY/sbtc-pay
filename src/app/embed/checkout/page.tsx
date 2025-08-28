'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Product } from '@/types/products';
import { formatSBTCAmount, transferSBTC } from '@/lib/stacks/sbtc';
import { getCurrentNetwork } from '@/lib/stacks/config';
import useWalletStore from '@/stores/WalletStore';
import { WalletConnect } from '@/components/sbtc/wallet-connect';

interface PaymentIntent {
  id: string;
  amount: number;
  recipient_address: string;
  status: string;
  description?: string;
}

function EmbedCheckoutContent() {
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'manual'>('wallet');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  const productId = searchParams.get('product_id');
  const apiKey = searchParams.get('api_key');
  const theme = searchParams.get('theme') || 'light';
  const primaryColor = searchParams.get('primary_color') || '#3B82F6';
  
  // Support both product_id and direct amount/description
  const directAmount = searchParams.get('amount');
  const directDescription = searchParams.get('description');

  const { currentAddress } = useWalletStore();

  useEffect(() => {
    if (apiKey) {
      if (productId) {
        fetchProductAndCreatePaymentIntent();
      } else if (directAmount) {
        createDirectPaymentIntent();
      } else {
        setError('Missing required parameters: need either product_id or amount');
        setLoading(false);
      }
    } else {
      setError('Missing required API key');
      setLoading(false);
    }
  }, [productId, apiKey, directAmount]);

  useEffect(() => {
    setWalletAddress(currentAddress);
  }, [currentAddress]);

  const createDirectPaymentIntent = async () => {
    try {
      // Create a virtual product from the direct parameters
      const virtualProduct: Product = {
        id: 'direct',
        name: directDescription || 'Payment',
        description: directDescription || '',
        price: parseInt(directAmount || '0'),
        price_usd: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setProduct(virtualProduct);

      // Create a payment intent with the direct amount
      const paymentIntentResponse = await fetch('/api/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          amount: parseInt(directAmount || '0'),
          description: directDescription || 'Widget Payment',
          customer_email: customerEmail,
          metadata: {
            _embedded_checkout: true,
            _widget_payment: true,
            _generated_at: new Date().toISOString()
          }
        })
      });

      if (!paymentIntentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntentData = await paymentIntentResponse.json();
      setPaymentIntent(paymentIntentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create payment');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductAndCreatePaymentIntent = async () => {
    try {
      // First fetch the product (public endpoint)
      const productResponse = await fetch(`/api/v1/products/${productId}`);
      
      if (!productResponse.ok) {
        throw new Error('Product not found');
      }

      const productData = await productResponse.json();
      setProduct(productData);

      // Create a payment intent for this product
      const paymentIntentResponse = await fetch('/api/v1/payment_intents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          product_id: productData.id,
          description: `Embedded Purchase: ${productData.name}`,
          customer_email: customerEmail,
          metadata: {
            product_id: productData.id,
            product_name: productData.name,
            _embedded_checkout: true,
            _generated_at: new Date().toISOString()
          }
        })
      });

      if (!paymentIntentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const paymentIntentData = await paymentIntentResponse.json();
      setPaymentIntent(paymentIntentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = (address: string) => {
    setWalletAddress(address);
  };

  const handleWalletDisconnect = () => {
    setWalletAddress(null);
  };

  const handleWalletPayment = async () => {
    if (!paymentIntent || !walletAddress || !product) return;

    setPaymentStatus('processing');

    try {
      const result = await transferSBTC({
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount,
        sender: walletAddress,
        recipient: paymentIntent.recipient_address,
        memo: `EC_${paymentIntent.id}`,
        network: getCurrentNetwork()
      });

      console.log('sBTC transfer completed:', result);
      setPaymentStatus('success');
      
      // Send success message to parent window
      window.parent.postMessage({
        type: 'sbtc_payment_success',
        paymentIntent: paymentIntent,
        txId: result.txId
      }, '*');
    } catch (err) {
      console.error('sBTC payment error:', err);
      setPaymentStatus('error');
      setError(err instanceof Error ? err.message : 'Payment failed');
      
      // Send error message to parent window
      window.parent.postMessage({
        type: 'sbtc_payment_error',
        error: err instanceof Error ? err.message : 'Payment failed'
      }, '*');
    }
  };

  const handleManualPayment = () => {
    // For manual payment, just show the instructions and let user confirm when sent
    setPaymentStatus('success');
    
    // Send success message to parent window (manual payments need external verification)
    window.parent.postMessage({
      type: 'sbtc_payment_success',
      paymentIntent: paymentIntent,
      manual: true
    }, '*');
  };

  const handleCancel = () => {
    // Send cancel message to parent window
    window.parent.postMessage({
      type: 'sbtc_payment_cancel'
    }, '*');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
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

  if (!product || !paymentIntent) {
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

        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6" style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-2xl font-bold" style={{ color: textColor }}>
                {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
              </div>
              {product.price_usd && (
                <div className="text-sm" style={{ color: secondaryTextColor }}>
                  ≈ ${product.price_usd.toFixed(2)} USD
                </div>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              paymentIntent.status === 'created' 
                ? 'bg-amber-100 text-amber-800' 
                : paymentIntent.status === 'succeeded'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {paymentIntent.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="space-y-4">
          {paymentStatus === 'idle' && (
            <>
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>Email</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-3 border rounded-lg"
                  style={{
                    backgroundColor: isDark ? '#4b5563' : '#ffffff',
                    borderColor: isDark ? '#6b7280' : '#d1d5db',
                    color: textColor
                  }}
                />
              </div>

              {/* Payment Method Selection */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textColor }}>Payment method</label>
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
                        <span className="font-medium" style={{ color: textColor }}>Wallet Payment</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Connect your wallet and pay automatically</p>
                    </div>
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
                        <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="font-medium" style={{ color: textColor }}>Manual Payment</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Copy address and send payment manually</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Wallet Payment Section */}
              {paymentMethod === 'wallet' && (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4" style={{
                    borderColor: isDark ? '#4b5563' : '#d1d5db'
                  }}>
                    <h4 className="font-medium mb-3" style={{ color: textColor }}>Connect Wallet</h4>
                    <WalletConnect 
                      onConnect={handleWalletConnect}
                      onDisconnect={handleWalletDisconnect}
                    />
                  </div>

                  {walletAddress && paymentIntent.recipient_address && (
                    <button
                      onClick={handleWalletPayment}
                      disabled={paymentStatus !== 'idle'}
                      className="w-full py-3 px-4 rounded-lg font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(paymentStatus as string) === 'processing' ? 'Processing Payment...' : 'Pay with sBTC'}
                    </button>
                  )}
                </div>
              )}

              {/* Manual Payment Section */}
              {paymentMethod === 'manual' && paymentIntent.recipient_address && (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4" style={{
                    backgroundColor: isDark ? '#4b5563' : '#f9fafb'
                  }}>
                    <h4 className="font-medium mb-3" style={{ color: textColor }}>Payment Instructions</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium uppercase mb-1" style={{ color: secondaryTextColor }}>
                          Recipient Address
                        </label>
                        <div className="flex items-center bg-white border rounded">
                          <code className="flex-1 px-3 py-2 text-sm font-mono break-all" style={{ color: textColor }}>
                            {paymentIntent.recipient_address}
                          </code>
                          <button
                            onClick={() => copyToClipboard(paymentIntent.recipient_address)}
                            className="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-r"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase mb-1" style={{ color: secondaryTextColor }}>
                          Amount
                        </label>
                        <div className="flex items-center bg-white border rounded">
                          <code className="flex-1 px-3 py-2 text-sm font-mono" style={{ color: textColor }}>
                            {(paymentIntent.amount / 100_000_000).toFixed(8)} sBTC
                          </code>
                          <button
                            onClick={() => copyToClipboard((paymentIntent.amount / 100_000_000).toFixed(8))}
                            className="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-r"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium uppercase mb-1" style={{ color: secondaryTextColor }}>
                          Memo (Required)
                        </label>
                        <div className="flex items-center bg-white border rounded">
                          <code className="flex-1 px-3 py-2 text-sm font-mono" style={{ color: textColor }}>
                            {paymentIntent.id}
                          </code>
                          <button
                            onClick={() => copyToClipboard(paymentIntent.id)}
                            className="px-2 py-2 text-blue-600 hover:bg-blue-50 rounded-r"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleManualPayment}
                      className="w-full mt-4 py-3 px-4 rounded-lg font-medium text-white hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
                    >
                      Confirm Payment Sent
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={handleCancel}
                className="w-full py-2 px-4 text-sm rounded-lg border hover:bg-gray-50 transition-colors"
                style={{
                  borderColor: isDark ? '#4b5563' : '#d1d5db',
                  color: secondaryTextColor
                }}
              >
                Cancel
              </button>
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