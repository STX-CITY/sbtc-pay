'use client';

import { Product } from '@/types/products';
import { formatSBTCAmount } from '@/lib/stacks/sbtc';

interface CheckoutPreviewProps {
  product: Product | null;
  className?: string;
  customerEmail?: string;
}

export function CheckoutPreview({ 
  product, 
  className = "", 
  customerEmail = ""
}: CheckoutPreviewProps) {
  if (!product) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-500 mb-2">Checkout Preview</h3>
        <p className="text-gray-400">Select a product to see checkout preview</p>
      </div>
    );
  }

  return (
    <div className={`bg-white border rounded-lg shadow-sm ${className}`}>
      {/* Header - Modern browser-style */}
      <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500">sbtcpay.org</span>
          </div>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* sBTC Pay Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">sBTC Pay</h1>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Secure payment
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-6 py-6">
        {/* Product Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {product.price_usd 
              ? `$${product.price_usd.toFixed(2)}`
              : `${formatSBTCAmount(product.price)} sBTC`
            }
          </div>
          {product.price_usd && (
            <div className="text-sm text-gray-500">
              ≈ {formatSBTCAmount(product.price)} sBTC
            </div>
          )}
        </div>

        {/* Product Image */}
        {product.images?.[0] && (
          <div className="mb-6">
            <div className="relative rounded-xl overflow-hidden bg-gray-50 h-32">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Product Description */}
        {product.description && (
          <div className="mb-6">
            <p className="text-gray-600 text-sm">{product.description}</p>
          </div>
        )}

        {/* Form Section */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                {customerEmail || "customer@example.com"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment method</label>
              <div className="space-y-3">
                <div className="p-4 border border-gray-300 rounded-lg">
                  <div className="flex items-center">
                    <input type="radio" className="mr-3" name="payment-method" />
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4-8-4m16 0v10l-8 4-8-4V7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Wallet Payment</div>
                        <div className="text-sm text-gray-500">Connect your wallet and pay automatically</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-2 border-blue-500 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <input type="radio" className="mr-3" name="payment-method" defaultChecked />
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Manual Payment</div>
                        <div className="text-sm text-gray-500">Copy address and send payment manually</div>
                      </div>
                      <div className="text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect Wallet Button */}
            <button 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm"
              disabled
            >
              Connect Wallet & Pay
            </button>
          </div>
        </div>


        {/* Security Footer */}
        <div className="text-center pt-4 border-t border-gray-100 mt-6">
          <div className="flex items-center justify-center text-xs text-gray-500 mb-2">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Your payment information is encrypted and secure
          </div>
          <p className="text-xs text-gray-400">
            Powered by sBTC Payment Gateway
          </p>
        </div>
      </div>
    </div>
  );
}