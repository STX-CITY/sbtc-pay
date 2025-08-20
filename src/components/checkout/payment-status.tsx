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
          icon: '✅',
          title: 'Payment Successful',
          message: 'Your sBTC payment has been processed successfully.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'failed':
        return {
          icon: '❌',
          title: 'Payment Failed',
          message: 'Your payment could not be processed. Please try again.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: '⏳',
          title: 'Payment Pending',
          message: 'Your payment is being processed. This may take a few minutes.',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: '❓',
          title: 'Unknown Status',
          message: 'Payment status unknown.',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="max-w-md mx-auto">
      <div className={`bg-white rounded-lg shadow-lg p-8 border ${config.borderColor}`}>
        <div className="text-center">
          <div className="text-4xl mb-4">{config.icon}</div>
          <h1 className={`text-2xl font-bold mb-2 ${config.color}`}>
            {config.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {config.message}
          </p>

          <div className={`rounded-lg p-4 mb-6 ${config.bgColor}`}>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment ID:</span>
                <span className="font-mono text-xs">{paymentIntentId}</span>
              </div>
              {txId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-mono text-xs">{txId}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {status === 'success' && (
            <div className="space-y-3">
              <button 
                onClick={() => window.print()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Print Receipt
              </button>
              {txId && (
                <a
                  href={`https://explorer.stacks.co/txid/${txId}?chain=testnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded hover:bg-gray-200 text-center"
                >
                  View on Stacks Explorer
                </a>
              )}
            </div>
          )}

          {status === 'failed' && (
            <button 
              onClick={() => window.location.href = `/checkout/${paymentIntentId}`}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          )}

          {status === 'pending' && (
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Refresh Status
              </button>
              <p className="text-xs text-gray-500">
                This page will automatically update when the payment is confirmed
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Powered by sBTC Payment Gateway</p>
      </div>
    </div>
  );
}