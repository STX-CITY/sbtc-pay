'use client';

import { useState } from 'react';

export default function TestWebhookPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);

  const clearLogs = () => {
    setLogs([]);
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/test_webhook`;
    navigator.clipboard.writeText(url);
    alert('Webhook URL copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Webhook Testing Dashboard
          </h1>
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Test Webhook URL
            </h2>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-2 bg-gray-100 border rounded-lg text-sm font-mono">
                {typeof window !== 'undefined' && `${window.location.origin}/api/test_webhook`}
              </code>
              <button
                onClick={copyWebhookUrl}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copy URL
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Use this URL as a webhook endpoint in your merchant dashboard to test webhook deliveries.
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              How to Test
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Copy the webhook URL above</li>
              <li>Go to your merchant dashboard → Developers → Webhooks</li>
              <li>Add a new webhook endpoint with the copied URL</li>
              <li>Select the events you want to test</li>
              <li>Use the "Test" button or trigger real events</li>
              <li>Check the logs below to see the webhook data</li>
            </ol>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Testing Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check browser console for real-time webhook logs</li>
              <li>• Test different event types (payment_intent.*, product.*, etc.)</li>
              <li>• Verify webhook signatures are working correctly</li>
              <li>• Use network tab to inspect request/response details</li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">
                Webhook Logs
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={clearLogs}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Clear Logs
                </button>
              </div>
            </div>
            
            <div className="bg-black rounded border h-96 overflow-y-auto p-3 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-400">
                  Waiting for webhook events...<br />
                  Send a test webhook to see logs here.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              This is a development tool for testing webhook integrations.
              Check your browser's developer console for detailed webhook information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}