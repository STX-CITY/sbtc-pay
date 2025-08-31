'use client';

import { useEffect } from 'react';

export default function NewProductError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error details
    console.error('New Product Page Error:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      timestamp: new Date().toISOString()
    });

    // Try to decode React minified error
    if (error.message.includes('Minified React error')) {
      const errorMatch = error.message.match(/#(\d+)/);
      if (errorMatch) {
        const errorCode = errorMatch[1];
        console.error(`React Error Code: ${errorCode}`);
        console.error(`Check: https://react.dev/errors/${errorCode}`);
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Creating Product
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message.includes('Minified React error') 
            ? 'A client-side error occurred. Please check the browser console for details.'
            : error.message || 'Something went wrong while loading the product form.'}
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/products'}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
          >
            Back to Products
          </button>
        </div>
        {error.message.includes('Minified React error') && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
            <p className="font-semibold text-yellow-800">Debug Info:</p>
            <p className="text-yellow-700 mt-1">
              Open browser console (F12) to see detailed error information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}