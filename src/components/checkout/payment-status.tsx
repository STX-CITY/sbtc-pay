'use client';

interface PaymentStatusProps {
  status: 'success' | 'failed' | 'pending';
  paymentIntentId: string;
  txId?: string;
}

export function PaymentStatus({ status, paymentIntentId, txId }: PaymentStatusProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          icon: (
            <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          title: 'Payment Successful',
          message: 'Your sBTC payment has been processed successfully.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: (
            <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: (
            <div className="w-20 h-20 mx-auto mb-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ),
          title: 'Payment Pending',
          message: 'Your payment is being processed. This may take a few minutes.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: (
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
          ),
          title: 'Unknown Status',
          message: 'Payment status unknown.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  
  const truncateId = (id: string, length: number = 12) => {
    if (id.length <= length) return id;
    return `${id.slice(0, length)}...${id.slice(-4)}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="text-center">
            {config.icon}
            
            <h1 className={`text-2xl sm:text-3xl font-bold mb-4 ${config.color}`}>
              {config.title}
            </h1>
            
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8">
              {config.message}
            </p>

            <div className={`rounded-xl p-4 sm:p-6 mb-8 ${config.bgColor} border ${config.borderColor}`}>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">Payment ID:</span>
                  <span className="font-mono text-xs sm:text-sm text-gray-800 break-all sm:break-normal">
                    <span className="sm:hidden">{truncateId(paymentIntentId)}</span>
                    <span className="hidden sm:inline">{paymentIntentId}</span>
                  </span>
                </div>
                
                {txId && (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-gray-700 font-medium text-sm sm:text-base">Transaction ID:</span>
                    <span className="font-mono text-xs sm:text-sm text-gray-800 break-all sm:break-normal">
                      <span className="sm:hidden">{truncateId(txId, 16)}</span>
                      <span className="hidden sm:inline">{txId}</span>
                    </span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-gray-700 font-medium text-sm sm:text-base">Date:</span>
                  <span className="text-gray-800 text-sm sm:text-base">
                    {new Date().toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {status === 'success' && (
              <div className="space-y-3">
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Print Receipt
                </button>
                {txId && (
                  <a
                    href={`https://explorer.stacks.co/txid/${txId}?chain=testnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold text-center transition-colors duration-200"
                  >
                    View on Stacks Explorer
                  </a>
                )}
              </div>
            )}

            {status === 'failed' && (
              <button 
                onClick={() => window.location.href = `/checkout/${paymentIntentId}`}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Try Again
              </button>
            )}

            {status === 'pending' && (
              <div className="space-y-4">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Refresh Status
                </button>
                <p className="text-sm text-gray-500 leading-relaxed">
                  This page will automatically update when the payment is confirmed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400 font-medium">
          Powered by sBTC Payment Gateway
        </p>
      </div>
    </div>
  );
}