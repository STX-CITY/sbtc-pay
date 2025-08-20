'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useWalletStore from '@/stores/WalletStore';

interface RegistrationData {
  name: string;
  email: string;
  webhookUrl: string;
}

interface MerchantDetails {
  id: string;
  name: string;
  email: string;
  stacksAddress: string;
  apiKeyTest: string;
  message: string;
}

export function MerchantRegistration() {
  const router = useRouter();
  const { isConnected, currentAddress, connectWallet } = useWalletStore();
  
  const [step, setStep] = useState<'wallet' | 'details' | 'success'>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merchantDetails, setMerchantDetails] = useState<MerchantDetails | null>(null);
  
  const [formData, setFormData] = useState<RegistrationData>({
    name: '',
    email: '',
    webhookUrl: ''
  });

  // Step 1: Connect wallet
  const handleWalletConnect = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await connectWallet();
      setStep('details');
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Register merchant
  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAddress) {
      setError('Wallet not connected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/merchants/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          stacksAddress: currentAddress,
          webhookUrl: formData.webhookUrl || undefined
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed');
      }

      // Store API key in localStorage for immediate use
      localStorage.setItem('api_key', data.apiKeyTest);
      localStorage.setItem('merchant_id', data.id);
      
      setMerchantDetails(data);
      setStep('success');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToDashboard = () => {
    router.push('/dashboard');
  };

  if (step === 'wallet') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Register as Merchant</h2>
          <p className="text-gray-600">Connect your Stacks wallet to get started with sBTC payments</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <h3 className="font-medium text-blue-900 mb-2">What you'll get:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Instant API keys for testing</li>
              <li>✓ Dashboard to manage products & payments</li>
              <li>✓ Real-time payment notifications</li>
              <li>✓ Accept sBTC payments globally</li>
            </ul>
          </div>

          <button
            onClick={handleWalletConnect}
            disabled={loading || isConnected}
            className={`w-full py-3 px-4 rounded font-medium ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : isConnected
                ? 'bg-green-500 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {loading ? 'Connecting...' : isConnected ? '✓ Wallet Connected' : 'Connect Wallet'}
          </button>

          {isConnected && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Connected Address:</p>
              <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {currentAddress}
              </p>
              <button
                onClick={() => setStep('details')}
                className="mt-4 w-full py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Registration</h2>
          <p className="text-gray-600">Tell us about your business</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleRegistration} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Business Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, webhookUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://yourdomain.com/webhook"
            />
            <p className="text-xs text-gray-500 mt-1">
              Receive real-time payment notifications
            </p>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <p className="text-xs text-gray-600">
              <strong>Connected Address:</strong><br />
              <span className="font-mono">{currentAddress}</span>
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('wallet')}
              className="flex-1 py-2 px-4 border border-gray-300 rounded hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-2 px-4 rounded font-medium ${
                loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (step === 'success' && merchantDetails) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <div className="text-center mb-6">
          <div className="text-green-500 text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to sBTC Pay!</h2>
          <p className="text-gray-600">{merchantDetails.message}</p>
        </div>

        <div className="bg-gray-50 p-4 rounded mb-6">
          <h3 className="font-medium text-gray-900 mb-2">Your API Credentials</h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-gray-600">Test API Key:</p>
              <p className="font-mono text-xs bg-white px-2 py-1 rounded border">
                {merchantDetails.apiKeyTest}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Your API key has been saved. You can view it anytime in your dashboard.
            </p>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Next Steps:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create your first product</li>
            <li>• Start accepting sBTC payments</li>
            <li>• Monitor payments in your dashboard</li>
          </ul>
        </div>

        <button
          onClick={handleProceedToDashboard}
          className="w-full py-3 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return null;
}