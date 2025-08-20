'use client';

import { useState } from 'react';

export function ApiKeysSection() {
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);

  // Mock API keys - in real app these would come from API
  const liveKey = 'sk_live_Abjr8aKsdjfa8sdKNsdf78sadfjkasd';
  const testKey = 'sk_test_1234567890abcdefghijklmnopqrstuv';

  const maskKey = (key: string) => {
    return key.substring(0, 12) + '••••••••••••••••••••••••';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Keys</h2>
        <p className="text-sm text-gray-600 mb-6">
          Use these keys to authenticate your API requests. Keep them secure and never share them publicly.
        </p>

        <div className="space-y-6">
          {/* Live API Key */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Live API Key</h3>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Production
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Use this key for production transactions
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 p-2 rounded text-sm font-mono">
                {showLiveKey ? liveKey : maskKey(liveKey)}
              </code>
              <button
                onClick={() => setShowLiveKey(!showLiveKey)}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                {showLiveKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => copyToClipboard(liveKey)}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Test API Key */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Test API Key</h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Test
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Use this key for testing and development
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 p-2 rounded text-sm font-mono">
                {showTestKey ? testKey : maskKey(testKey)}
              </code>
              <button
                onClick={() => setShowTestKey(!showTestKey)}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                {showTestKey ? 'Hide' : 'Show'}
              </button>
              <button
                onClick={() => copyToClipboard(testKey)}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Regenerate Keys
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Regenerating keys will invalidate the current keys immediately. Update your applications before regenerating.
          </p>
        </div>
      </div>
    </div>
  );
}