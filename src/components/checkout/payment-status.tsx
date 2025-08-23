'use client';

import { useState } from 'react';

interface PaymentStatusProps {
  status: 'success' | 'failed' | 'pending';
  paymentIntentId: string;
  txId?: string;
  merchantRedirectUrl?: string;
  merchantName?: string;
}

export function PaymentStatus({ status, paymentIntentId, txId, merchantRedirectUrl, merchantName }: PaymentStatusProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: (
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          ),
          title: 'Payment successful',
          subtitle: 'Transaction confirmed',
          message: 'Your sBTC payment has been confirmed on the blockchain.',
          color: 'text-gray-900',
          accentColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100'
        };
      case 'failed':
        return {
          icon: (
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          ),
          title: 'Payment failed',
          subtitle: 'Transaction unsuccessful',
          message: 'The transaction could not be completed. Please try again.',
          color: 'text-gray-900',
          accentColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-100'
        };
      case 'pending':
        return {
          icon: (
            <div className="relative">
              <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              </div>
            </div>
          ),
          title: 'Processing payment',
          subtitle: 'Transaction pending',
          message: 'Your transaction is being confirmed on the blockchain.',
          color: 'text-gray-900',
          accentColor: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-100'
        };
      default:
        return {
          icon: null,
          title: 'Unknown Status',
          subtitle: '',
          message: 'Payment status unknown.',
          color: 'text-gray-900',
          accentColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-100'
        };
    }
  };

  const config = getStatusConfig();
  
  const truncateId = (id: string, isMobile: boolean = false) => {
    if (!id) return '';
    if (isMobile) {
      return id.length > 20 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id;
    }
    return id;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className="px-8 pt-10 pb-8 sm:px-12 sm:pt-12 text-center bg-gradient-to-b from-white to-gray-50/50">
            {config.icon}
            
            <h1 className={`mt-6 text-2xl sm:text-3xl font-bold ${config.color}`}>
              {config.title}
            </h1>
            
            {config.subtitle && (
              <p className={`mt-1 text-sm font-medium ${config.accentColor}`}>
                {config.subtitle}
              </p>
            )}
            
            <p className="mt-3 text-base text-gray-600 max-w-md mx-auto">
              {config.message}
            </p>
          </div>

          {/* Details Section */}
          <div className="px-8 py-6 sm:px-12 space-y-4 bg-gray-50/30">
            {/* Payment ID */}
            <div className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-gray-200 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Payment ID
                  </label>
                  <div className="font-mono text-sm sm:text-base text-gray-900 break-all">
                    <span className="sm:hidden">{truncateId(paymentIntentId, true)}</span>
                    <span className="hidden sm:inline">{paymentIntentId}</span>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(paymentIntentId, 'payment')}
                  className="flex-shrink-0 p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  title="Copy Payment ID"
                >
                  {copiedField === 'payment' ? (
                    <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Transaction ID */}
            {txId && (
              <div className="group bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 hover:border-gray-200 transition-all duration-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Transaction ID
                    </label>
                    <div className="font-mono text-sm sm:text-base text-gray-900 break-all">
                      <span className="sm:hidden">{truncateId(txId, true)}</span>
                      <span className="hidden sm:inline">{txId}</span>
                    </div>
                    <a 
                      href={`https://explorer.stacks.co/txid/${txId}?chain=testnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <span>View on Explorer</span>
                      <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(txId, 'transaction')}
                    className="flex-shrink-0 p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    title="Copy Transaction ID"
                  >
                    {copiedField === 'transaction' ? (
                      <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Timestamp */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Timestamp
              </label>
              <div className="text-sm sm:text-base text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })} at {new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
            </div>
          </div>

          {/* Actions Section */}
          <div className="px-8 py-6 sm:px-12 bg-white border-t border-gray-100">
            {status === 'success' && (
              <div className="space-y-3">
                {merchantRedirectUrl ? (
                  <>
                    <button 
                      onClick={() => window.location.href = merchantRedirectUrl}
                      className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                    >
                      {merchantName ? `Return to ${merchantName}` : 'Return to Merchant'}
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200"
                    >
                      Download Receipt
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800">Payment Complete!</h3>
                          <p className="mt-1 text-sm text-blue-700">
                            Your payment has been successfully processed. You can safely close this window.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200"
                    >
                      Download Receipt
                    </button>
                  </>
                )}
              </div>
            )}

            {status === 'failed' && (
              <button 
                onClick={() => window.history.back()}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
              >
                Try Again
              </button>
            )}

            {status === 'pending' && (
              <div className="text-center">
                <div className="inline-flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                  <span>Waiting for blockchain confirmation...</span>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 py-3.5 px-6 rounded-2xl font-semibold transition-all duration-200"
                >
                  Refresh Status
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Powered by sBTC Payment Gateway
          </p>
        </div>
      </div>

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}