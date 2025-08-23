'use client';

import { useState, useEffect } from 'react';

interface PaymentStatusProps {
  status: 'success' | 'failed' | 'pending';
  paymentIntentId: string;
  txId?: string;
  merchantRedirectUrl?: string;
  merchantName?: string;
}

export function PaymentStatus({ status, paymentIntentId, txId, merchantRedirectUrl, merchantName }: PaymentStatusProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(10);
  
  // Auto-redirect countdown for successful payments with redirect URL
  useEffect(() => {
    if (status === 'success' && merchantRedirectUrl) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = merchantRedirectUrl;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, merchantRedirectUrl]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">₿</span>
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">sBTC Pay</h1>
          </div>
          <p className="text-gray-600">Secure blockchain payment processing</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Status Header */}
          <div className="px-8 pt-12 pb-8 sm:px-12 sm:pt-16 text-center bg-gradient-to-b from-white to-slate-50/50">
            {config.icon}
            
            <h1 className={`mt-8 text-3xl sm:text-4xl font-bold ${config.color}`}>
              {config.title}
            </h1>
            
            {config.subtitle && (
              <p className={`mt-2 text-lg font-medium ${config.accentColor}`}>
                {config.subtitle}
              </p>
            )}
            
            <p className="mt-4 text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
              {config.message}
            </p>

            {/* Status-specific content */}
            {status === 'success' && merchantName && (
              <div className="mt-6 inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 011.732-1.732L9.464 6.5a2 2 0 112.072 0l1.732 1.732A2 2 0 0114 10v4H6v-4z" clipRule="evenodd" />
                </svg>
                Payment processed by {merchantName}
              </div>
            )}
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
                      href={`https://explorer.stacks.co/txid/0x${txId}?chain=testnet`}
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
          <div className="px-8 py-8 sm:px-12 bg-white border-t border-gray-100">
            {status === 'success' && (
              <div className="space-y-4">
                {merchantRedirectUrl ? (
                  <>
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-3">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        Auto-redirect in {countdown} seconds
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-1000 ease-out rounded-full"
                          style={{ width: `${((10 - countdown) / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.href = merchantRedirectUrl}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-blue-200 focus:outline-none"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {merchantName ? `Return to ${merchantName}` : 'Return to Merchant'}
                      </div>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="w-full bg-white hover:bg-gray-50 text-gray-900 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Receipt
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-6 w-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-green-900 mb-1">Payment Completed!</h3>
                          <p className="text-green-800">
                            Your sBTC payment has been successfully processed and confirmed on the blockchain. You can safely close this window or download your receipt.
                          </p>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.print()}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-green-200 focus:outline-none"
                    >
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Receipt
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}

            {status === 'failed' && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-red-900 mb-1">Payment Failed</h3>
                      <p className="text-red-800">
                        The transaction could not be completed. This may be due to insufficient funds, network issues, or transaction rejection.
                      </p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.history.back()}
                  className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-red-200 focus:outline-none"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                  </div>
                </button>
              </div>
            )}

            {status === 'pending' && (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse mr-2"></div>
                    <div className="w-2 h-2 bg-amber-300 rounded-full animate-pulse animation-delay-200 mr-2"></div>
                    <div className="w-2 h-2 bg-amber-200 rounded-full animate-pulse animation-delay-400"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-amber-900 mb-2">Processing Payment</h3>
                  <p className="text-amber-800">
                    Your transaction is being confirmed on the blockchain. This usually takes 1-2 minutes.
                  </p>
                </div>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 text-white py-4 px-6 rounded-2xl font-semibold transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl focus:ring-4 focus:ring-amber-200 focus:outline-none"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Status
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center text-sm text-gray-500 space-x-4">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Verified
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <span>Powered by sBTC</span>
          </div>
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