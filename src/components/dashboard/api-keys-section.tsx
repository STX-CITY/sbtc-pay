'use client';

import { useState, useEffect } from 'react';

interface MerchantProfile {
  id: string;
  name: string;
  email: string;
  stacksAddress: string;
  webhookUrl?: string;
  apiKeyTest: string;
  created: number;
}

export function ApiKeysSection() {
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Live key is not exposed for security - would need separate admin endpoint
  const liveKey = 'sk_live_••••••••••••••••••••••••••••••••••••••••••••';
  const testKey = merchantData?.apiKeyTest || '';

  useEffect(() => {
    fetchMerchantProfile();
  }, []);

  const fetchMerchantProfile = async () => {
    try {
      const apiKey = localStorage.getItem('api_key');
      if (!apiKey) {
        throw new Error('No API key found');
      }

      const response = await fetch('/api/v1/merchants/profile', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch profile');
      }

      setMerchantData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load merchant data');
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKeys = async () => {
    setRegenerating(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const apiKey = localStorage.getItem('api_key');
      if (!apiKey) {
        throw new Error('No API key found');
      }

      const response = await fetch('/api/v1/merchants/regenerate-keys', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to regenerate keys');
      }

      // Update the stored API key with the new test key
      localStorage.setItem('api_key', data.apiKeyTest);
      
      // Refresh merchant data to show new keys
      await fetchMerchantProfile();
      
      setSuccessMessage(data.message || 'API keys regenerated successfully');
      
      // Hide keys for security
      setShowLiveKey(false);
      setShowTestKey(false);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to regenerate keys');
    } finally {
      setRegenerating(false);
    }
  };

  const maskKey = (key: string) => {
    if (!key) return '••••••••••••••••••••••••';
    return key.substring(0, 12) + '••••••••••••••••••••••••';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccessMessage('API key copied to clipboard');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError('Failed to copy to clipboard');
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="space-y-6">
            <div className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !merchantData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">API Keys</h2>
        <p className="text-sm text-gray-600 mb-6">
          Use these keys to authenticate your API requests. Keep them secure and never share them publicly.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

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
              Use this key for production transactions (contact support to access)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-50 p-2 rounded text-sm font-mono">
                {showLiveKey ? liveKey : maskKey(liveKey)}
              </code>
              <button
                onClick={() => setShowLiveKey(!showLiveKey)}
                disabled={true}
                className="px-3 py-2 text-sm border rounded bg-gray-100 text-gray-400 cursor-not-allowed"
              >
                Contact Support
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
                disabled={!testKey}
                className="px-3 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <button 
            onClick={regenerateApiKeys}
            disabled={regenerating}
            className={`px-4 py-2 rounded font-medium ${
              regenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-red-500 hover:bg-red-600'
            } text-white`}
          >
            {regenerating ? 'Regenerating...' : 'Regenerate Keys'}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Regenerating keys will invalidate the current keys immediately. Update your applications before regenerating.
          </p>
        </div>
      </div>
    </div>
  );
}